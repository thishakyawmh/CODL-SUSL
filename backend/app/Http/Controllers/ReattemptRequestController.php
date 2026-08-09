<?php

namespace App\Http\Controllers;

use App\Models\ReattemptRequest;
use Illuminate\Http\Request;

class ReattemptRequestController extends Controller
{
    public function index()
    {
        return response()->json(ReattemptRequest::with(['user', 'course', 'subject'])->get());
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'user_id' => 'nullable|exists:users,id',
            'application_id' => 'nullable|string',
            'course_id' => 'required|exists:courses,id',
            'subject_id' => 'required|exists:subjects,id',
            'exam_title' => 'nullable|string',
            'reason' => 'nullable|string',
            'previous_grade' => 'nullable|string',
            'attempt' => 'nullable|integer',
            'batch' => 'nullable|string',
            'status' => 'nullable|string|in:pending,approved,rejected,assigned',
            'assigned_exam_id' => 'nullable|exists:exams,id',
        ]);

        if (!isset($validated['user_id'])) {
            $validated['user_id'] = auth()->id() ?? 1;
        }
        $reattempt = ReattemptRequest::create($validated);
        \App\Http\Controllers\CourseController::clearManageCourseCache($reattempt->course_id);

        return response()->json($reattempt, 201);
    }

    public function myRequests(Request $request)
    {
        $user = $request->user();
        return response()->json(
            ReattemptRequest::where('user_id', $user->id)
                ->with(['course', 'subject'])
                ->latest()
                ->get()
        );
    }

    public function update(Request $request, $id)
    {
        $reattempt = ReattemptRequest::findOrFail($id);

        $validated = $request->validate([
            'application_id' => 'nullable|string',
            'subject_id' => 'nullable|exists:subjects,id',
            'exam_title' => 'nullable|string',
            'reason' => 'nullable|string',
            'previous_grade' => 'nullable|string',
            'attempt' => 'nullable|integer',
            'batch' => 'nullable|string',
            'status' => 'nullable|string',
            'stages' => 'nullable|array',
            'current_step' => 'nullable|integer',
            'rejection_reason' => 'nullable|string',
            'assigned_exam_id' => 'nullable|exists:exams,id',
        ]);

        $reattempt->update($validated);
        \App\Http\Controllers\CourseController::clearManageCourseCache($reattempt->course_id);

        return response()->json($reattempt);
    }

    public function destroy($id)
    {
        $reattempt = ReattemptRequest::findOrFail($id);
        $courseId = $reattempt->course_id;
        $reattempt->delete();
        \App\Http\Controllers\CourseController::clearManageCourseCache($courseId);
        return response()->json(['message' => 'Reattempt request deleted successfully']);
    }
}
