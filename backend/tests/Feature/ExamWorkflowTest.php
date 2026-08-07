<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use App\Models\Course;
use App\Models\Category;
use App\Models\Exam;
use App\Models\ExamApplication;
use App\Models\PostponementRequest;
use App\Models\ReattemptRequest;
use App\Models\Subject;
use Illuminate\Foundation\Testing\RefreshDatabase;

class ExamWorkflowTest extends TestCase
{
    use RefreshDatabase;

    public function test_coordinator_can_schedule_exam_and_student_can_register()
    {
        $coordinator = User::factory()->create(['role' => 'coordinator']);
        $student = User::factory()->create(['role' => 'student']);
        
        $category = Category::create(['name' => 'IT']);
        $course = Course::create([
            'title' => 'Diploma in IT',
            'code' => 'DIT',
            'level' => 'Diploma',
            'duration' => '1 Year',
            'category_id' => $category->id
        ]);

        // 1. Create Exam
        $response = $this->actingAs($coordinator, 'sanctum')
                         ->postJson("/api/courses/{$course->id}/exams", [
                             'title' => 'Final Exam 2026',
                             'batch_name' => 'Batch 01',
                             'date' => '2026-12-01',
                             'fee' => 1500,
                             'type' => 'written',
                             'status' => 'scheduled'
                         ]);

        $response->assertStatus(201);
        $this->assertDatabaseHas('exams', ['title' => 'Final Exam 2026', 'course_id' => $course->id]);

        $exam = Exam::where('title', 'Final Exam 2026')->first();

        // 2. Student Applies for Exam
        $response = $this->actingAs($student, 'sanctum')
                         ->postJson("/api/exam-applications", [
                             'course_id' => $course->id,
                             'exam_id' => $exam->id,
                             'exam_title' => 'Final Exam 2026',
                             'fee_paid' => 1500,
                             'payment_date' => '2026-11-20',
                             'name_with_initials' => 'J. Doe',
                             'medium' => 'English',
                             'status' => 'pending'
                         ]);

        $response->assertStatus(201);
        $this->assertDatabaseHas('exam_applications', [
            'user_id' => $student->id,
            'exam_id' => $exam->id,
            'status' => 'pending'
        ]);

        $examApp = ExamApplication::where('exam_id', $exam->id)->first();

        // 3. Coordinator Reviews & Approves Exam Application
        $response = $this->actingAs($coordinator, 'sanctum')
                         ->putJson("/api/exam-applications/{$examApp->id}", [
                             'status' => 'approved'
                         ]);

        $response->assertStatus(200);
        $this->assertDatabaseHas('exam_applications', [
            'id' => $examApp->id,
            'status' => 'approved'
        ]);
    }

    public function test_postponement_request_workflow()
    {
        $student = User::factory()->create(['role' => 'student']);
        $coordinator = User::factory()->create(['role' => 'coordinator']);

        $category = Category::create(['name' => 'IT']);
        $course = Course::create([
            'title' => 'Diploma in IT',
            'code' => 'DIT',
            'level' => 'Diploma',
            'duration' => '1 Year',
            'category_id' => $category->id
        ]);

        // 1. Submit postponement request
        $response = $this->actingAs($student, 'sanctum')
                         ->postJson('/api/postponement-requests', [
                             'course_id' => $course->id,
                             'exam_title' => 'Final Exam 2026',
                             'reason' => 'Medical reason',
                             'medical_cert' => true,
                             'status' => 'pending'
                         ]);

        $response->assertStatus(201);
        $this->assertDatabaseHas('postponement_requests', [
            'user_id' => $student->id,
            'course_id' => $course->id,
            'status' => 'pending'
        ]);

        $request = PostponementRequest::where('user_id', $student->id)->first();

        // 2. Approve postponement request
        $response = $this->actingAs($coordinator, 'sanctum')
                         ->putJson("/api/postponement-requests/{$request->id}", [
                             'status' => 'approved'
                         ]);

        $response->assertStatus(200);
        $this->assertDatabaseHas('postponement_requests', [
            'id' => $request->id,
            'status' => 'approved'
        ]);
    }

    public function test_reattempt_request_workflow()
    {
        $student = User::factory()->create(['role' => 'student']);
        $coordinator = User::factory()->create(['role' => 'coordinator']);

        $category = Category::create(['name' => 'IT']);
        $course = Course::create([
            'title' => 'Diploma in IT',
            'code' => 'DIT',
            'level' => 'Diploma',
            'duration' => '1 Year',
            'category_id' => $category->id
        ]);

        $subject = Subject::create([
            'name' => 'Programming In PHP',
            'code' => 'DIT11',
            'course_id' => $course->id
        ]);

        // 1. Submit reattempt request
        $response = $this->actingAs($student, 'sanctum')
                         ->postJson('/api/reattempt-requests', [
                             'course_id' => $course->id,
                             'subject_id' => $subject->id,
                             'exam_title' => 'Final Exam 2026',
                             'reason' => 'Failed first attempt',
                             'status' => 'pending'
                         ]);

        $response->assertStatus(201);
        $this->assertDatabaseHas('reattempt_requests', [
            'user_id' => $student->id,
            'course_id' => $course->id,
            'status' => 'pending'
        ]);

        $request = ReattemptRequest::where('user_id', $student->id)->first();

        // 2. Approve reattempt request
        $response = $this->actingAs($coordinator, 'sanctum')
                         ->putJson("/api/reattempt-requests/{$request->id}", [
                             'status' => 'approved'
                         ]);

        $response->assertStatus(200);
        $this->assertDatabaseHas('reattempt_requests', [
            'id' => $request->id,
            'status' => 'approved'
        ]);
    }
}
