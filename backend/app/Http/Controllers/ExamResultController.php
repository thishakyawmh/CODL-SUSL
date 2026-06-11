<?php

namespace App\Http\Controllers;

use App\Models\ExamResult;
use App\Models\StudentGrade;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class ExamResultController extends Controller
{
    /**
     * Admin: list all exam results with relations.
     */
    public function index()
    {
        return response()->json(
            ExamResult::with(['course', 'subject', 'exam', 'lecturer', 'grades.user'])->get()
        );
    }

    /**
     * Admin: store grades for a subject and mark them as released.
     * Expected payload:
     * {
     *   "course_id": 1,
     *   "subject_id": 5,
     *   "exam_id": 3,
     *   "batch": "2024/01",
     *   "semester": "1",
     *   "grades": [{ "user_id": 12, "grade": "A" }, ...]
     * }
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'course_id'  => 'required|exists:courses,id',
            'subject_id' => 'required|exists:subjects,id',
            'exam_id'    => 'nullable|exists:exams,id',
            'batch'      => 'required|string',
            'semester'   => 'required|string',
            'min_repeat_grade' => 'nullable|string|max:5',
            'grades'     => 'required|array|min:1',
            'grades.*.user_id' => 'required|exists:users,id',
            'grades.*.grade'   => 'required|string|max:5',
            'grades.*.special_note' => 'nullable|string',
        ]);

        DB::beginTransaction();
        try {
            // Upsert: update existing result for same course+subject+exam, or create new
            $examResult = ExamResult::updateOrCreate(
                [
                    'course_id'  => $validated['course_id'],
                    'subject_id' => $validated['subject_id'],
                    'exam_id'    => $validated['exam_id'] ?? null,
                ],
                [
                    'batch'            => $validated['batch'],
                    'semester'         => $validated['semester'],
                    'status'           => 'released',
                    'student_count'    => count($validated['grades']),
                    'released_at'      => Carbon::now(),
                    'min_repeat_grade' => $validated['min_repeat_grade'] ?? 'D',
                ]
            );

            // Delete existing grades for this result then re-insert
            StudentGrade::where('exam_result_id', $examResult->id)->delete();

            $gradeRows = array_map(fn($g) => [
                'exam_result_id' => $examResult->id,
                'user_id'        => $g['user_id'],
                'grade'          => $g['grade'],
                'special_note'   => $g['special_note'] ?? null,
                'created_at'     => Carbon::now(),
                'updated_at'     => Carbon::now(),
            ], $validated['grades']);

            StudentGrade::insert($gradeRows);

            DB::commit();

            return response()->json(
                $examResult->load(['course', 'subject', 'exam', 'grades.user']),
                201
            );
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Failed to save results: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Student: return only this authenticated user's grades across all released results.
     */
    public function myResults()
    {
        $userId = Auth::id();

        $grades = StudentGrade::where('user_id', $userId)
            ->with([
                'examResult.course',
                'examResult.subject',
                'examResult.exam',
            ])
            ->whereHas('examResult', fn($q) => $q->where('status', 'released'))
            ->get()
            ->map(fn($g) => [
                'grade'        => $g->grade,
                'special_note' => $g->special_note,
                'exam_result'  => [
                    'id'               => $g->examResult->id,
                    'status'           => $g->examResult->status,
                    'released_at'      => $g->examResult->released_at,
                    'min_repeat_grade' => $g->examResult->min_repeat_grade,
                    'subject'          => $g->examResult->subject,
                    'course'           => $g->examResult->course ? [
                        'id'    => $g->examResult->course->id,
                        'title' => $g->examResult->course->title,
                    ] : null,
                    'exam'             => $g->examResult->exam ? [
                        'id'    => $g->examResult->exam->id,
                        'title' => $g->examResult->exam->title,
                    ] : null,
                ],
            ]);

        return response()->json($grades);
    }

    /**
     * Admin: get all released exam results for a specific exam.
     */
    public function getByExam($examId)
    {
        $results = ExamResult::where('exam_id', $examId)
            ->with(['subject', 'grades.user'])
            ->get();

        return response()->json($results);
    }
}
