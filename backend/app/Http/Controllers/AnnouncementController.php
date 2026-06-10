<?php

namespace App\Http\Controllers;

use App\Models\Announcement;
use Illuminate\Http\Request;

class AnnouncementController extends Controller
{
    public function index(Request $request)
    {
        $query = Announcement::query();

        if ($request->has('course_id')) {
            $query->where('course_id', $request->query('course_id'));
        }

        if ($request->has('batch')) {
            $query->where(function ($q) use ($request) {
                $q->where('batch', $request->query('batch'))
                  ->orWhereNull('batch');
            });
        }

        return response()->json($query->latest()->get());
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'course_id' => 'nullable|exists:courses,id',
            'batch' => 'nullable|string',
            'title' => 'required|string',
            'desc' => 'required|string',
            'type' => 'nullable|string',
        ]);

        $announcement = Announcement::create($validated);
        if ($announcement->course_id) {
            \App\Http\Controllers\CourseController::clearManageCourseCache($announcement->course_id);
        }

        return response()->json($announcement, 201);
    }

    public function destroy($id)
    {
        $announcement = Announcement::findOrFail($id);
        $courseId = $announcement->course_id;
        $announcement->delete();
        if ($courseId) {
            \App\Http\Controllers\CourseController::clearManageCourseCache($courseId);
        }

        return response()->json(['message' => 'Announcement deleted successfully']);
    }
}
