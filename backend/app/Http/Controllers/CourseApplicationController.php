<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use App\Models\CourseApplication;
use App\Models\Course;
use App\Models\Batch;
use App\Models\User;

class CourseApplicationController extends Controller
{
    /**
     * List all applications (admin).
     * Optionally filter by course_id, batch_id, status.
     */
    public function index(Request $request)
    {
        $user = $request->user();
        // Eager load with only the columns needed for display
        $query = CourseApplication::with([
            'course:id,title,code',
            'batch:id,name,course_id',
            'user:id,full_name,display_name,email,student_number',
            'secretaryApprover:id,full_name',
            'coordinatorApprover:id,full_name',
            'directorApprover:id,full_name',
        ]);

        // Use direct whereIn instead of slow whereHas (avoids correlated subqueries)
        if ($user && $user->role === 'secretary') {
            $courseIds = Course::where('secretary_id', $user->id)->pluck('id');
            $query->whereIn('course_id', $courseIds);
        } elseif ($user && $user->role === 'coordinator') {
            $courseIds = Course::where('coordinator_id', $user->id)->pluck('id');
            $query->whereIn('course_id', $courseIds)->where('approval_level', '>=', 1);
        } elseif ($user && $user->role === 'director') {
            $query->where('approval_level', '>=', 2);
        }

        if ($request->has('course_id')) {
            $query->where('course_id', $request->course_id);
        }
        if ($request->has('batch_id')) {
            $query->where('batch_id', $request->batch_id);
        }
        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        return response()->json($query->orderBy('created_at', 'desc')->get());
    }

    /**
     * Get applications for the authenticated applicant user.
     */
    public function myApplications(Request $request)
    {
        $user = $request->user();
        $apps = CourseApplication::with(['course', 'batch'])
            ->where(function ($query) use ($user) {
                $query->where('user_id', $user->id)
                      ->orWhere('applicant_email', $user->email);
            })
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json($apps);
    }

    /**
     * Show a single application.
     */
    public function show($id)
    {
        $application = CourseApplication::with(['course', 'batch', 'user',
            'secretaryApprover', 'coordinatorApprover', 'directorApprover'])
            ->findOrFail($id);

        return response()->json($application);
    }

    /**
     * Submit a new course application.
     * Validates NIC uniqueness against both users and existing applications.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'applicant_name' => 'required|string|max:255',
            'display_name' => 'required|string|max:255',
            'applicant_email' => 'required|email|max:255',
            'applicant_nic' => 'required|string|max:20',
            'course_id' => 'required|exists:courses,id',
            'batch_id' => 'nullable|exists:batches,id',
            'phone' => 'nullable|string|max:20',
            'whatsapp' => 'nullable|string|max:20',
            'home_phone' => 'nullable|string|max:20',
            'guardian_phone' => 'nullable|string|max:20',
            'district' => 'nullable|string|max:100',
            'dob' => 'nullable|date',
            'sex' => 'nullable|string|max:10',
            'civil_status' => 'nullable|string|max:20',
            'address' => 'nullable|string',
            'employment_title' => 'nullable|string|max:255',
            'official_address' => 'nullable|string',
            'ol_subjects' => 'nullable|array',
            'ol_year' => 'nullable|string|max:10',
            'ol_index' => 'nullable|string|max:30',
            'al_subjects' => 'nullable|array',
            'al_year' => 'nullable|string|max:10',
            'al_index' => 'nullable|string|max:30',
            'other_qualifications' => 'nullable|string',
        ]);

        $userId = $request->user() ? $request->user()->id : null;

        // Check NIC uniqueness against existing student users (excluding current user)
        $existingUser = User::where('nic', $validated['applicant_nic'])
            ->where('role', 'student')
            ->when($userId, function ($q) use ($userId) {
                return $q->where('id', '!=', $userId);
            })
            ->first();

        if ($existingUser) {
            return response()->json([
                'message' => 'This NIC number is already associated with an existing student account.',
                'field' => 'applicant_nic'
            ], 422);
        }

        // Check NIC uniqueness against pending/approved applications (excluding current user's applications)
        $existingApp = CourseApplication::where('applicant_nic', $validated['applicant_nic'])
            ->whereIn('status', ['pending', 'approved'])
            ->when($userId, function ($q) use ($userId) {
                return $q->where('user_id', '!=', $userId);
            })
            ->first();

        if ($existingApp) {
            return response()->json([
                'message' => 'An application with this NIC number already exists.',
                'field' => 'applicant_nic'
            ], 422);
        }

        // Check if the user already has a pending application for this specific course
        if ($userId) {
            $existingUserApp = CourseApplication::where('user_id', $userId)
                ->where('course_id', $validated['course_id'])
                ->whereIn('status', ['pending', 'approved'])
                ->first();

            if ($existingUserApp) {
                return response()->json([
                    'message' => 'You already have a pending or approved application for this course.'
                ], 422);
            }
        }

        $isNewApplicant = true;
        if ($request->user() && $request->user()->role === 'student') {
            $isNewApplicant = false;
        }

        $application = CourseApplication::create([
            ...$validated,
            'user_id' => $userId,
            'status' => 'pending',
            'approval_level' => 0,
            'is_new_applicant' => $isNewApplicant,
        ]);

        return response()->json(
            $application->load(['course', 'batch']),
            201
        );
    }

    /**
     * Check if NIC already exists.
     */
    public function checkNic(Request $request)
    {
        $request->validate(['nic' => 'required|string']);

        $existsInUsers = User::where('nic', $request->nic)
            ->where('role', 'student')
            ->exists();

        $existsInApps = CourseApplication::where('applicant_nic', $request->nic)
            ->whereIn('status', ['pending', 'approved'])
            ->exists();

        return response()->json([
            'exists' => $existsInUsers || $existsInApps,
            'message' => ($existsInUsers || $existsInApps)
                ? 'This NIC is already in use.'
                : 'NIC is available.'
        ]);
    }

    /**
     * Approve an application at the current approval level.
     * Level 1: Course Secretary
     * Level 2: Course Coordinator
     * Level 3: Director (final — triggers account generation)
     */
    public function approve(Request $request, $id)
    {
        $application = CourseApplication::with(['course', 'batch'])->findOrFail($id);
        
        if ($application->status !== 'pending') {
            return response()->json(['message' => 'This application is already ' . $application->status . ' and cannot be modified.'], 422);
        }

        $user = $request->user();
        $comment = $request->input('comment', '');
        $documentsVerified = $request->input('documents_verified');

        if ($user && $user->role === 'super_admin') {
            return response()->json(['message' => 'Super Admin can only view applications and cannot perform approvals.'], 403);
        }

        $currentLevel = $application->approval_level;
        $nextLevel = $currentLevel + 1;

        if ($nextLevel > 3) {
            return response()->json(['message' => 'Application is already fully approved.'], 400);
        }

        // Update documents verified if provided
        if ($documentsVerified) {
            $application->documents_verified = $documentsVerified;
        }

        // Update approval based on level
        switch ($nextLevel) {
            case 1:
                if ($user->role !== 'secretary') {
                    return response()->json(['message' => 'Only a Course Secretary can perform Stage 1 approval.'], 403);
                }
                $application->approved_by_secretary = $user->id;
                $application->secretary_comment = $comment;
                $application->secretary_approved_at = now();
                $application->approval_level = 1;
                $application->status = 'pending'; // Still pending higher approval
                break;
            case 2:
                if ($user->role !== 'coordinator') {
                    return response()->json(['message' => 'Only a Course Coordinator can perform Stage 2 approval.'], 403);
                }
                $application->approved_by_coordinator = $user->id;
                $application->coordinator_comment = $comment;
                $application->coordinator_approved_at = now();
                $application->approval_level = 2;
                $application->status = 'pending';
                break;
            case 3:
                if ($user->role !== 'director') {
                    return response()->json(['message' => 'Only the Director can perform Stage 3 approval.'], 403);
                }
                $application->approved_by_director = $user->id;
                $application->director_comment = $comment;
                $application->director_approved_at = now();
                $application->approval_level = 3;
                $application->status = 'approved';

                $newUser = null;
                if ($application->is_new_applicant) {
                    // Generate student account
                    $studentNumber = $this->generateStudentNumber($application);
                    $application->generated_student_number = $studentNumber;

                    // Check if user already exists as applicant/user
                    $existingUser = User::where('email', $application->applicant_email)->first();
                    if ($existingUser) {
                        $existingUser->update([
                            'student_number' => $studentNumber,
                            'full_name' => $application->applicant_name,
                            'display_name' => $application->display_name,
                            // Do not overwrite existing user's password with their NIC (keeps their registered password)
                            'nic' => $application->applicant_nic,
                            'role' => 'student',
                            'status' => 'active',
                            'phone' => $application->phone,
                            'whatsapp' => $application->whatsapp,
                            'home_phone' => $application->home_phone,
                            'guardian_phone' => $application->guardian_phone,
                            'dob' => $application->dob,
                            'sex' => $application->sex,
                            'civil_status' => $application->civil_status,
                            'address' => $application->address,
                            'district' => $application->district,
                            'employment_title' => $application->employment_title,
                            'official_address' => $application->official_address,
                            'ol_subjects' => $application->ol_subjects,
                            'ol_year' => $application->ol_year,
                            'ol_index' => $application->ol_index,
                            'al_subjects' => $application->al_subjects,
                            'al_year' => $application->al_year,
                            'al_index' => $application->al_index,
                        ]);
                        $newUser = $existingUser;
                    } else {
                        // Create the student user account
                        $newUser = User::create([
                            'student_number' => $studentNumber,
                            'full_name' => $application->applicant_name,
                            'display_name' => $application->display_name,
                            'email' => $application->applicant_email,
                            'password' => $application->applicant_nic, // Will be auto-hashed by model cast
                            'nic' => $application->applicant_nic,
                            'role' => 'student',
                            'status' => 'active',
                            'phone' => $application->phone,
                            'whatsapp' => $application->whatsapp,
                            'home_phone' => $application->home_phone,
                            'guardian_phone' => $application->guardian_phone,
                            'dob' => $application->dob,
                            'sex' => $application->sex,
                            'civil_status' => $application->civil_status,
                            'address' => $application->address,
                            'district' => $application->district,
                            'employment_title' => $application->employment_title,
                            'official_address' => $application->official_address,
                            'ol_subjects' => $application->ol_subjects,
                            'ol_year' => $application->ol_year,
                            'ol_index' => $application->ol_index,
                            'al_subjects' => $application->al_subjects,
                            'al_year' => $application->al_year,
                            'al_index' => $application->al_index,
                        ]);
                    }
                } else {
                    // Existing student, no account generation
                    $newUser = User::find($application->user_id);
                    if (!$newUser) {
                        $newUser = User::where('email', $application->applicant_email)->first();
                    }
                    if ($newUser) {
                        $application->generated_student_number = $newUser->student_number;
                    }
                }

                if ($newUser) {
                    // Enroll student in the course with batch
                    $batchName = $application->batch ? $application->batch->name : null;
                    $newUser->courses()->syncWithoutDetaching([$application->course_id => ['batch' => $batchName]]);
                    $application->user_id = $newUser->id;
                }
                break;
        }

        $application->save();
        \App\Http\Controllers\CourseController::clearManageCourseCache($application->course_id);

        // Log admin activity
        $targetDesc = "Application #{$application->id} ({$application->applicant_name}) for course " . ($application->course ? $application->course->code : 'N/A');
        \App\Models\ActivityLog::log(
            $user->id,
            "Approved Stage {$nextLevel} of Course Application",
            $targetDesc,
            'approval'
        );

        return response()->json(
            $application->load(['course', 'batch', 'user', 'secretaryApprover', 'coordinatorApprover', 'directorApprover'])
        );
    }

    /**
     * Reject an application.
     */
    public function reject(Request $request, $id)
    {
        $application = CourseApplication::findOrFail($id);
        
        if ($application->status !== 'pending') {
            return response()->json(['message' => 'This application is already ' . $application->status . ' and cannot be modified.'], 422);
        }

        $user = $request->user();
        $comment = $request->input('comment', '');

        if ($user && $user->role === 'super_admin') {
            return response()->json(['message' => 'Super Admin can only view applications and cannot perform rejections.'], 403);
        }

        $nextLevel = $application->approval_level + 1;
        switch ($nextLevel) {
            case 1:
                if ($user->role !== 'secretary') {
                    return response()->json(['message' => 'Only a Course Secretary can perform Stage 1 rejection.'], 403);
                }
                $application->approved_by_secretary = $user->id;
                $application->secretary_comment = $comment;
                $application->secretary_approved_at = now();
                break;
            case 2:
                if ($user->role !== 'coordinator') {
                    return response()->json(['message' => 'Only a Course Coordinator can perform Stage 2 rejection.'], 403);
                }
                $application->approved_by_coordinator = $user->id;
                $application->coordinator_comment = $comment;
                $application->coordinator_approved_at = now();
                break;
            case 3:
                if ($user->role !== 'director') {
                    return response()->json(['message' => 'Only the Director can perform Stage 3 rejection.'], 403);
                }
                $application->approved_by_director = $user->id;
                $application->director_comment = $comment;
                $application->director_approved_at = now();
                break;
        }

        $application->status = 'rejected';
        $application->save();
        \App\Http\Controllers\CourseController::clearManageCourseCache($application->course_id);

        // Log admin activity
        $targetDesc = "Application #{$application->id} ({$application->applicant_name}) for course " . ($application->course ? $application->course->code : 'N/A');
        \App\Models\ActivityLog::log(
            $user->id,
            "Rejected Course Application (Stage {$nextLevel})",
            $targetDesc,
            'approval'
        );

        return response()->json($application);
    }

    /**
     * Update the documents verified status for an application.
     */
    public function updateDocumentsVerified(Request $request, $id)
    {
        $application = CourseApplication::with('course')->findOrFail($id);
        $documentsVerified = $request->input('documents_verified');
        $user = $request->user();
 
        if (is_array($documentsVerified)) {
            $application->documents_verified = $documentsVerified;
            $application->save();

            // Log admin activity
            $targetDesc = "Application #{$application->id} ({$application->applicant_name}) for course " . ($application->course ? $application->course->code : 'N/A');
            \App\Models\ActivityLog::log(
                $user->id,
                "Verified application documents",
                $targetDesc,
                'approval'
            );
        }
 
        return response()->json($application);
    }

    /**
     * Generate the next sequential student number for a course.
     * Format: CODL/{COURSE_CODE}/{YEAR}/{SEQ}
     */
    private function generateStudentNumber(CourseApplication $application): string
    {
        $year = date('y'); // Last 2 digits of year (e.g. "26")
        $prefix = "{$year}CODL";

        // Find the highest existing student number for this format
        $latestUser = User::where('student_number', 'like', $prefix . '%')
            ->orderBy('student_number', 'desc')
            ->first();

        if ($latestUser) {
            $suffix = substr($latestUser->student_number, -4);
            $lastSeq = (int) $suffix;
            $nextSeq = $lastSeq + 1;
        } else {
            $nextSeq = 1;
        }

        return $prefix . str_pad($nextSeq, 4, '0', STR_PAD_LEFT);
    }

    /**
     * Delete an application completely (super admin only).
     */
    public function destroy(Request $request, $id)
    {
        $user = $request->user();
        if (!$user || $user->role !== 'super_admin') {
            return response()->json(['message' => 'Unauthorized. Only Super Admin can delete applications.'], 403);
        }

        $application = CourseApplication::findOrFail($id);
        $courseId = $application->course_id;
        $application->delete();
        \App\Http\Controllers\CourseController::clearManageCourseCache($courseId);

        return response()->json(['message' => 'Application deleted successfully.']);
    }
}
