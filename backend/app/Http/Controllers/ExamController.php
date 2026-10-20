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
            'type' => 'nullable|string',
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
            'type' => 'nullable|string',
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


        if ($request->has('postponements')) {
            $newPostponementIds = [];
            if (is_array($request->postponements)) {
                $newPostponementIds = collect($request->postponements)
                    ->filter(function ($id) {
                        return is_numeric($id);
                    })
                    ->map(function ($id) {
                        return (int)$id;
                    })
                    ->toArray();
            }


            \App\Models\PostponementRequest::where('assigned_exam_id', $exam->id)
                ->whereNotIn('id', $newPostponementIds)
                ->update(['assigned_exam_id' => null, 'status' => 'approved']);


            if (!empty($newPostponementIds)) {
                \App\Models\PostponementRequest::whereIn('id', $newPostponementIds)
                    ->update(['assigned_exam_id' => $exam->id, 'status' => 'assigned']);
            }
        }


        if ($request->has('reattempts')) {
            $newReattemptIds = [];
            if (is_array($request->reattempts)) {
                $newReattemptIds = collect($request->reattempts)
                    ->filter(function ($id) {
                        return is_numeric($id);
                    })
                    ->map(function ($id) {
                        return (int)$id;
                    })
                    ->toArray();
            }


            \App\Models\ReattemptRequest::where('assigned_exam_id', $exam->id)
                ->whereNotIn('id', $newReattemptIds)
                ->update(['assigned_exam_id' => null, 'status' => 'approved']);


            if (!empty($newReattemptIds)) {
                \App\Models\ReattemptRequest::whereIn('id', $newReattemptIds)
                    ->update(['assigned_exam_id' => $exam->id, 'status' => 'assigned']);
            }
        }

        \App\Http\Controllers\CourseController::clearManageCourseCache($exam->course_id);
        return response()->json($exam);
    }

    public function destroy($id)
    {
        $exam = Exam::findOrFail($id);
        $courseId = $exam->course_id;


        \App\Models\PostponementRequest::where('assigned_exam_id', $exam->id)
            ->update(['assigned_exam_id' => null, 'status' => 'approved']);

        \App\Models\ReattemptRequest::where('assigned_exam_id', $exam->id)
            ->update(['assigned_exam_id' => null, 'status' => 'approved']);

        $exam->delete();
        \App\Http\Controllers\CourseController::clearManageCourseCache($courseId);
        return response()->json(['message' => 'Exam deleted successfully']);
    }

    public function uploadTimetable(Request $request)
    {
        $request->validate([
            'file' => 'required|file|mimes:pdf,doc,docx|max:20480', 
        ]);

        $file = $request->file('file');
        $filename = 'timetable_' . time() . '_' . uniqid() . '.' . $file->getClientOriginalExtension();
        $path = $file->storeAs('timetables', $filename, 'public');

        $url = asset('storage/' . $path);

        return response()->json([
            'message' => 'Timetable uploaded successfully',
            'url' => $url,
            'filename' => $file->getClientOriginalName(),
        ]);
    }
}
