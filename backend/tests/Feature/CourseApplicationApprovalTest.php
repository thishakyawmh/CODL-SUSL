<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use App\Models\Course;
use App\Models\Category;
use App\Models\CourseApplication;
use Illuminate\Foundation\Testing\RefreshDatabase;

class CourseApplicationApprovalTest extends TestCase
{
    use RefreshDatabase;

    public function test_super_admin_cannot_approve_course_applications()
    {
        $category = Category::create([
            'name' => 'IT',
            'description' => 'Info Tech'
        ]);

        $course = Course::create([
            'title' => 'Diploma in IT',
            'code' => 'DIT',
            'level' => 'Diploma',
            'duration' => '1 Year',
            'category_id' => $category->id
        ]);

        $application = CourseApplication::create([
            'applicant_name' => 'John Doe',
            'display_name' => 'John',
            'applicant_email' => 'john@example.com',
            'applicant_nic' => '123456789V',
            'course_id' => $course->id,
            'status' => 'pending',
            'approval_level' => 0
        ]);

        $superAdmin = User::factory()->create([
            'role' => 'super_admin'
        ]);

        $response = $this->actingAs($superAdmin, 'sanctum')
                         ->postJson("/api/course-applications/{$application->id}/approve");

        $response->assertStatus(403);
    }
}
