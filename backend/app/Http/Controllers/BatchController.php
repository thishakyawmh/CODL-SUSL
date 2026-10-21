<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Batch;
use App\Models\Course;
use Illuminate\Support\Facades\DB;

class BatchController extends Controller
{
    public function index(Request $request, $courseId)
    {
        $user = $request->user();
        
        
        if ($user && $user->role === 'secretary') {
            $course = Course::where('secretary_id', $user->id)->find($courseId);
            if (!$course) {
                return response()->json(['message' => 'Unauthorized to access batches for this course.'], 403);
            }
        } elseif ($user && $user->role === 'coordinator') {
            $course = Course::where('coordinator_id', $user->id)->find($courseId);
            if (!$course) {
                return response()->json(['message' => 'Unauthorized to access batches for this course.'], 403);
            }
        } elseif ($user && $user->role === 'lecturer') {
            
            $hasAssignment = DB::table('batch_subject_instructor')
                ->join('batches', 'batches.id', '=', 'batch_subject_instructor.batch_id')
                ->where('batches.course_id', $courseId)
                ->where('batch_subject_instructor.instructor_id', $user->id)
                ->exists();
            
            if (!$hasAssignment) {
                $isBatchInstructor = Batch::where('course_id', $courseId)
                    ->where('instructor_id', $user->id)
                    ->exists();
                if (!$isBatchInstructor) {
                    return response()->json(['message' => 'Unauthorized to access batches for this course.'], 403);
                }
            }
        }

        
        Batch::where('course_id', $courseId)
            ->where('status', 'Upcoming')
            ->whereNotNull('registration_deadline')
            ->where('registration_deadline', '<', now()->toDateString())
            ->update(['status' => 'Active']);

        
        $query = Batch::where('course_id', $courseId)
            ->select([
                'id',
                'course_id',
                'instructor_id',
                'name',
                'start_date',
                'registration_deadline',
                'max_enrollments',
                'subtitle',
                'status',
                'groups',
                'created_at',
                'updated_at'
            ]);
        if ($user && $user->role === 'lecturer') {
            $query->where(function ($q) use ($user) {
                $q->whereHas('subjects', function ($subQ) use ($user) {
                    $subQ->where('batch_subject_instructor.instructor_id', $user->id);
                })->orWhere('instructor_id', $user->id);
            });
        }
        $batches = $query->with([
                'subjects' => function ($query) {
                    $query->withPivot('instructor_id');
                },
                'instructor:id,full_name'
            ])
            ->latest()
            ->get();

        
        $instructorIds = [];
        foreach ($batches as $batch) {
            foreach ($batch->subjects as $subject) {
                if ($subject->pivot->instructor_id) {
                    $instructorIds[] = $subject->pivot->instructor_id;
                }
            }
        }
        $instructorIds = array_unique($instructorIds);
        
        $instructors = !empty($instructorIds) 
            ? \App\Models\User::whereIn('id', $instructorIds)->select('id', 'full_name')->get()->keyBy('id')
            : collect();

        $batches->each(function ($batch) use ($instructors) {
            $batch->subjects->each(function ($subject) use ($instructors) {
                $instructorId = $subject->pivot->instructor_id;
                if ($instructorId && isset($instructors[$instructorId])) {
                    $subject->pivot->instructor_name = $instructors[$instructorId]->full_name;
                } else {
                    $subject->pivot->instructor_name = null;
                }
            });
        });

        return response()->json($batches);
    }

    public function store(Request $request, $courseId)
    {
        $validated = $request->validate([
            'name' => 'required|string',
            'start_date' => 'required|date',
            'registration_deadline' => 'nullable|date',
            'max_enrollments' => 'required|integer',
            'subtitle' => 'nullable|string',
            'status' => 'required|string',
            'instructor_id' => 'nullable|exists:users,id',
            'materials' => 'nullable|array',
            'groups' => 'nullable|array',
            'groups.*' => 'string|max:100',
        ]);

        $batch = Batch::create(array_merge($validated, ['course_id' => $courseId]));
        $batch->load('instructor:id,full_name');
        \App\Http\Controllers\CourseController::clearManageCourseCache($courseId);
        return response()->json($batch, 201);
    }

    public function update(Request $request, $courseId, $batchId)
    {
        $batch = Batch::where('course_id', $courseId)->findOrFail($batchId);
        
        $validated = $request->validate([
            'name' => 'required|string',
            'start_date' => 'required|date',
            'registration_deadline' => 'nullable|date',
            'max_enrollments' => 'required|integer',
            'subtitle' => 'nullable|string',
            'status' => 'required|string',
            'instructor_id' => 'nullable|exists:users,id',
            'materials' => 'nullable|array',
            'groups' => 'nullable|array',
            'groups.*' => 'string|max:100',
        ]);

        $batch->update($validated);

        
        if ($request->has('subjects')) {
            $subjectsData = [];
            foreach ($request->input('subjects') as $subjectEntry) {
                $subjectId = $subjectEntry['subject_id'] ?? null;
                $lecturerId = $subjectEntry['lecturer_id'] ?? null;
                if ($subjectId) {
                    $subjectsData[$subjectId] = ['instructor_id' => $lecturerId];
                }
            }
            $batch->subjects()->sync($subjectsData);
        }

        
        $batch->load([
            'subjects' => function ($query) {
                $query->withPivot('instructor_id');
            },
            'instructor:id,full_name'
        ]);

        
        $batch->subjects->each(function ($subject) {
            $instructorId = $subject->pivot->instructor_id;
            if ($instructorId) {
                $instructor = \App\Models\User::select('id', 'full_name')->find($instructorId);
                $subject->pivot->instructor_name = $instructor ? $instructor->full_name : null;
            } else {
                $subject->pivot->instructor_name = null;
            }
        });

        \App\Http\Controllers\CourseController::clearManageCourseCache($courseId);

        return response()->json($batch);
    }

    public function destroy($courseId, $batchId)
    {
        $batch = Batch::where('course_id', $courseId)->findOrFail($batchId);
        $batch->delete();
        \App\Http\Controllers\CourseController::clearManageCourseCache($courseId);
        return response()->json(['message' => 'Batch deleted successfully.']);
    }

    public function uploadMaterial(Request $request, $batchId)
    {
        $request->validate([
            'file' => 'required|file|max:20480', 
        ]);

        $file = $request->file('file');
        $filename = 'material_' . $batchId . '_' . time() . '_' . uniqid() . '.' . $file->getClientOriginalExtension();
        $path = $file->storeAs('materials', $filename, 'public');

        $url = asset('storage/' . $path);

        return response()->json([
            'message' => 'Material uploaded successfully',
            'url' => $url,
            'filename' => $file->getClientOriginalName(),
            'size' => $file->getSize()
        ]);
    }

    public function getMaterials($courseId, $batchId)
    {
        $batch = Batch::where('course_id', $courseId)->findOrFail($batchId);
        return response()->json($batch->materials ?: []);
    }

    public function manageGroups(Request $request, $courseId, $batchId)
    {
        $batch = Batch::where('course_id', $courseId)->findOrFail($batchId);

        $validated = $request->validate([
            'groups' => 'required|array',
            'groups.*' => 'string|max:100',
            'assignments' => 'nullable|array',
            'assignments.*.student_id' => 'required',
            'assignments.*.group' => 'nullable|string|max:100',
            'assignments.*.set_batch' => 'nullable|boolean',
        ]);

        $cleanGroups = array_values(array_unique(array_filter(array_map('trim', $validated['groups']))));
        $batch->groups = $cleanGroups;
        $batch->save();

        $admin = $request->user();

        if (isset($validated['assignments']) && is_array($validated['assignments'])) {
            $course = Course::findOrFail($courseId);
            foreach ($validated['assignments'] as $item) {
                $studentId = $item['student_id'];
                $group = isset($item['group']) && trim($item['group']) !== '' ? trim($item['group']) : null;
                if ($group !== null && !in_array($group, $cleanGroups)) {
                    $group = null;
                }

                $user = \App\Models\User::where('id', $studentId)
                    ->orWhere('student_number', $studentId)
                    ->first();

                if ($user) {
                    $existingPivot = DB::table('user_courses')
                        ->where('user_id', $user->id)
                        ->where('course_id', $courseId)
                        ->first();

                    $oldGroup = $existingPivot ? $existingPivot->group : null;

                    $pivotUpdate = ['group' => $group];
                    if ($group !== null || !empty($item['set_batch'])) {
                        $pivotUpdate['batch'] = $batch->name;
                    }
                    $course->students()->updateExistingPivot($user->id, $pivotUpdate);

                    if ($group !== null && $group !== $oldGroup) {
                        \App\Models\GroupExchangeHistory::create([
                            'user_id' => $user->id,
                            'course_id' => $courseId,
                            'batch_name' => $batch->name,
                            'from_group' => $oldGroup,
                            'to_group' => $group,
                            'changed_by' => $admin ? $admin->id : null,
                            'method' => 'manual_assignment',
                        ]);
                    }
                }
            }
        }

        \App\Http\Controllers\CourseController::clearManageCourseCache($courseId);

        if ($admin) {
            \App\Models\ActivityLog::log(
                $admin->id,
                "Updated groups for batch {$batch->name}",
                "Groups: " . implode(', ', $cleanGroups) . " in course ID {$courseId}",
                'course'
            );
        }

        return response()->json([
            'message' => 'Batch groups updated successfully',
            'groups' => $batch->groups,
            'batch' => $batch
        ]);
    }

    public function getGroupRequests($courseId, $batchId)
    {
        $batch = Batch::where('course_id', $courseId)->findOrFail($batchId);

        $requests = \App\Models\GroupExchangeRequest::where('course_id', $courseId)
            ->where(function ($q) use ($batch) {
                $q->where('batch_id', $batch->id)
                  ->orWhere('batch_name', $batch->name);
            })
            ->with(['user:id,student_number,full_name,display_name,email', 'actionUser:id,full_name'])
            ->latest()
            ->get();

        $userIds = $requests->pluck('user_id')->unique();
        $histories = \App\Models\GroupExchangeHistory::whereIn('user_id', $userIds)
            ->where('course_id', $courseId)
            ->orderBy('created_at', 'desc')
            ->get()
            ->groupBy('user_id');

        $requests->each(function ($req) use ($histories) {
            $userHistory = $histories->get($req->user_id, collect());
            $req->exchange_history = $userHistory->map(function ($h) {
                return [
                    'id' => $h->id,
                    'date' => $h->created_at->format('Y-m-d'),
                    'datetime' => $h->created_at->format('Y-m-d H:i'),
                    'from_group' => $h->from_group,
                    'to_group' => $h->to_group,
                    'method' => $h->method,
                    'text' => $h->created_at->format('Y-m-d') . " exchanged into group " . $h->to_group,
                ];
            });
        });

        return response()->json([
            'batch' => $batch,
            'requests' => $requests,
        ]);
    }

    public function resolveGroupRequest(Request $request, $courseId, $batchId, $requestId)
    {
        $batch = Batch::where('course_id', $courseId)->findOrFail($batchId);
        $exchangeRequest = \App\Models\GroupExchangeRequest::where('course_id', $courseId)
            ->findOrFail($requestId);

        $validated = $request->validate([
            'action' => 'required|in:approve,reject',
            'comment' => 'nullable|string|max:500',
        ]);

        if ($exchangeRequest->status !== 'pending') {
            return response()->json([
                'message' => "This request has already been {$exchangeRequest->status}."
            ], 400);
        }

        $staff = $request->user();
        $action = $validated['action'];

        if ($action === 'approve') {
            $course = Course::findOrFail($courseId);
            $oldGroup = $exchangeRequest->current_group;
            $newGroup = $exchangeRequest->requested_group;

            $course->students()->updateExistingPivot($exchangeRequest->user_id, [
                'group' => $newGroup,
                'batch' => $batch->name
            ]);

            \App\Models\GroupExchangeHistory::create([
                'user_id' => $exchangeRequest->user_id,
                'course_id' => $courseId,
                'batch_name' => $batch->name,
                'from_group' => $oldGroup,
                'to_group' => $newGroup,
                'changed_by' => $staff ? $staff->id : null,
                'method' => 'request_approval',
            ]);

            $exchangeRequest->update([
                'status' => 'approved',
                'action_by' => $staff ? $staff->id : null,
                'action_at' => now(),
                'action_comment' => $validated['comment'] ?? null,
            ]);

            \App\Http\Controllers\CourseController::clearManageCourseCache($courseId);

            if ($staff) {
                \App\Models\ActivityLog::log(
                    $staff->id,
                    "Approved group exchange",
                    "Approved student ID {$exchangeRequest->user_id} exchange from {$oldGroup} to {$newGroup} in {$course->title} ({$batch->name})",
                    'course'
                );
            }

            return response()->json([
                'message' => "Group exchange request approved. Student has been moved to {$newGroup}.",
                'request' => $exchangeRequest->fresh(['user:id,student_number,full_name,display_name,email', 'actionUser:id,full_name']),
            ]);
        } else {
            $exchangeRequest->update([
                'status' => 'rejected',
                'action_by' => $staff ? $staff->id : null,
                'action_at' => now(),
                'action_comment' => $validated['comment'] ?? null,
            ]);

            if ($staff) {
                \App\Models\ActivityLog::log(
                    $staff->id,
                    "Rejected group exchange",
                    "Rejected student ID {$exchangeRequest->user_id} exchange to {$exchangeRequest->requested_group} in course ID {$courseId}",
                    'course'
                );
            }

            return response()->json([
                'message' => "Group exchange request rejected.",
                'request' => $exchangeRequest->fresh(['user:id,student_number,full_name,display_name,email', 'actionUser:id,full_name']),
            ]);
        }
    }
}

