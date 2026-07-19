<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\CourseController;
use App\Http\Controllers\CourseApplicationController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\ExamApplicationController;
use App\Http\Controllers\StatsController;
use App\Http\Controllers\LetterRequestController;
use App\Http\Controllers\BatchController;
use App\Http\Controllers\ExamController;
use App\Http\Controllers\DatabaseTableController;
use App\Http\Controllers\AnnouncementController;
use App\Http\Controllers\SystemSettingController;
use App\Http\Controllers\BackupController;
use App\Http\Controllers\AIAnalysisController;
use App\Http\Controllers\AIAnalyticsController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

Route::post('/register', [AuthController::class, 'register'])->middleware('throttle:login');
Route::post('/login', [AuthController::class, 'login'])->middleware('throttle:login');
Route::post('/auth/google', [AuthController::class, 'googleLogin'])->middleware('throttle:login');

// Public: Available courses for applicants (with batches)
Route::get('/public/courses', [CourseController::class, 'publicIndex']);
Route::get('/admin/system-settings', [SystemSettingController::class, 'getSettings']);
Route::post('/public/surveys', [AIAnalyticsController::class, 'storeSurvey']); // Public survey submission

// Protected routes
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/me', [AuthController::class, 'me']);
    Route::put('/profile', [UserController::class, 'updateProfile']);
    Route::post('/profile/avatar', [UserController::class, 'uploadAvatar']);
    Route::put('/profile/password', [UserController::class, 'changePassword']);
    Route::post('/logout', [AuthController::class, 'logout']);

    // Student routes
    Route::get('/student/courses', [UserController::class, 'getStudentCourses']);
    Route::get('/student/dashboard-overview', [UserController::class, 'getStudentDashboardOverview']);
    Route::get('/student/courses/{courseId}/materials', [UserController::class, 'getCourseMaterials']);
    Route::get('/student/applications', [UserController::class, 'getStudentApplications']);
    Route::get('/student/courses/{courseId}/examinations-data', [UserController::class, 'getStudentExaminationsData']);

    // Student Tracking
    Route::get('/admin/track-students/search', [UserController::class, 'searchStudents'])->middleware('throttle:api');
    Route::get('/admin/track-students/{id}/details', [UserController::class, 'getStudentTrackingDetails']);

    // Admin Stats
    Route::get('/admin/stats', [StatsController::class, 'getAdminStats']);
    Route::get('/admin/dashboard-full', [StatsController::class, 'getFullDashboardData']);
    Route::get('/admin/activity-logs', [StatsController::class, 'getActivityLogs']);

    // Admin/User routes
    Route::get('/users', [UserController::class, 'index']);
    Route::post('/users', [UserController::class, 'store']);
    Route::put('/users/{id}', [UserController::class, 'update']);
    Route::post('/users/{id}/reset-password', [UserController::class, 'resetPassword']);
    Route::delete('/users/{id}', [UserController::class, 'destroy']);
    
    // Letters
    Route::get('/letter-requests', [LetterRequestController::class, 'index']);
    Route::post('/letter-requests', [LetterRequestController::class, 'store']);
    Route::post('/letter-requests/{id}/approve', [LetterRequestController::class, 'approve']);
    Route::post('/letter-requests/{id}/reject', [LetterRequestController::class, 'reject']);
    Route::patch('/letter-requests/{id}/status', [LetterRequestController::class, 'updateStatus']);
    
    // Categories
    Route::get('/categories', [\App\Http\Controllers\CategoryController::class, 'index']);
    Route::post('/categories', [\App\Http\Controllers\CategoryController::class, 'store']);
    Route::get('/categories/{id}', [\App\Http\Controllers\CategoryController::class, 'show']);
    Route::put('/categories/{id}', [\App\Http\Controllers\CategoryController::class, 'update']);
    Route::delete('/categories/{id}', [\App\Http\Controllers\CategoryController::class, 'destroy']);

    // Courses
    Route::get('/courses', [CourseController::class, 'index']);
    Route::post('/courses', [CourseController::class, 'store']);
    Route::get('/courses/{id}', [CourseController::class, 'show']);
    Route::put('/courses/{id}', [CourseController::class, 'update']);
    Route::delete('/courses/{id}', [CourseController::class, 'destroy']);
    Route::get('/courses/{id}/students', [CourseController::class, 'getEnrolledStudents']);
    Route::get('/manage-course/{courseId}', [CourseController::class, 'manageCourseData']);
    Route::post('/courses/{id}/enroll', [CourseController::class, 'enrollStudent']);
    Route::delete('/courses/{id}/students/{studentId}', [CourseController::class, 'unenrollStudent']);
    
    // Batches
    Route::get('/courses/{id}/batches', [BatchController::class, 'index']);
    Route::post('/courses/{id}/batches', [BatchController::class, 'store']);
    Route::put('/courses/{id}/batches/{batchId}', [BatchController::class, 'update']);
    Route::delete('/courses/{id}/batches/{batchId}', [BatchController::class, 'destroy']);
    Route::post('/batches/{batchId}/upload-material', [BatchController::class, 'uploadMaterial']);


    // Course Applications
    Route::get('/course-applications', [CourseApplicationController::class, 'index']);
    Route::get('/course-applications/my', [CourseApplicationController::class, 'myApplications']);
    Route::get('/course-applications/{id}', [CourseApplicationController::class, 'show']);
    Route::post('/course-applications', [CourseApplicationController::class, 'store']);
    Route::post('/course-applications/{id}/approve', [CourseApplicationController::class, 'approve']);
    Route::post('/course-applications/{id}/reject', [CourseApplicationController::class, 'reject']);
    Route::put('/course-applications/{id}/verify-docs', [CourseApplicationController::class, 'updateDocumentsVerified']);
    Route::post('/course-applications/check-nic', [CourseApplicationController::class, 'checkNic']);
    Route::delete('/course-applications/{id}', [CourseApplicationController::class, 'destroy']);

    // Exams
    Route::get('/courses/{id}/exams', [ExamController::class, 'index']);
    Route::post('/courses/{id}/exams', [ExamController::class, 'store']);
    Route::put('/exams/{id}', [ExamController::class, 'update']);
    Route::delete('/exams/{id}', [ExamController::class, 'destroy']);

    // Announcements
    Route::get('/announcements', [AnnouncementController::class, 'index']);
    Route::post('/announcements', [AnnouncementController::class, 'store']);
    Route::delete('/announcements/{id}', [AnnouncementController::class, 'destroy']);

    // Exam Applications
    Route::get('/exam-applications', [ExamApplicationController::class, 'index']);
    Route::post('/exam-applications', [ExamApplicationController::class, 'store']);
    Route::put('/exam-applications/{id}', [ExamApplicationController::class, 'update']);
    Route::delete('/exam-applications/{id}', [ExamApplicationController::class, 'destroy']);
    Route::get('/student/exam-applications', [ExamApplicationController::class, 'myApplications']);

    // Postponement Requests
    Route::get('/postponement-requests', [\App\Http\Controllers\PostponementRequestController::class, 'index']);
    Route::post('/postponement-requests', [\App\Http\Controllers\PostponementRequestController::class, 'store']);
    Route::put('/postponement-requests/{id}', [\App\Http\Controllers\PostponementRequestController::class, 'update']);
    Route::delete('/postponement-requests/{id}', [\App\Http\Controllers\PostponementRequestController::class, 'destroy']);
    Route::get('/student/postponement-requests', [\App\Http\Controllers\PostponementRequestController::class, 'myRequests']);

    // Reattempt Requests
    Route::get('/reattempt-requests', [\App\Http\Controllers\ReattemptRequestController::class, 'index']);
    Route::post('/reattempt-requests', [\App\Http\Controllers\ReattemptRequestController::class, 'store']);
    Route::put('/reattempt-requests/{id}', [\App\Http\Controllers\ReattemptRequestController::class, 'update']);
    Route::delete('/reattempt-requests/{id}', [\App\Http\Controllers\ReattemptRequestController::class, 'destroy']);
    Route::get('/student/reattempt-requests', [\App\Http\Controllers\ReattemptRequestController::class, 'myRequests']);

    // Exam Results
    Route::get('/exam-results', [\App\Http\Controllers\ExamResultController::class, 'index']);
    Route::post('/exam-results', [\App\Http\Controllers\ExamResultController::class, 'store']);
    Route::get('/exam-results/my', [\App\Http\Controllers\ExamResultController::class, 'myResults']);
    Route::get('/exam-results/exam/{examId}', [\App\Http\Controllers\ExamResultController::class, 'getByExam']);


    // Database Tables (Super Admin only)
    Route::get('/admin/tables', [DatabaseTableController::class, 'getTables']);
    Route::get('/admin/tables/{tableName}', [DatabaseTableController::class, 'getTableData']);
    Route::delete('/admin/tables/{tableName}/{id}', [DatabaseTableController::class, 'deleteRecord']);

    // System Settings
    Route::post('/admin/system-settings', [SystemSettingController::class, 'updateSettings']);
    Route::post('/admin/system-settings/logo', [SystemSettingController::class, 'uploadLogo']);

    // Backups
    Route::get('/admin/backups', [BackupController::class, 'index']);
    Route::post('/admin/backups/run', [BackupController::class, 'run']);
    Route::get('/admin/backups/download/{filename}', [BackupController::class, 'download']);
    Route::delete('/admin/backups/{filename}', [BackupController::class, 'destroy']);

    // AI Analysis
    Route::post('/admin/ai-analysis', [AIAnalysisController::class, 'analyze']);

    // AI Analytics Dashboard
    Route::get('/admin/ai-analytics/overview', [AIAnalyticsController::class, 'getOverview']);
    Route::get('/admin/ai-analytics/student-interest', [AIAnalyticsController::class, 'getStudentInterest']);
    Route::get('/admin/ai-analytics/industry-gap', [AIAnalyticsController::class, 'getIndustryGap']);
    Route::get('/admin/ai-analytics/recommendations', [AIAnalyticsController::class, 'getRecommendations']);
    Route::get('/admin/ai-analytics/surveys', [AIAnalyticsController::class, 'getSurveys']);
    Route::post('/admin/ai-analytics/surveys', [AIAnalyticsController::class, 'storeSurvey']);
    Route::post('/admin/ai-analytics/sync-sheet', [AIAnalyticsController::class, 'syncGoogleSheet']);
});
