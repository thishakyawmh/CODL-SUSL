<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use App\Models\Course;
use App\Models\Category;
use App\Models\Subject;
use App\Models\Exam;
use App\Models\ExamResult;
use App\Models\StudentGrade;
use Illuminate\Foundation\Testing\RefreshDatabase;

class ExamResultsTest extends TestCase
{
    use RefreshDatabase;

    public function test_staff_can_upload_results_and_student_can_view_them()
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

        $subject = Subject::create([
            'name' => 'Programming in PHP',
            'code' => 'DIT11',
            'course_id' => $course->id
        ]);

        $exam = Exam::create([
            'course_id' => $course->id,
            'title' => 'Final Exam 2026',
            'fee' => 1000,
            'type' => 'written',
            'status' => 'completed'
        ]);

        // 1. Upload Results
        $response = $this->actingAs($coordinator, 'sanctum')
                         ->postJson('/api/exam-results', [
                             'course_id' => $course->id,
                             'subject_id' => $subject->id,
                             'exam_id' => $exam->id,
                             'batch' => '2026/01',
                             'semester' => '1',
                             'grades' => [
                                 [
                                     'user_id' => $student->id,
                                     'grade' => 'A-',
                                     'special_note' => 'First attempt'
                                 ]
                             ]
                         ]);

        $response->assertStatus(201);
        $this->assertDatabaseHas('exam_results', [
            'course_id' => $course->id,
            'subject_id' => $subject->id,
            'status' => 'released'
        ]);

        $this->assertDatabaseHas('student_grades', [
            'user_id' => $student->id,
            'grade' => 'A-'
        ]);

        // 2. Student retrieves personal results
        $response = $this->actingAs($student, 'sanctum')
                         ->getJson('/api/exam-results/my');

        $response->assertStatus(200);
        $response->assertJsonFragment([
            'grade' => 'A-',
            'special_note' => 'First attempt'
        ]);
    }
}
