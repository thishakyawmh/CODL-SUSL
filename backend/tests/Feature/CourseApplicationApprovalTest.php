<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use App\Models\Course;
use App\Models\CourseApplication;
use Illuminate\Foundation\Testing\RefreshDatabase;

class CourseApplicationApprovalTest extends TestCase
{
    public function test_super_admin_cannot_approve_course_applications()
    {
        $superAdmin = User::factory()->make(['role' => 'super_admin']);
        $application = CourseApplication::factory()->make([
            'status' => 'pending',
            'approval_level' => 0
        ]);

        $response = $this->actingAs($superAdmin, 'sanctum')
                         ->postJson("/api/course-applications/1/approve");

        $response->assertStatus(403);
    }
}
