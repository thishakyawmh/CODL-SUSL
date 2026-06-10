<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Exam;

class ExamController extends Controller
{
    public function index($courseId)
    {
        return response()->json(Exam::where('course_id', $courseId)->latest()->get());
    }

    public function store(Request $request, $courseId)
    {
        $validated = $request->validate([
            'title' => 'required|string',
            'batch_name' => 'nullable|string',
            'deadline' => 'nullable|date',
            'date' => 'nullable|date',
            'fee' => 'required|numeric',
            'type' => 'required|string',
            'status' => 'required|string',
            'timetable_path' => 'nullable|string',
            'postponements' => 'nullable|array',
            'reattempts' => 'nullable|array',
            'subjects' => 'nullable|array',
            'semester' => 'nullable|integer',
            'regulars' => 'nullable|array',
        ]);

        $examData = collect($validated)->except(['postponements', 'reattempts'])->toArray();
        $exam = Exam::create(array_merge($examData, ['course_id' => $courseId]));

        if ($request->has('postponements') && is_array($request->postponements)) {
            $postponementIds = collect($request->postponements)->filter(function ($id) {
                return is_numeric($id);
            });
            \App\Models\PostponementRequest::whereIn('id', $postponementIds)
                ->update(['assigned_exam_id' => $exam->id, 'status' => 'assigned']);
        }

        if ($request->has('reattempts') && is_array($request->reattempts)) {
            $reattemptIds = collect($request->reattempts)->filter(function ($id) {
                return is_numeric($id);
            });
            \App\Models\ReattemptRequest::whereIn('id', $reattemptIds)
                ->update(['assigned_exam_id' => $exam->id, 'status' => 'assigned']);
        }

        \App\Http\Controllers\CourseController::clearManageCourseCache($courseId);
        return response()->json($exam, 201);
    }

    public function update(Request $request, $id)
    {
        $exam = Exam::findOrFail($id);

        $validated = $request->validate([
            'title' => 'required|string',
            'batch_name' => 'nullable|string',
            'deadline' => 'nullable|date',
            'date' => 'nullable|date',
            'fee' => 'required|numeric',
            'type' => 'required|string',
            'status' => 'required|string',
            'timetable_path' => 'nullable|string',
            'postponements' => 'nullable|array',
            'reattempts' => 'nullable|array',
            'subjects' => 'nullable|array',
            'semester' => 'nullable|integer',
            'regulars' => 'nullable|array',
        ]);

        $examData = collect($validated)->except(['postponements', 'reattempts'])->toArray();
        $exam->update($examData);

        // Process Postponement Assignments
        $newPostponementIds = [];
        if ($request->has('postponements') && is_array($request->postponements)) {
            $newPostponementIds = collect($request->postponements)
                ->filter(function ($id) {
                    return is_numeric($id);
                })
                ->map(function ($id) {
                    return (int)$id;
                })
                ->toArray();
        }

        // Un-assign any postponement requests that were linked but are no longer selected
        \App\Models\PostponementRequest::where('assigned_exam_id', $exam->id)
            ->whereNotIn('id', $newPostponementIds)
            ->update(['assigned_exam_id' => null, 'status' => 'approved']);

        // Assign the new postponement requests
        if (!empty($newPostponementIds)) {
            \App\Models\PostponementRequest::whereIn('id', $newPostponementIds)
                ->update(['assigned_exam_id' => $exam->id, 'status' => 'assigned']);
        }

        // Process Reattempt Assignments
        $newReattemptIds = [];
        if ($request->has('reattempts') && is_array($request->reattempts)) {
            $newReattemptIds = collect($request->reattempts)
                ->filter(function ($id) {
                    return is_numeric($id);
                })
                ->map(function ($id) {
                    return (int)$id;
                })
                ->toArray();
        }

        // Un-assign any reattempt requests that were linked but are no longer selected
        \App\Models\ReattemptRequest::where('assigned_exam_id', $exam->id)
            ->whereNotIn('id', $newReattemptIds)
            ->update(['assigned_exam_id' => null, 'status' => 'approved']);

        // Assign the new reattempt requests
        if (!empty($newReattemptIds)) {
            \App\Models\ReattemptRequest::whereIn('id', $newReattemptIds)
                ->update(['assigned_exam_id' => $exam->id, 'status' => 'assigned']);
        }

        \App\Http\Controllers\CourseController::clearManageCourseCache($exam->course_id);
        return response()->json($exam);
    }

    public function destroy($id)
    {
        $exam = Exam::findOrFail($id);
        $courseId = $exam->course_id;

        // Revert status of assigned requests to approved
        \App\Models\PostponementRequest::where('assigned_exam_id', $exam->id)
            ->update(['assigned_exam_id' => null, 'status' => 'approved']);

        \App\Models\ReattemptRequest::where('assigned_exam_id', $exam->id)
            ->update(['assigned_exam_id' => null, 'status' => 'approved']);

        $exam->delete();
        \App\Http\Controllers\CourseController::clearManageCourseCache($courseId);
        return response()->json(['message' => 'Exam deleted successfully']);
    }
}
