<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use App\Models\Course;
use App\Models\Category;
use App\Models\LetterRequest;
use Illuminate\Foundation\Testing\RefreshDatabase;

class LetterRequestsTest extends TestCase
{
    use RefreshDatabase;

    public function test_student_can_request_letter_and_secretary_can_approve()
    {
        $secretary = User::factory()->create(['role' => 'secretary']);
        $student = User::factory()->create(['role' => 'student']);

        $category = Category::create(['name' => 'IT']);
        $course = Course::create([
            'title' => 'Diploma in IT',
            'code' => 'DIT',
            'level' => 'Diploma',
            'duration' => '1 Year',
            'category_id' => $category->id,
            'secretary_id' => $secretary->id
        ]);

        // 1. Student Submits Letter Request
        $response = $this->actingAs($student, 'sanctum')
                         ->postJson('/api/letter-requests', [
                             'course_id' => $course->id,
                             'letter_type' => 'Student Confirmation',
                             'reason' => 'Bank loan request',
                             'name_with_initials' => 'J. Doe',
                             'address' => '123 Main St, Balangoda',
                             'phone' => '0771234567',
                             'nic' => '123456789V',
                             'year' => '2026',
                             'batch' => 'Batch 01',
                             'registration_number' => 'STU12345'
                         ]);

        $response->assertStatus(201);
        $this->assertDatabaseHas('letter_requests', [
            'user_id' => $student->id,
            'course_id' => $course->id,
            'status' => 'pending',
            'approval_level' => 0
        ]);

        $letterRequest = LetterRequest::where('user_id', $student->id)->first();

        // 2. Secretary Approves Letter Request (Stage 1)
        $response = $this->actingAs($secretary, 'sanctum')
                         ->postJson("/api/letter-requests/{$letterRequest->id}/approve", [
                             'comment' => 'Approved Stage 1'
                         ]);

        $response->assertStatus(200);
        $this->assertDatabaseHas('letter_requests', [
            'id' => $letterRequest->id,
            'approval_level' => 1,
            'approved_by_secretary' => $secretary->id
        ]);
    }
}
