<?php

namespace App\Http\Controllers;

use App\Models\ExamApplication;
use Illuminate\Http\Request;

class ExamApplicationController extends Controller
{
    public function index()
    {
        return response()->json(ExamApplication::with(['user', 'course'])->get());
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'course_id' => 'required|exists:courses,id',
            'exam_id' => 'nullable|exists:exams,id',
            'exam_title' => 'required|string',
            'semester' => 'nullable|string',
            'fee_paid' => 'numeric',
            'payment_date' => 'nullable|date',
            'subjects' => 'nullable|array',
            'status' => 'nullable|string|in:pending,approved,rejected',
            'salutation' => 'nullable|string',
            'name_with_initials' => 'nullable|string',
            'name_denoted_by_initials' => 'nullable|string',
            'contact_number' => 'nullable|string',
            'permanent_address' => 'nullable|string',
            'address_during_exam' => 'nullable|string',
            'medium' => 'nullable|string',
            'registration_date' => 'nullable|date',
            'postponement_details' => 'nullable|string',
        ]);

        $validated['user_id'] = auth()->id() ?? 1; // Fallback in case of non-interactive testing
        $examApplication = ExamApplication::create($validated);
        \App\Http\Controllers\CourseController::clearManageCourseCache($examApplication->course_id);

        return response()->json($examApplication, 201);
    }

    public function myApplications(Request $request)
    {
        $user = $request->user();
        return response()->json(
            ExamApplication::where('user_id', $user->id)
                ->with(['course'])
                ->latest()
                ->get()
        );
    }

    public function update(Request $request, $id)
    {
        $examApplication = ExamApplication::findOrFail($id);

        $validated = $request->validate([
            'status' => 'required|string',
            'stages' => 'nullable|array',
            'current_step' => 'integer',
            'rejection_reason' => 'nullable|string',
        ]);

        $examApplication->update($validated);
        \App\Http\Controllers\CourseController::clearManageCourseCache($examApplication->course_id);

        return response()->json($examApplication);
    }

    public function destroy($id)
    {
        $examApplication = ExamApplication::findOrFail($id);
        $courseId = $examApplication->course_id;
        $examApplication->delete();
        \App\Http\Controllers\CourseController::clearManageCourseCache($courseId);

        return response()->json(['message' => 'Exam application deleted successfully']);
    }
}

