<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use App\Models\Course;
use App\Models\Category;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;

class StudentEnrollmentTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_enroll_and_unenroll_student()
    {
        $admin = User::factory()->create(['role' => 'super_admin']);
        $student = User::factory()->create([
            'role' => 'student',
            'student_number' => 'STU12345'
        ]);

        $category = Category::create(['name' => 'IT']);
        $course = Course::create([
            'title' => 'Diploma in IT',
            'code' => 'DIT',
            'level' => 'Diploma',
            'duration' => '1 Year',
            'category_id' => $category->id
        ]);

        // 1. Enroll student
        $response = $this->actingAs($admin, 'sanctum')
                         ->postJson("/api/courses/{$course->id}/enroll", [
                             'student_id' => 'STU12345',
                             'batch' => 'Batch 01'
                         ]);

        $response->assertStatus(200);
        $this->assertDatabaseHas('user_courses', [
            'user_id' => $student->id,
            'course_id' => $course->id,
            'batch' => 'Batch 01'
        ]);

        // Check if student can view course materials
        $response = $this->actingAs($student, 'sanctum')
                         ->getJson("/api/student/courses/{$course->id}/materials");
        $response->assertStatus(200);

        // 2. Unenroll student
        $response = $this->actingAs($admin, 'sanctum')
                         ->deleteJson("/api/courses/{$course->id}/students/STU12345");

        $response->assertStatus(200);
        $this->assertDatabaseMissing('user_courses', [
            'user_id' => $student->id,
            'course_id' => $course->id
        ]);

        // Check that student gets empty response now
        $response = $this->actingAs($student, 'sanctum')
                         ->getJson("/api/student/courses/{$course->id}/materials");
        $response->assertStatus(200);
        $response->assertJsonCount(0);
    }
}
