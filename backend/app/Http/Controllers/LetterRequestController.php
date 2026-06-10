<?php

namespace App\Http\Controllers;

use App\Models\LetterRequest;
use Illuminate\Http\Request;

class LetterRequestController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        $query = LetterRequest::with([
            'user:id,full_name,display_name,email,student_number',
            'course:id,title,code,secretary_id,coordinator_id',
            'secretaryUser:id,full_name,display_name',
            'coordinatorUser:id,full_name,display_name',
            'directorUser:id,full_name,display_name',
        ]);

        if ($user->role === 'student') {
            $query->where('user_id', $user->id);
        } elseif ($user->role === 'secretary') {
            $courseIds = \App\Models\Course::where('secretary_id', $user->id)->pluck('id');
            $query->whereIn('course_id', $courseIds);
        } elseif ($user->role === 'coordinator') {
            $courseIds = \App\Models\Course::where('coordinator_id', $user->id)->pluck('id');
            $query->whereIn('course_id', $courseIds)->where('approval_level', '>=', 1);
        } elseif ($user->role === 'director') {
            $query->where('approval_level', '>=', 2);
        }

        return response()->json($query->orderBy('created_at', 'desc')->get());
    }

    public function store(Request $request)
    {
        $user = $request->user();
        
        $validated = $request->validate([
            'course_id' => 'required|exists:courses,id',
            'letter_type' => 'required|string',
            'reason' => 'required|string',
            'name_with_initials' => 'required|string',
            'address' => 'required|string',
            'phone' => 'required|string',
            'nic' => 'required|string',
            'year' => 'required|string',
            'batch' => 'required|string',
            'registration_number' => 'required|string',
        ]);

        $letterRequest = LetterRequest::create(array_merge($validated, [
            'user_id' => $user->id,
            'status' => 'pending',
            'approval_level' => 0,
        ]));

        return response()->json($letterRequest->load(['user', 'course', 'secretaryUser', 'coordinatorUser', 'directorUser']), 201);
    }

    public function approve(Request $request, $id)
    {
        $letterRequest = LetterRequest::with(['user', 'course'])->findOrFail($id);

        if ($letterRequest->status === 'rejected') {
            return response()->json(['message' => 'This request has been rejected and cannot be approved.'], 422);
        }

        $user = $request->user();
        $comment = $request->input('comment', '');

        if ($user->role === 'super_admin') {
            return response()->json(['message' => 'Super Admin can only view letter requests and cannot perform approvals.'], 403);
        }

        $nextLevel = $letterRequest->approval_level + 1;

        if ($nextLevel > 3) {
            return response()->json(['message' => 'Letter request is already fully approved.'], 400);
        }

        switch ($nextLevel) {
            case 1:
                if ($user->role !== 'secretary' || $letterRequest->course->secretary_id !== $user->id) {
                    return response()->json(['message' => 'Only the Course Secretary assigned to this course can approve Stage 1.'], 403);
                }
                $letterRequest->approved_by_secretary = $user->id;
                $letterRequest->secretary_comment = $comment;
                $letterRequest->secretary_approved_at = now();
                $letterRequest->approval_level = 1;
                $letterRequest->status = 'pending';
                break;
            case 2:
                if ($user->role !== 'coordinator' || $letterRequest->course->coordinator_id !== $user->id) {
                    return response()->json(['message' => 'Only the Course Coordinator assigned to this course can approve Stage 2.'], 403);
                }
                $letterRequest->approved_by_coordinator = $user->id;
                $letterRequest->coordinator_comment = $comment;
                $letterRequest->coordinator_approved_at = now();
                $letterRequest->approval_level = 2;
                $letterRequest->status = 'pending';
                break;
            case 3:
                if ($user->role !== 'director') {
                    return response()->json(['message' => 'Only the Director can approve Stage 3.'], 403);
                }
                $letterRequest->approved_by_director = $user->id;
                $letterRequest->director_comment = $comment;
                $letterRequest->director_approved_at = now();
                $letterRequest->approval_level = 3;
                $letterRequest->status = 'approved';
                break;
        }

        $letterRequest->save();

        // Log admin activity
        $targetDesc = "Letter Request #{$letterRequest->id} for " . ($letterRequest->user ? $letterRequest->user->full_name : 'Student') . " in " . ($letterRequest->course ? $letterRequest->course->code : 'N/A');
        \App\Models\ActivityLog::log(
            $user->id,
            "Approved Stage {$nextLevel} of Letter Request",
            $targetDesc,
            'approval'
        );

        return response()->json($letterRequest->load(['user', 'course', 'secretaryUser', 'coordinatorUser', 'directorUser']));
    }

    public function reject(Request $request, $id)
    {
        $letterRequest = LetterRequest::with(['user', 'course'])->findOrFail($id);

        if ($letterRequest->status !== 'pending') {
            return response()->json(['message' => 'This request is already ' . $letterRequest->status . ' and cannot be modified.'], 422);
        }

        $user = $request->user();
        $comment = $request->input('comment', '');

        if ($user->role === 'super_admin') {
            return response()->json(['message' => 'Super Admin can only view letter requests and cannot perform rejections.'], 403);
        }

        $nextLevel = $letterRequest->approval_level + 1;

        switch ($nextLevel) {
            case 1:
                if ($user->role !== 'secretary' || $letterRequest->course->secretary_id !== $user->id) {
                    return response()->json(['message' => 'Only the Course Secretary assigned to this course can reject Stage 1.'], 403);
                }
                $letterRequest->approved_by_secretary = $user->id;
                $letterRequest->secretary_comment = $comment;
                $letterRequest->secretary_approved_at = now();
                break;
            case 2:
                if ($user->role !== 'coordinator' || $letterRequest->course->coordinator_id !== $user->id) {
                    return response()->json(['message' => 'Only the Course Coordinator assigned to this course can reject Stage 2.'], 403);
                }
                $letterRequest->approved_by_coordinator = $user->id;
                $letterRequest->coordinator_comment = $comment;
                $letterRequest->coordinator_approved_at = now();
                break;
            case 3:
                if ($user->role !== 'director') {
                    return response()->json(['message' => 'Only the Director can reject Stage 3.'], 403);
                }
                $letterRequest->approved_by_director = $user->id;
                $letterRequest->director_comment = $comment;
                $letterRequest->director_approved_at = now();
                break;
        }

        $letterRequest->status = 'rejected';
        $letterRequest->save();

     
        $targetDesc = "Letter Request #{$letterRequest->id} for " . ($letterRequest->user ? $letterRequest->user->full_name : 'Student') . " in " . ($letterRequest->course ? $letterRequest->course->code : 'N/A');
        \App\Models\ActivityLog::log(
            $user->id,
            "Rejected Letter Request (Stage {$nextLevel})",
            $targetDesc,
            'approval'
        );

        return response()->json($letterRequest->load(['user', 'course', 'secretaryUser', 'coordinatorUser', 'directorUser']));
    }

    public function updateStatus(Request $request, $id)
    {
        $validated = $request->validate([
            'status' => 'required|string|in:pending,approved,rejected',
        ]);

        $letterRequest = LetterRequest::with(['user', 'course'])->findOrFail($id);
        $letterRequest->update($validated);

        
        $user = $request->user();
        $targetDesc = "Letter Request #{$letterRequest->id} for " . ($letterRequest->user ? $letterRequest->user->full_name : 'Student') . " in " . ($letterRequest->course ? $letterRequest->course->code : 'N/A');
        \App\Models\ActivityLog::log(
            $user->id,
            "Updated Letter Request status to {$validated['status']}",
            $targetDesc,
            'system'
        );

        return response()->json($letterRequest);
    }
}
