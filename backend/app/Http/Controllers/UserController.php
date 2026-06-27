<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;

class UserController extends Controller
{
    public function index(Request $request)
    {
        $query = User::query();
        if ($request->has('role')) {
            $query->where('role', $request->role);
        }
        // Only load courses relationship if specifically needed (e.g., student listing)
        if ($request->boolean('with_courses', false) || $request->input('role') === 'student') {
            $query->with('courses:id,title,code');
        }
        return response()->json($query->get());
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'student_number' => 'required|string|unique:users',
            'full_name' => 'required|string',
            'email' => 'required|email|unique:users',
            'nic' => 'required|string|unique:users',
            'role' => 'required|string',
            'status' => 'required|string',
            'phone' => 'nullable|string',
            'password' => 'required|string|min:6',
        ]);

        $user = User::create($validated);
        return response()->json($user, 201);
    }

    public function update(Request $request, $id)
    {
        $user = User::findOrFail($id);
        $validated = $request->validate([
            'student_number' => 'required|string|unique:users,student_number,' . $id,
            'full_name' => 'required|string',
            'email' => 'required|email|unique:users,email,' . $id,
            'nic' => 'required|string|unique:users,nic,' . $id,
            'role' => 'required|string',
            'status' => 'required|string',
            'phone' => 'nullable|string',
            'dob' => 'nullable|date',
            'sex' => 'nullable|string',
            'civil_status' => 'nullable|string',
            'address' => 'nullable|string',
            'whatsapp' => 'nullable|string',
            'ol_year' => 'nullable|string',
            'ol_index' => 'nullable|string',
            'ol_subjects' => 'nullable|array',
            'al_year' => 'nullable|string',
            'al_index' => 'nullable|string',
            'al_subjects' => 'nullable|array',
            'other_qualifications' => 'nullable|string',
            'display_name' => 'nullable|string',
        ]);

        if ($request->filled('password')) {
            $validated['password'] = $request->password;
        }

        $user->update($validated);
        return response()->json($user);
    }

    public function destroy($id)
    {
        $user = User::findOrFail($id);
        $user->delete();
        return response()->json(['message' => 'User deleted successfully']);
    }

    public function getStudentCourses(Request $request)
    {
        $user = $request->user();
        return response()->json($user->courses);
    }

    public function getCourseMaterials(Request $request, $courseId)
    {
        $user = $request->user();
        
        $enrollment = \Illuminate\Support\Facades\DB::table('user_courses')
            ->where('user_id', $user->id)
            ->where('course_id', $courseId)
            ->first();
            
        if (!$enrollment || !$enrollment->batch) {
            return response()->json([], 200);
        }
        
        $batch = \App\Models\Batch::where('course_id', $courseId)
            ->where('name', $enrollment->batch)
            ->first();
            
        if (!$batch) {
            return response()->json([], 200);
        }
        
        return response()->json($batch->materials ?: [], 200);
    }

    public function getStudentApplications(Request $request)
    {
        $user = $request->user();
        return response()->json(\App\Models\CourseApplication::where('applicant_email', $user->email)->get());
    }

    public function updateProfile(Request $request)
    {
        $user = $request->user();
        
        $validated = $request->validate([
            'full_name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email,' . $user->id,
            'display_name' => 'nullable|string|max:255',
            'phone' => 'nullable|string|max:20',
            'dob' => 'nullable|date',
            'sex' => 'nullable|string|max:20',
            'civil_status' => 'nullable|string|max:30',
            'address' => 'nullable|string',
            'district' => 'nullable|string|max:100',
            'employment_title' => 'nullable|string|max:255',
            'official_address' => 'nullable|string',
            'ol_subjects' => 'nullable|array',
            'al_subjects' => 'nullable|array',
            'whatsapp' => 'nullable|string|max:20',
            'home_phone' => 'nullable|string|max:20',
            'guardian_phone' => 'nullable|string|max:20',
            'avatar' => 'nullable|string',
        ]);

        if ($user->role === 'student') {
            $validated['full_name'] = $user->full_name;
            $validated['dob'] = $user->dob ? $user->dob->format('Y-m-d') : null;
            $validated['sex'] = $user->sex;
            $validated['civil_status'] = $user->civil_status;
            $validated['address'] = $user->address;
            $validated['district'] = $user->district;
            $validated['ol_subjects'] = $user->ol_subjects;
            $validated['al_subjects'] = $user->al_subjects;
            $validated['home_phone'] = $user->home_phone;
            $validated['guardian_phone'] = $user->guardian_phone;
        }

        $user->update($validated);

        return response()->json([
            'message' => 'Profile updated successfully',
            'user' => $user
        ]);
    }

    public function uploadAvatar(Request $request)
    {
        $request->validate([
            'avatar' => 'required|image|mimes:jpeg,png,jpg,gif,webp|max:2048',
        ]);

        $user = $request->user();

        // Delete old avatar if it exists in storage
        if ($user->avatar) {
            $oldFilename = basename($user->avatar);
            if (Storage::disk('public')->exists('avatars/' . $oldFilename)) {
                Storage::disk('public')->delete('avatars/' . $oldFilename);
            }
        }

        $file = $request->file('avatar');
        $filename = 'avatar_' . $user->id . '_' . time() . '.' . $file->getClientOriginalExtension();
        $path = $file->storeAs('avatars', $filename, 'public');

        $url = asset('storage/' . $path);
        $user->avatar = $url;
        $user->save();

        return response()->json([
            'message' => 'Avatar uploaded successfully',
            'avatar_url' => $url,
            'user' => $user
        ]);
    }

    public function changePassword(Request $request)
    {
        $request->validate([
            'current_password' => 'required|string',
            'password' => 'required|string|min:8|confirmed',
        ]);

        $user = $request->user();

        if (!Hash::check($request->current_password, $user->password)) {
            return response()->json([
                'message' => 'Current password is incorrect.',
                'errors' => ['current_password' => ['Current password is incorrect.']]
            ], 422);
        }

        $user->password = Hash::make($request->password);
        $user->save();

        return response()->json([
            'message' => 'Password changed successfully.'
        ]);
    }

    public function getStudentExaminationsData(Request $request, $courseId)
    {
        $user = $request->user();
        $userId = $user ? $user->id : 'guest';
        
        $version = \Illuminate\Support\Facades\Cache::get("manage_course_version_{$courseId}", 1);
        $cacheKey = "student_exams_data_{$courseId}_{$userId}_v{$version}";
        
        $data = \Illuminate\Support\Facades\Cache::remember($cacheKey, 120, function () use ($request, $courseId, $user) {
            $enrollment = \Illuminate\Support\Facades\DB::table('user_courses')
                ->where('user_id', $user->id)
                ->where('course_id', $courseId)
                ->first();
                
            $studentBatch = ($enrollment && $enrollment->batch) ? $enrollment->batch : 'Batch 01';
            
            $exams = \App\Models\Exam::where('course_id', $courseId)->latest()->get();
            
            $myApplications = \App\Models\ExamApplication::where('user_id', $user->id)
                ->where('course_id', $courseId)
                ->with('user')
                ->latest()
                ->get();
                
            $postponements = \App\Models\PostponementRequest::where('user_id', $user->id)
                ->where('course_id', $courseId)
                ->with(['user', 'assignedExam'])
                ->latest()
                ->get();
                
            $reattempts = \App\Models\ReattemptRequest::where('user_id', $user->id)
                ->where('course_id', $courseId)
                ->with(['user', 'subject', 'assignedExam'])
                ->latest()
                ->get();
                
            return [
                'student_batch' => $studentBatch,
                'exams' => $exams,
                'my_applications' => $myApplications,
                'postponement_requests' => $postponements,
                'reattempt_requests' => $reattempts,
            ];
        });
        
        return response()->json($data);
    }

    public function resetPassword($id)
    {
        $user = User::findOrFail($id);

        if (empty($user->nic)) {
            return response()->json(['message' => 'User does not have an associated NIC number.'], 422);
        }

        $user->password = $user->nic; // Will be auto-hashed by model casts
        $user->save();

        return response()->json(['message' => 'Password reset successfully.']);
    }
}
