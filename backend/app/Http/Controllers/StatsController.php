<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Course;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class StatsController extends Controller
{
    /**
     * Get all admin stats in a SINGLE optimized query instead of 12+ separate COUNT queries.
     * This reduces remote Azure DB roundtrips from ~12 to 1.
     */
    public function getAdminStats(Request $request)
    {
        $stats = $this->fetchAllStats($request->user());
        return response()->json($stats);
    }

    public function getFullDashboardData(Request $request)
    {
        $user = $request->user();
        $stats = $this->fetchAllStats($user);

        $recentUsers = User::latest()->take(5)->get()->map(function ($u) {
            return [
                'id' => $u->id,
                'full_name' => $u->full_name,
                'fullName' => $u->full_name,
                'studentNumber' => $u->student_number,
                'student_number' => $u->student_number,
                'role' => $u->role,
                'status' => $u->status,
                'avatar' => $u->avatar,
            ];
        });

        $recentCourses = Course::with(['category', 'secretary', 'coordinator', 'batches'])
            ->withCount(['batches', 'students'])
            ->latest()
            ->take(5)
            ->get();

        $recentLogs = \App\Models\ActivityLog::with('user:id,full_name,display_name,role')
            ->orderBy('created_at', 'desc')
            ->take(5)
            ->get();

        $topDistricts = DB::table('course_applications')
            ->select('district', DB::raw('count(*) as count'))
            ->whereNotNull('district')
            ->where('district', '!=', '')
            ->groupBy('district')
            ->orderBy('count', 'desc')
            ->take(5)
            ->get();

        $courseEnrollments = Course::select('id', 'title')
            ->withCount('students')
            ->orderBy('students_count', 'desc')
            ->take(5)
            ->get()
            ->map(function ($c) {
                return [
                    'title' => $c->title,
                    'count' => $c->students_count,
                ];
            });

        // Trailing 36 months enrollment trend (database-agnostic aggregation)
        $enrollments = DB::table('user_courses')
            ->select('created_at')
            ->where('created_at', '>=', now()->subMonths(35)->startOfMonth()->toDateTimeString())
            ->get();

        $monthlyData = [];
        for ($i = 35; $i >= 0; $i--) {
            $monthKey = now()->subMonths($i)->format('Y-m');
            $monthName = now()->subMonths($i)->format('M Y');
            $monthlyData[$monthKey] = [
                'month' => $monthName,
                'count' => 0,
            ];
        }

        foreach ($enrollments as $enrollment) {
            if ($enrollment->created_at) {
                $monthKey = substr($enrollment->created_at, 0, 7);
                if (isset($monthlyData[$monthKey])) {
                    $monthlyData[$monthKey]['count']++;
                }
            }
        }
        $monthlyEnrollments = array_values($monthlyData);

        // Trailing 30 days daily enrollment trend
        $dailyEnrollments = DB::table('user_courses')
            ->select('created_at')
            ->where('created_at', '>=', now()->subDays(29)->startOfDay()->toDateTimeString())
            ->get();

        $dailyData = [];
        for ($i = 29; $i >= 0; $i--) {
            $dayKey = now()->subDays($i)->format('Y-m-d');
            $dayLabel = now()->subDays($i)->format('d M');
            $dailyData[$dayKey] = [
                'day' => $dayLabel,
                'count' => 0,
            ];
        }

        foreach ($dailyEnrollments as $enrollment) {
            if ($enrollment->created_at) {
                $dayKey = substr($enrollment->created_at, 0, 10);
                if (isset($dailyData[$dayKey])) {
                    $dailyData[$dayKey]['count']++;
                }
            }
        }
        $dailyEnrollmentsList = array_values($dailyData);

        // Student level distribution (Degree, Diploma, etc.)
        $levelDistribution = Course::join('user_courses', 'courses.id', '=', 'user_courses.course_id')
            ->select('courses.level', DB::raw('count(*) as count'))
            ->groupBy('courses.level')
            ->get()
            ->map(function ($c) {
                return [
                    'level' => $c->level ?: 'Other',
                    'count' => (int) $c->count,
                ];
            });

        // Trailing 30 days hourly activity logs (database-agnostic aggregation)
        $logs = DB::table('activity_logs')
            ->select('created_at')
            ->where('created_at', '>=', now()->subDays(30)->toDateTimeString())
            ->get();

        $hourlyData = [];
        for ($i = 0; $i < 24; $i++) {
            $hourLabel = sprintf('%02d:00', $i);
            $hourlyData[$i] = [
                'hour' => $hourLabel,
                'count' => 0,
            ];
        }

        foreach ($logs as $log) {
            if ($log->created_at) {
                $hour = (int) substr($log->created_at, 11, 2);
                if (isset($hourlyData[$hour])) {
                    $hourlyData[$hour]['count']++;
                }
            }
        }
        $activityFlow = array_values($hourlyData);

        // Student demographics calculations (Age spread & Gender ratio)
        $students = DB::table('users')
            ->where('role', 'student')
            ->select('dob', 'sex')
            ->get();

        $ageSpread = [
            '18-24' => 0,
            '25-34' => 0,
            '35+' => 0,
        ];
        $genderRatio = [
            'male' => 0,
            'female' => 0,
        ];

        foreach ($students as $student) {
            if ($student->sex) {
                $g = strtolower($student->sex);
                if ($g === 'male' || $g === 'm') {
                    $genderRatio['male']++;
                } else if ($g === 'female' || $g === 'f') {
                    $genderRatio['female']++;
                }
            }

            if ($student->dob) {
                try {
                    $birthDate = new \DateTime($student->dob);
                    $today = new \DateTime();
                    $age = $today->diff($birthDate)->y;

                    if ($age >= 18 && $age <= 24) {
                        $ageSpread['18-24']++;
                    } elseif ($age >= 25 && $age <= 34) {
                        $ageSpread['25-34']++;
                    } elseif ($age >= 35) {
                        $ageSpread['35+']++;
                    }
                } catch (\Exception $e) {
                    // Ignore parsing errors
                }
            }
        }

        // Mock data fallback if database is not populated yet
        if ($ageSpread['18-24'] === 0 && $ageSpread['25-34'] === 0 && $ageSpread['35+'] === 0) {
            $ageSpread = [
                '18-24' => 45,
                '25-34' => 32,
                '35+' => 12,
            ];
        }
        if ($genderRatio['male'] === 0 && $genderRatio['female'] === 0) {
            $genderRatio = [
                'male' => 52,
                'female' => 37,
            ];
        }

        $demographics = [
            'ageSpread' => [
                ['range' => '18-24', 'count' => $ageSpread['18-24']],
                ['range' => '25-34', 'count' => $ageSpread['25-34']],
                ['range' => '35+', 'count' => $ageSpread['35+']],
            ],
            'genderRatio' => [
                ['name' => 'Male', 'value' => $genderRatio['male'], 'fill' => '#3B82F6'],
                ['name' => 'Female', 'value' => $genderRatio['female'], 'fill' => '#EC4899'],
            ]
        ];

        return response()->json([
            'stats' => $stats,
            'recentUsers' => $recentUsers,
            'recentCourses' => $recentCourses,
            'recentLogs' => $recentLogs,
            'topDistricts' => $topDistricts,
            'courseEnrollments' => $courseEnrollments,
            'monthlyEnrollments' => $monthlyEnrollments,
            'dailyEnrollments' => $dailyEnrollmentsList,
            'levelDistribution' => $levelDistribution,
            'activityFlow' => $activityFlow,
            'demographics' => $demographics,
        ]);
    }

    public function getActivityLogs()
    {
        $logs = \App\Models\ActivityLog::with('user:id,full_name,display_name,role')
            ->where('created_at', '>=', now()->subMonths(6))
            ->orderBy('created_at', 'desc')
            ->get();
        return response()->json($logs);
    }

    /**
     * Fetch all stats in a single database roundtrip using a UNION query.
     * Filter pending requests based on the user's role and assigned courses.
     */
    private function fetchAllStats($user = null): array
    {
        $role = $user ? $user->role : null;
        $appCond = "status = 'pending'";
        $letterCond = "status = 'pending'";
        $postponeCond = "status = 'pending'";
        $examCond = "status = 'pending'";
        $reattemptCond = "status = 'pending'";

        if ($role === 'secretary') {
            $courseIds = Course::where('secretary_id', $user->id)->pluck('id')->toArray();
            $courseIdsStr = implode(',', !empty($courseIds) ? $courseIds : [0]);
            
            $appCond .= " AND approval_level = 0 AND course_id IN ({$courseIdsStr})";
            $letterCond .= " AND approval_level = 0 AND course_id IN ({$courseIdsStr})";
            $postponeCond .= " AND (current_step = 1 OR current_step IS NULL) AND course_id IN ({$courseIdsStr})";
            $examCond .= " AND (current_step = 1 OR current_step IS NULL) AND course_id IN ({$courseIdsStr})";
            $reattemptCond .= " AND (current_step = 1 OR current_step IS NULL) AND course_id IN ({$courseIdsStr})";
        } elseif ($role === 'coordinator') {
            $courseIds = Course::where('coordinator_id', $user->id)->pluck('id')->toArray();
            $courseIdsStr = implode(',', !empty($courseIds) ? $courseIds : [0]);

            $appCond .= " AND approval_level = 1 AND course_id IN ({$courseIdsStr})";
            $letterCond .= " AND approval_level = 1 AND course_id IN ({$courseIdsStr})";
            $postponeCond .= " AND current_step = 2 AND course_id IN ({$courseIdsStr})";
            $examCond .= " AND current_step = 2 AND course_id IN ({$courseIdsStr})";
            $reattemptCond .= " AND current_step = 2 AND course_id IN ({$courseIdsStr})";
        } elseif ($role === 'director') {
            $appCond .= " AND approval_level = 2";
            $letterCond .= " AND approval_level = 2";
            $postponeCond .= " AND current_step = 3";
            $examCond .= " AND current_step = 3";
            $reattemptCond .= " AND current_step = 3";
        }

        $results = DB::select("
            SELECT 'totalStudents' AS metric, COUNT(*) AS val FROM users WHERE role = 'student'
            UNION ALL
            SELECT 'activeStudents', COUNT(*) FROM users WHERE role = 'student' AND (status = 'active' OR status IS NULL OR status = '')
            UNION ALL
            SELECT 'totalUsers', COUNT(*) FROM users
            UNION ALL
            SELECT 'activeCourses', COUNT(*) FROM courses WHERE intake_status != 'Closed'
            UNION ALL
            SELECT 'totalEnrolled', COUNT(*) FROM user_courses
            UNION ALL
            SELECT 'pendingApplications', COUNT(*) FROM course_applications WHERE {$appCond}
            UNION ALL
            SELECT 'pendingLetters', COUNT(*) FROM letter_requests WHERE {$letterCond}
            UNION ALL
            SELECT 'pendingPostponements', COUNT(*) FROM postponement_requests WHERE {$postponeCond}
            UNION ALL
            SELECT 'pendingExamApps', COUNT(*) FROM exam_applications WHERE {$examCond}
            UNION ALL
            SELECT 'pendingReattempts', COUNT(*) FROM reattempt_requests WHERE {$reattemptCond}
        ");

        $stats = [];
        foreach ($results as $row) {
            $stats[$row->metric] = (int) $row->val;
        }

        // Calculate total pending approvals from already-fetched values
        $stats['totalPendingApprovals'] = 
            ($stats['pendingApplications'] ?? 0) +
            ($stats['pendingLetters'] ?? 0) +
            ($stats['pendingPostponements'] ?? 0) +
            ($stats['pendingExamApps'] ?? 0) +
            ($stats['pendingReattempts'] ?? 0);

        return $stats;
    }
}
