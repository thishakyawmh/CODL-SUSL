<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Models\Course;

class CourseController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        // Only load lightweight relationships for listing — semesters.subjects loaded on show()
        $query = Course::with(['category', 'secretary', 'coordinator', 'batches'])->withCount(['batches', 'students']);
        
        if ($user && $user->role === 'secretary') {
            $query->where('secretary_id', $user->id);
        } elseif ($user && $user->role === 'coordinator') {
            $query->where('coordinator_id', $user->id);
        } elseif ($user && $user->role === 'lecturer') {
            // Filter courses where the lecturer has subject assignments in any batch OR is the batch instructor directly
            $assignedSubjectCourseIds = DB::table('batch_subject_instructor')
                ->join('batches', 'batches.id', '=', 'batch_subject_instructor.batch_id')
                ->where('batch_subject_instructor.instructor_id', $user->id)
                ->pluck('batches.course_id')
                ->toArray();
                
            $assignedBatchInstructorCourseIds = \App\Models\Batch::where('instructor_id', $user->id)
                ->pluck('course_id')
                ->toArray();
                
            $assignedCourseIds = array_unique(array_merge($assignedSubjectCourseIds, $assignedBatchInstructorCourseIds));
            
            $query->whereIn('id', $assignedCourseIds);
        }

        if ($request->has('category_id')) {
            $query->where('category_id', $request->category_id);
        }
        return response()->json($query->get());
    }

    public function store(Request $request)
    {
        try {
            $user = $request->user();
            if (!$user || !in_array($user->role, ['super_admin', 'director'])) {
                return response()->json(['message' => 'Unauthorized to create courses.'], 403);
            }

            $validated = $request->validate([
                'title' => 'required|string',
                'code' => 'required|string|unique:courses',
                'level' => 'required|string',
                'department' => 'nullable|string',
                'duration' => 'required|string',
                'intake_status' => 'required|string',
                'max_students' => 'nullable|integer',
                'secretary_id' => 'nullable|exists:users,id',
                'coordinator_id' => 'nullable|exists:users,id',
                'category_id' => 'nullable|exists:categories,id',
                'semesters' => 'nullable|array',
                'subjects' => 'nullable|array',
            ]);

            $courseData = \Illuminate\Support\Arr::except($validated, ['semesters', 'subjects']);
            $course = Course::create($courseData);

            // Handle Semesters (for Degree/Diploma/HND)
            if ($request->has('semesters')) {
                foreach ($request->semesters as $semData) {
                    $semester = $course->semesters()->create(['name' => $semData['name']]);
                    if (isset($semData['subjects'])) {
                        foreach ($semData['subjects'] as $subData) {
                            $semester->subjects()->create([
                                'course_id' => $course->id,
                                'name' => $subData['name'],
                                'code' => $subData['code'] ?? ($course->code . '-' . rand(100, 999)),
                                'credits' => $subData['credits'],
                            ]);
                        }
                    }
                }
            }

            // Handle flat subjects (for Certificates)
            if ($request->has('subjects')) {
                foreach ($request->subjects as $subData) {
                    $course->subjects()->create([
                        'name' => $subData['name'],
                        'code' => $subData['code'] ?? ($course->code . '-' . rand(100, 999)),
                        'credits' => $subData['credits'],
                    ]);
                }
            }

            \App\Models\ActivityLog::log($user->id, 'Created new Course', "Course: {$course->title} ({$course->code})", 'course');

            return response()->json($course->load(['semesters.subjects', 'subjects', 'secretary', 'coordinator']), 201);
        } catch (\Illuminate\Validation\ValidationException $e) {
            \Illuminate\Support\Facades\Log::error('Validation Failed: ', $e->errors());
            throw $e;
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('Course Creation Error: ' . $e->getMessage());
            return response()->json(['message' => $e->getMessage()], 500);
        }
    }

    public function show($id)
    {
        $course = Course::with(['category', 'secretary', 'coordinator', 'semesters.subjects', 'subjects'])->findOrFail($id);
        return response()->json($course);
    }

    public function update(Request $request, $id)
    {
        try {
            $course = Course::findOrFail($id);
            $user = $request->user();
            
            if (!$user) {
                return response()->json(['message' => 'Unauthorized.'], 401);
            }
            
            if ($user->role === 'coordinator') {
                if ($course->coordinator_id !== $user->id) {
                    return response()->json(['message' => 'Unauthorized to edit this course.'], 403);
                }
            } elseif ($user->role !== 'super_admin' && $user->role !== 'director') {
                return response()->json(['message' => 'Unauthorized to edit this course.'], 403);
            }

            $validated = $request->validate([
                'title' => 'required|string',
                'code' => 'required|string|unique:courses,code,' . $id,
                'level' => 'required|string',
                'department' => 'nullable|string',
                'duration' => 'required|string',
                'intake_status' => 'required|string',
                'max_students' => 'nullable|integer',
                'secretary_id' => 'nullable|exists:users,id',
                'coordinator_id' => 'nullable|exists:users,id',
                'category_id' => 'nullable|exists:categories,id',
                'semesters' => 'nullable|array',
                'subjects' => 'nullable|array',
            ]);

            DB::transaction(function () use ($course, $validated, $request) {
                $courseData = \Illuminate\Support\Arr::except($validated, ['semesters', 'subjects']);
                $course->update($courseData);

                // Handle Semesters update (for Degree/Diploma/HND)
                if ($request->has('semesters')) {
                    foreach ($course->semesters as $oldSem) {
                        $oldSem->subjects()->delete();
                    }
                    $course->semesters()->delete();

                    foreach ($request->semesters as $semData) {
                        $semester = $course->semesters()->create(['name' => $semData['name']]);
                        if (isset($semData['subjects'])) {
                            foreach ($semData['subjects'] as $subData) {
                                $semester->subjects()->create([
                                    'course_id' => $course->id,
                                    'name' => $subData['name'],
                                    'code' => $subData['code'] ?? ($course->code . '-' . rand(100, 999)),
                                    'credits' => $subData['credits'],
                                ]);
                            }
                        }
                    }
                }

                // Handle flat subjects (for Certificates)
                if ($request->has('subjects')) {
                    $course->subjects()->delete();

                    foreach ($request->subjects as $subData) {
                        $course->subjects()->create([
                            'name' => $subData['name'],
                            'code' => $subData['code'] ?? ($course->code . '-' . rand(100, 999)),
                            'credits' => $subData['credits'],
                        ]);
                    }
                }
            });

            self::clearManageCourseCache($id);

            \App\Models\ActivityLog::log($user->id, 'Updated Course configuration', "Course: {$course->title} ({$course->code})", 'course');

            return response()->json($course->load(['semesters.subjects', 'subjects', 'secretary', 'coordinator', 'category']));
        } catch (\Illuminate\Validation\ValidationException $e) {
            \Illuminate\Support\Facades\Log::error('Validation Failed: ', $e->errors());
            throw $e;
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('Course Update Error: ' . $e->getMessage());
            return response()->json(['message' => $e->getMessage()], 500);
        }
    }

    public function destroy(Request $request, $id)
    {
        $user = $request->user();
        if (!$user || !in_array($user->role, ['super_admin', 'director'])) {
            return response()->json(['message' => 'Unauthorized to delete courses.'], 403);
        }

        $course = Course::findOrFail($id);
        $courseTitle = $course->title;
        $courseCode = $course->code;
        $course->delete();

        \App\Models\ActivityLog::log($user->id, 'Deleted Course', "Course: {$courseTitle} ({$courseCode})", 'course');

        return response()->json(['message' => 'Course deleted successfully']);
    }

    /**
     * Public endpoint for applicants — returns courses with open intake + their batches.
     */
    public function publicIndex()
    {
        // Auto-update expired upcoming batches to Active
        \App\Models\Batch::where('status', 'Upcoming')
            ->whereNotNull('registration_deadline')
            ->where('registration_deadline', '<', now()->toDateString())
            ->update(['status' => 'Active']);

        $courses = Course::whereHas('batches', function ($q) {
                $q->where('status', 'Upcoming')
                  ->where(function ($query) {
                      $query->whereNull('registration_deadline')
                            ->orWhere('registration_deadline', '>=', now()->toDateString());
                  });
            })
            ->with(['batches' => function ($q) {
                $q->where('status', 'Upcoming')
                  ->where(function ($query) {
                      $query->whereNull('registration_deadline')
                            ->orWhere('registration_deadline', '>=', now()->toDateString());
                  })
                  ->orderBy('start_date', 'desc');
            }])
            ->get();

        return response()->json($courses);
    }

    public function getEnrolledStudents($id)
    {
        $course = Course::findOrFail($id);
        return response()->json($this->mapEnrolledStudents($course));
    }

    public function enrollStudent(Request $request, $id)
    {
        $validated = $request->validate([
            'student_id' => 'required|string',
            'batch' => 'nullable|string',
        ]);
        
        $course = Course::findOrFail($id);
        
        $user = \App\Models\User::where('student_number', $validated['student_id'])
            ->orWhere('id', $validated['student_id'])
            ->orWhere('email', $validated['student_id'])
            ->firstOrFail();
            
        $course->students()->syncWithoutDetaching([$user->id => ['batch' => $validated['batch']]]);
        self::clearManageCourseCache($id);

        // Log admin activity
        $admin = $request->user();
        if ($admin) {
            \App\Models\ActivityLog::log(
                $admin->id,
                "Enrolled student {$user->full_name}",
                "Student: " . ($user->student_number ?: $user->id) . " in course {$course->code} (" . ($validated['batch'] ?: 'No Batch') . ")",
                'user'
            );
        }
        
        return response()->json([
            'message' => 'Student enrolled successfully',
            'student' => [
                'id' => $user->student_number ?? (string)$user->id,
                'name' => $user->full_name,
                'displayName' => $user->display_name,
                'email' => $user->email,
                'phone' => $user->phone ?? '077 123 4567',
                'enrollmentDate' => now()->toDateString(),
                'status' => ucfirst($user->status) ?: 'Active',
                'payment' => 'Verified',
                'batch' => $validated['batch'],
            ]
        ]);
    }

    public function unenrollStudent(Request $request, $id, $studentId)
    {
        $course = Course::findOrFail($id);
        $user = \App\Models\User::where('student_number', $studentId)
            ->orWhere('id', $studentId)
            ->firstOrFail();
            
        $course->students()->detach($user->id);
        self::clearManageCourseCache($id);

        // Log admin activity
        $admin = $request->user();
        if ($admin) {
            \App\Models\ActivityLog::log(
                $admin->id,
                "Unenrolled student {$user->full_name}",
                "Student: " . ($user->student_number ?: $user->id) . " from course {$course->code}",
                'user'
            );
        }
        
        return response()->json(['message' => 'Student suspended/unenrolled successfully']);
    }

    public static function clearManageCourseCache($courseId)
    {
        try {
            \Illuminate\Support\Facades\Cache::increment("manage_course_version_{$courseId}");
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Cache::put("manage_course_version_{$courseId}", time(), 120);
        }
    }

    public function manageCourseData(Request $request, $courseId)
    {
        $user = $request->user();
        $userId = $user ? $user->id : 'guest';
        
        $version = \Illuminate\Support\Facades\Cache::get("manage_course_version_{$courseId}", 1);
        $cacheKey = "manage_course_data_{$courseId}_{$userId}_v{$version}";
        
        $data = \Illuminate\Support\Facades\Cache::remember($cacheKey, 120, function () use ($courseId, $user) {
            return $this->getManageCourseDataRaw($courseId, $user);
        });
        
        return response()->json($data);
    }

    /**
     * Helper to retrieve raw manage course data to resolve IDE lambda complexity limits.
     */
    private function getManageCourseDataRaw($courseId, $user): array
    {
        $course = Course::with(['category', 'secretary', 'coordinator', 'semesters.subjects', 'subjects'])->findOrFail($courseId);
        
        $enrolledStudents = $this->mapEnrolledStudents($course);
        
        $studentUsers = \App\Models\User::whereIn('role', ['student', 'pro_student', 'applicant'])
            ->select('id', 'student_number', 'full_name', 'display_name', 'email', 'phone', 'nic', 'address')
            ->get();
            
        $lecturers = \App\Models\User::where('role', 'lecturer')
            ->select('id', 'full_name', 'email')
            ->get();
            
        $batches = $this->getBatchesForManageCourse($courseId, $user);
        
        $exams = \App\Models\Exam::where('course_id', $courseId)->latest()->get();
        
        $announcements = \App\Models\Announcement::where('course_id', $courseId)->latest()->get();
        
        $requests = $this->getCourseRequests($courseId);
        
        return array_merge([
            'course' => $course,
            'enrolled_students' => $enrolledStudents,
            'student_users' => $studentUsers,
            'lecturers' => $lecturers,
            'batches' => $batches,
            'exams' => $exams,
            'announcements' => $announcements,
        ], $requests);
    }

    private function mapEnrolledStudents($course)
    {
        return $course->students()->get()->map(function ($student) {
            return [
                'id' => $student->student_number ?? (string)$student->id,
                'real_id' => $student->id,
                'student_number' => $student->student_number,
                'name' => $student->full_name,
                'displayName' => $student->display_name,
                'email' => $student->email,
                'phone' => $student->phone ?? '077 123 4567',
                'enrollmentDate' => $student->pivot->created_at ? $student->pivot->created_at->toDateString() : now()->toDateString(),
                'status' => ucfirst($student->status) ?: 'Active',
                'payment' => 'Verified',
                'batch' => $student->pivot->batch,
            ];
        });
    }

    private function getBatchesForManageCourse($courseId, $user)
    {
        // Auto-update expired upcoming batches to Active
        \App\Models\Batch::where('course_id', $courseId)
            ->where('status', 'Upcoming')
            ->whereNotNull('registration_deadline')
            ->where('registration_deadline', '<', now()->toDateString())
            ->update(['status' => 'Active']);

        $batchQuery = \App\Models\Batch::where('course_id', $courseId);
        if ($user && $user->role === 'lecturer') {
            $batchQuery->where(function ($q) use ($user) {
                $q->whereHas('subjects', function ($subQ) use ($user) {
                    $subQ->where('batch_subject_instructor.instructor_id', $user->id);
                })->orWhere('instructor_id', $user->id);
            });
        }
        $batches = $batchQuery->with([
                'subjects' => function ($query) {
                    $query->withPivot('instructor_id');
                },
                'instructor:id,full_name'
            ])
            ->latest()
            ->get();

        $batches->each(function ($batch) {
            $batch->subjects->each(function ($subject) {
                $instructorId = $subject->pivot->instructor_id;
                if ($instructorId) {
                    $instructor = \App\Models\User::select('id', 'full_name')->find($instructorId);
                    $subject->pivot->instructor_name = $instructor ? $instructor->full_name : null;
                } else {
                    $subject->pivot->instructor_name = null;
                }
            });
        });

        return $batches;
    }

    private function getCourseRequests($courseId): array
    {
        return [
            'enrollment_requests' => \App\Models\CourseApplication::where('course_id', $courseId)->with('user')->get(),
            'exam_applications' => \App\Models\ExamApplication::where('course_id', $courseId)->with('user')->get(),
            'postponement_requests' => \App\Models\PostponementRequest::where('course_id', $courseId)->with('user')->get(),
            'reattempt_requests' => \App\Models\ReattemptRequest::where('course_id', $courseId)->with(['user', 'subject'])->get(),
        ];
    }
}
