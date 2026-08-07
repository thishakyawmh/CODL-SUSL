<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use App\Models\Course;
use App\Models\Category;
use App\Models\Batch;
use Illuminate\Foundation\Testing\RefreshDatabase;

class CourseManagementTest extends TestCase
{
    use RefreshDatabase;

    public function test_unauthorized_user_cannot_create_category()
    {
        // Unauthenticated
        $response = $this->postJson('/api/categories', [
            'name' => 'IT',
            'description' => 'Info Tech'
        ]);
        $response->assertStatus(401);
    }

    public function test_authorized_user_can_manage_categories()
    {
        $admin = User::factory()->create(['role' => 'super_admin']);

        // Create Category
        $response = $this->actingAs($admin, 'sanctum')
                         ->postJson('/api/categories', [
                             'name' => 'IT',
                             'description' => 'Info Tech'
                         ]);
        $response->assertStatus(201);
        $this->assertDatabaseHas('categories', ['name' => 'IT']);

        $category = Category::where('name', 'IT')->first();

        // Read Category
        $response = $this->actingAs($admin, 'sanctum')
                         ->getJson("/api/categories/{$category->id}");
        $response->assertStatus(200);

        // Update Category
        $response = $this->actingAs($admin, 'sanctum')
                         ->putJson("/api/categories/{$category->id}", [
                             'name' => 'Information Technology',
                             'description' => 'Info Tech and Systems'
                         ]);
        $response->assertStatus(200);
        $this->assertDatabaseHas('categories', ['name' => 'Information Technology']);

        // Delete Category
        $response = $this->actingAs($admin, 'sanctum')
                         ->deleteJson("/api/categories/{$category->id}");
        $response->assertStatus(200);
        $this->assertDatabaseMissing('categories', ['name' => 'Information Technology']);
    }

    public function test_student_cannot_create_course()
    {
        $student = User::factory()->create(['role' => 'student']);
        $category = Category::create(['name' => 'IT', 'description' => 'Info Tech']);

        $response = $this->actingAs($student, 'sanctum')
                         ->postJson('/api/courses', [
                             'title' => 'Diploma in IT',
                             'code' => 'DIT',
                             'level' => 'Diploma',
                             'duration' => '1 Year',
                             'intake_status' => 'Open',
                             'category_id' => $category->id
                         ]);
        $response->assertStatus(403);
    }

    public function test_admin_can_manage_courses()
    {
        $admin = User::factory()->create(['role' => 'super_admin']);
        $category = Category::create(['name' => 'IT', 'description' => 'Info Tech']);

        // Create Course
        $response = $this->actingAs($admin, 'sanctum')
                         ->postJson('/api/courses', [
                             'title' => 'Diploma in IT',
                             'code' => 'DIT',
                             'level' => 'Diploma',
                             'duration' => '1 Year',
                             'intake_status' => 'Open',
                             'category_id' => $category->id
                         ]);
        $response->assertStatus(201);
        $this->assertDatabaseHas('courses', ['code' => 'DIT']);

        $course = Course::where('code', 'DIT')->first();

        // Update Course
        $response = $this->actingAs($admin, 'sanctum')
                         ->putJson("/api/courses/{$course->id}", [
                             'title' => 'Advanced Diploma in IT',
                             'code' => 'ADIT',
                             'level' => 'Advanced Diploma',
                             'duration' => '2 Years',
                             'intake_status' => 'Closed',
                             'category_id' => $category->id
                         ]);
        $response->assertStatus(200);
        $this->assertDatabaseHas('courses', ['code' => 'ADIT']);

        // Delete Course
        $response = $this->actingAs($admin, 'sanctum')
                         ->deleteJson("/api/courses/{$course->id}");
        $response->assertStatus(200);
        $this->assertDatabaseMissing('courses', ['code' => 'ADIT']);
    }

    public function test_manage_batches()
    {
        $admin = User::factory()->create(['role' => 'super_admin']);
        $category = Category::create(['name' => 'IT']);
        $course = Course::create([
            'title' => 'Diploma in IT',
            'code' => 'DIT',
            'level' => 'Diploma',
            'duration' => '1 Year',
            'intake_status' => 'Open',
            'category_id' => $category->id
        ]);

        // Create Batch
        $response = $this->actingAs($admin, 'sanctum')
                         ->postJson("/api/courses/{$course->id}/batches", [
                             'name' => 'Batch 01',
                             'max_enrollments' => 50,
                             'status' => 'Active',
                             'start_date' => '2026-09-01',
                             'registration_deadline' => '2026-08-30'
                         ]);
        $response->assertStatus(201);
        $this->assertDatabaseHas('batches', ['name' => 'Batch 01', 'course_id' => $course->id]);

        $batch = Batch::where('name', 'Batch 01')->first();

        // Update Batch
        $response = $this->actingAs($admin, 'sanctum')
                         ->putJson("/api/courses/{$course->id}/batches/{$batch->id}", [
                             'name' => 'Batch 01 Updated',
                             'max_enrollments' => 60,
                             'status' => 'Active',
                             'start_date' => '2026-09-01',
                             'registration_deadline' => '2026-08-30'
                         ]);
        $response->assertStatus(200);
        $this->assertDatabaseHas('batches', ['name' => 'Batch 01 Updated']);

        // Delete Batch
        $response = $this->actingAs($admin, 'sanctum')
                         ->deleteJson("/api/courses/{$course->id}/batches/{$batch->id}");
        $response->assertStatus(200);
        $this->assertDatabaseMissing('batches', ['name' => 'Batch 01 Updated']);
    }
}
