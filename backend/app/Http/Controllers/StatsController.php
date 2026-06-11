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
    public function getAdminStats()
    {
        $stats = $this->fetchAllStats();
        return response()->json($stats);
    }

    public function getFullDashboardData()
    {
        $stats = $this->fetchAllStats();

        return response()->json([
            'stats' => $stats,
            'recentUsers' => User::latest()->take(5)->get(),
            'recentCourses' => Course::latest()->take(4)->get(),
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
    private function fetchAllStats(): array
    {
        $results = DB::select("
            SELECT 'totalStudents' AS metric, COUNT(*) AS val FROM users WHERE role = 'student'
            UNION ALL
            SELECT 'activeStudents', COUNT(*) FROM users WHERE role = 'student' AND status = 'active'
            UNION ALL
            SELECT 'totalUsers', COUNT(*) FROM users
            UNION ALL
            SELECT 'activeCourses', COUNT(*) FROM courses
            UNION ALL
            SELECT 'pendingApplications', COUNT(*) FROM course_applications WHERE status = 'pending'
            UNION ALL
            SELECT 'pendingLetters', COUNT(*) FROM letter_requests WHERE status = 'pending'
            UNION ALL
            SELECT 'pendingPostponements', COUNT(*) FROM postponement_requests WHERE status = 'pending'
            UNION ALL
            SELECT 'pendingExamApps', COUNT(*) FROM exam_applications WHERE status = 'pending'
            UNION ALL
            SELECT 'pendingReattempts', COUNT(*) FROM reattempt_requests WHERE status = 'pending'
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
