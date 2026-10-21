<?php

namespace App\Http\Controllers;

use App\Models\Announcement;
use App\Models\Course;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class AnnouncementController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        $query = Announcement::with(['course:id,title,code', 'author:id,full_name,role']);

        // Course filter
        if ($request->has('course_id') && $request->query('course_id') !== '') {
            $courseId = $request->query('course_id');
            $query->where('course_id', $courseId);

            if ($user && $user->role === 'student') {
                $enrollment = DB::table('user_courses')
                    ->where('user_id', $user->id)
                    ->where('course_id', $courseId)
                    ->first();

                $studentBatch = $enrollment && !empty($enrollment->batch) ? $enrollment->batch : ($request->query('batch') ?: null);
                $studentGroup = $enrollment && !empty($enrollment->group) ? $enrollment->group : ($request->query('group') ?: null);

                if ($studentBatch) {
                    $query->where(function ($q) use ($studentBatch) {
                        $q->where('batch', $studentBatch)
                          ->orWhereNull('batch');
                    });
                }

                if ($studentGroup) {
                    $query->where(function ($q) use ($studentGroup) {
                        $q->where('group', $studentGroup)
                          ->orWhereNull('group');
                    });
                } else {
                    $query->whereNull('group');
                }
            } else {
                // Non-student (coordinator, admin, etc.) can filter by batch or group if specified
                if ($request->has('batch') && $request->query('batch') !== '') {
                    $batch = $request->query('batch');
                    $query->where(function ($q) use ($batch) {
                        $q->where('batch', $batch)
                          ->orWhereNull('batch');
                    });
                }

                if ($request->has('group') && $request->query('group') !== '') {
                    $group = $request->query('group');
                    $query->where(function ($q) use ($group) {
                        $q->where('group', $group)
                          ->orWhereNull('group');
                    });
                }
            }

            return response()->json($query->latest()->get());
        }

        // Global dashboard or all announcements view
        if ($user && $user->role === 'student') {
            // Find student's enrolled courses and the staff assigned to those courses
            $enrolledCourseIds = DB::table('user_courses')
                ->where('user_id', $user->id)
                ->pluck('course_id')
                ->toArray();

            $assignedStaffIds = Course::whereIn('id', $enrolledCourseIds)
                ->pluck('coordinator_id')
                ->concat(Course::whereIn('id', $enrolledCourseIds)->pluck('secretary_id'))
                ->filter()
                ->unique()
                ->toArray();

            // Students only see:
            // 1. Global announcements from super_admin / director / admin
            // 2. Announcements from coordinators/secretaries of courses they are enrolled in
            $query->whereNull('course_id')
                  ->where(function ($q) use ($assignedStaffIds) {
                      $q->whereIn('author_role', ['super_admin', 'director', 'admin'])
                        ->orWhereNull('author_role')
                        ->orWhereIn('author_id', $assignedStaffIds);
                  });
        } elseif ($user && in_array($user->role, ['coordinator', 'secretary'])) {
            // Coordinator or secretary viewing admin announcements list:
            // Show their own announcements + announcements for courses assigned to them + super_admin/director global broadcasts
            $assignedCourses = Course::where($user->role === 'coordinator' ? 'coordinator_id' : 'secretary_id', $user->id)
                ->pluck('id')
                ->toArray();

            $query->where(function ($q) use ($user, $assignedCourses) {
                $q->where('author_id', $user->id)
                  ->orWhereIn('course_id', $assignedCourses)
                  ->orWhere(function ($gq) {
                      $gq->whereNull('course_id')
                         ->whereIn('author_role', ['super_admin', 'director', 'admin']);
                  });
            });

            if ($request->query('global_only') === 'true') {
                $query->whereNull('course_id');
            }
        } else {
            // Super admin, director, etc.
            if ($request->query('global_only') === 'true') {
                $query->whereNull('course_id');
            }
        }

        return response()->json($query->latest()->get());
    }

    public function store(Request $request)
    {
        $user = $request->user();

        if ($user && in_array($user->role, ['student', 'applicant'])) {
            return response()->json(['message' => 'Unauthorized to create announcements.'], 403);
        }

        $validated = $request->validate([
            'course_id' => 'nullable|exists:courses,id',
            'batch' => 'nullable|string|max:100',
            'group' => 'nullable|string|max:100',
            'title' => 'required|string|max:255',
            'desc' => 'required|string',
            'type' => 'nullable|string|max:50',
            'file' => 'nullable|file|mimes:pdf,doc,docx,ppt,pptx,xls,xlsx,png,jpg,jpeg,txt,csv,zip|max:20480',
            'attachment_url' => 'nullable|string',
            'attachment_name' => 'nullable|string',
            'attachment_size' => 'nullable|string',
        ]);

        // Security check for coordinator/secretary:
        if ($user && in_array($user->role, ['coordinator', 'secretary'])) {
            $field = $user->role === 'coordinator' ? 'coordinator_id' : 'secretary_id';
            if (!empty($validated['course_id'])) {
                $isAssigned = Course::where('id', $validated['course_id'])
                    ->where($field, $user->id)
                    ->exists();

                if (!$isAssigned) {
                    return response()->json(['message' => 'Unauthorized: You are not assigned to this course.'], 403);
                }
            } else {
                // Must have at least one assigned course to broadcast
                $hasAssignedCourses = Course::where($field, $user->id)->exists();
                if (!$hasAssignedCourses) {
                    return response()->json(['message' => 'Unauthorized: You do not have any assigned courses to broadcast to.'], 403);
                }
            }
        }

        $validated['author_id'] = $user ? $user->id : null;
        $validated['author_role'] = $user ? $user->role : null;

        if ($request->hasFile('file')) {
            $file = $request->file('file');
            $filename = 'announcement_' . time() . '_' . uniqid() . '.' . $file->getClientOriginalExtension();
            $path = $file->storeAs('announcements', $filename, 'public');
            
            $validated['attachment_url'] = asset('storage/' . $path);
            $validated['attachment_name'] = $file->getClientOriginalName();
            
            $bytes = $file->getSize();
            if ($bytes === 0) {
                $validated['attachment_size'] = '0 Bytes';
            } else {
                $k = 1024;
                $sizes = ['Bytes', 'KB', 'MB', 'GB'];
                $i = floor(log($bytes) / log($k));
                $validated['attachment_size'] = round($bytes / pow($k, $i), 2) . ' ' . $sizes[$i];
            }
        }

        unset($validated['file']);

        $announcement = Announcement::create($validated);
        if ($announcement->course_id) {
            \App\Http\Controllers\CourseController::clearManageCourseCache($announcement->course_id);
        }

        return response()->json($announcement, 201);
    }

    public function destroy(Request $request, $id)
    {
        $announcement = Announcement::findOrFail($id);
        $user = $request->user();

        // Security check:
        if ($user && in_array($user->role, ['coordinator', 'secretary'])) {
            if ($announcement->author_id !== $user->id) {
                $field = $user->role === 'coordinator' ? 'coordinator_id' : 'secretary_id';
                $isCourseAssigned = $announcement->course_id && Course::where('id', $announcement->course_id)
                    ->where($field, $user->id)
                    ->exists();

                if (!$isCourseAssigned) {
                    return response()->json(['message' => 'Unauthorized to delete this announcement.'], 403);
                }
            }
        }

        $courseId = $announcement->course_id;

        if ($announcement->attachment_url) {
            $parsed = parse_url($announcement->attachment_url, PHP_URL_PATH);
            if ($parsed) {
                $relativePath = preg_replace('/^\/?storage\//', '', $parsed);
                if ($relativePath && Storage::disk('public')->exists($relativePath)) {
                    Storage::disk('public')->delete($relativePath);
                }
            }
        }

        $announcement->delete();
        if ($courseId) {
            \App\Http\Controllers\CourseController::clearManageCourseCache($courseId);
        }

        return response()->json(['message' => 'Announcement deleted successfully']);
    }
}
