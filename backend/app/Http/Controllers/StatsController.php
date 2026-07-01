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
        $stats = $this->fetchAllStats($request->user()?->role);
        return response()->json($stats);
    }

    public function getFullDashboardData(Request $request)
    {
        $role = $request->user()?->role;
        $stats = $this->fetchAllStats($role);

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
            ->take(4)
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

        return response()->json([
            'stats' => $stats,
            'recentUsers' => $recentUsers,
            'recentCourses' => $recentCourses,
            'recentLogs' => $recentLogs,
            'topDistricts' => $topDistricts,
            'courseEnrollments' => $courseEnrollments,
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
     * Instead of 10+ separate COUNT(*) queries (each ~100ms over Azure),
     * this does ONE query (~100ms total).
     */
    private function fetchAllStats($role = null): array
    {
        $appCond = "status = 'pending'";
        $letterCond = "status = 'pending'";
        $postponeCond = "status = 'pending'";
        $examCond = "status = 'pending'";
        $reattemptCond = "status = 'pending'";

        if ($role === 'director') {
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
