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

        
        $query = Batch::where('course_id', $courseId);
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

        
        $batches->each(function ($batch) {
            $batch->subjects->each(function ($subject) {
                $instructorId = $subject->pivot->instructor_id;
                if ($instructorId) {
                    $instructor = \App\Models\User::select('id', 'full_name')->find($instructorId);
                    $subject->pivot->instructor_name = $instructor ? $instructor->full_name : null;
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
            'file' => 'required|file|max:20480', // 20MB max
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
}

