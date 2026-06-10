<?php

namespace App\Http\Controllers;

use App\Models\PostponementRequest;
use Illuminate\Http\Request;

class PostponementRequestController extends Controller
{
    public function index()
    {
        return response()->json(PostponementRequest::with(['user', 'course'])->get());
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'user_id' => 'nullable|exists:users,id',
            'application_id' => 'nullable|string',
            'course_id' => 'required|exists:courses,id',
            'exam_title' => 'required|string',
            'reason' => 'required|string',
            'medical_cert' => 'boolean',
            'batch' => 'nullable|string',
            'exams' => 'nullable|array',
            'status' => 'nullable|string|in:pending,approved,rejected',
        ]);

        if (!isset($validated['user_id'])) {
            $validated['user_id'] = auth()->id() ?? 1;
        }
        $postponement = PostponementRequest::create($validated);
        \App\Http\Controllers\CourseController::clearManageCourseCache($postponement->course_id);

        return response()->json($postponement, 201);
    }

    public function myRequests(Request $request)
    {
        $user = $request->user();
        return response()->json(
            PostponementRequest::where('user_id', $user->id)
                ->with(['course'])
                ->latest()
                ->get()
        );
    }

    public function update(Request $request, $id)
    {
        $postponement = PostponementRequest::findOrFail($id);

        $validated = $request->validate([
            'application_id' => 'nullable|string',
            'exam_title' => 'nullable|string',
            'reason' => 'nullable|string',
            'status' => 'nullable|string',
            'stages' => 'nullable|array',
            'current_step' => 'nullable|integer',
            'rejection_reason' => 'nullable|string',
        ]);

        $postponement->update($validated);
        \App\Http\Controllers\CourseController::clearManageCourseCache($postponement->course_id);

        return response()->json($postponement);
    }

    public function destroy($id)
    {
        $postponement = PostponementRequest::findOrFail($id);
        $courseId = $postponement->course_id;
        $postponement->delete();
        \App\Http\Controllers\CourseController::clearManageCourseCache($courseId);
        return response()->json(['message' => 'Postponement request deleted successfully']);
    }
}
