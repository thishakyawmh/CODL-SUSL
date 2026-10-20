<?php

namespace App\Http\Controllers;

use App\Models\Announcement;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class AnnouncementController extends Controller
{
    public function index(Request $request)
    {
        $query = Announcement::query();

        if ($request->has('course_id')) {
            $query->where('course_id', $request->query('course_id'));
        }

        if ($request->query('global_only') === 'true') {
            $query->whereNull('course_id');
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
            'file' => 'nullable|file|max:20480',
            'attachment_url' => 'nullable|string',
            'attachment_name' => 'nullable|string',
            'attachment_size' => 'nullable|string',
        ]);

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

    public function destroy($id)
    {
        $announcement = Announcement::findOrFail($id);
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
