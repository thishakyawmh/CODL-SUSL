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
use App\AI\Controllers\AIAnalyticsController;
use App\Http\Controllers\StudentInterestController;


/* API Routes */

Route::post('/register', [AuthController::class, 'register'])->middleware('throttle:login');
Route::post('/login', [AuthController::class, 'login'])->middleware('throttle:login');
Route::post('/auth/google', [AuthController::class, 'googleLogin'])->middleware('throttle:login');
Route::post('/forgot-password', [AuthController::class, 'forgotPassword'])->middleware('throttle:login');
Route::post('/reset-password', [AuthController::class, 'resetPassword'])->middleware('throttle:login');

// Public: Available courses for applicants (with batches)
Route::get('/public/courses', [CourseController::class, 'publicIndex']);
Route::get('/admin/system-settings', [SystemSettingController::class, 'getSettings']);
Route::post('/public/surveys', [AIAnalyticsController::class, 'storeSurvey'])->middleware('throttle:submissions'); // Public survey submission
Route::post('/student-interests', [StudentInterestController::class, 'store'])->middleware('throttle:submissions');
Route::post('/industry-analysis', [StudentInterestController::class, 'storeIndustry'])->middleware('throttle:submissions');
Route::get('/student-interests/config', [StudentInterestController::class, 'getConfig'])->middleware('throttle:survey-configs');
Route::get('/student-interests/teaching-methods', [StudentInterestController::class, 'getTeachingMethods'])->middleware('throttle:survey-configs');
Route::get('/student-interests/university-opportunities', [StudentInterestController::class, 'getUniversityOpportunities'])->middleware('throttle:survey-configs');
Route::get('/industry-analysis/sectors', [StudentInterestController::class, 'getIndustrySectors'])->middleware('throttle:survey-configs');
Route::get('/industry-analysis/config', [StudentInterestController::class, 'getIndustryConfig'])->middleware('throttle:survey-configs');




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

    // Shared Staff & Admin routes
    Route::middleware('role:super_admin,director,coordinator,secretary,lecturer')->group(function () {
        Route::get('/admin/track-students/search', [UserController::class, 'searchStudents'])->middleware('throttle:api');
        Route::get('/admin/track-students/{id}/details', [UserController::class, 'getStudentTrackingDetails']);
        Route::get('/admin/stats', [StatsController::class, 'getAdminStats']);
        Route::get('/admin/dashboard-full', [StatsController::class, 'getFullDashboardData']);
        Route::get('/admin/activity-logs', [StatsController::class, 'getActivityLogs']);
        Route::get('/admin/health-stats', [StatsController::class, 'getSystemHealthStats']);
    });

    // Staff/Course Management routes
    Route::middleware('role:super_admin,director,coordinator,secretary')->group(function () {
        Route::get('/users', [UserController::class, 'index']);
        Route::get('/users/{id}', [UserController::class, 'show']);
        Route::post('/admin/system-settings', [SystemSettingController::class, 'updateSettings']);
        Route::post('/admin/system-settings/logo', [SystemSettingController::class, 'uploadLogo']);
        Route::post('/admin/ai-analysis', [AIAnalysisController::class, 'analyze']);

        // AI Analytics Dashboard (moved to secure block and corrected parameters)
        Route::get('/admin/ai-analytics/programs', [AIAnalyticsController::class, 'getPrograms']);
        Route::get('/admin/ai-analytics/global-overview', [AIAnalyticsController::class, 'getGlobalOverview']);
        Route::get('/admin/ai-analytics/common/overview', [AIAnalyticsController::class, 'getCommonOverview']);
        Route::get('/admin/ai-analytics/common/drilldown', [AIAnalyticsController::class, 'getCommonDrilldown']);
        Route::post('/admin/ai-analytics/sync-sheet', [AIAnalyticsController::class, 'syncGoogleSheet']);
        Route::get('/admin/ai-analytics/{courseId}/overview', [AIAnalyticsController::class, 'getOverview']);
        Route::get('/admin/ai-analytics/{courseId}/student-demand', [AIAnalyticsController::class, 'getStudentInterest']);
        Route::get('/admin/ai-analytics/{courseId}/industry-demand', [AIAnalyticsController::class, 'getIndustryGap']);
        Route::get('/admin/ai-analytics/{courseId}/recommendations', [AIAnalyticsController::class, 'getRecommendations']);
        Route::get('/admin/ai-analytics/{courseId}/skill-gap', [AIAnalyticsController::class, 'getSkillGap']);
        Route::get('/admin/ai-analytics/{courseId}/emerging-technologies', [AIAnalyticsController::class, 'getEmergingTechnologies']);
        Route::get('/admin/ai-analytics/{courseId}/export', [AIAnalyticsController::class, 'exportCSV']);
        Route::get('/admin/ai-analytics/{courseId}/academic-entry', [AIAnalyticsController::class, 'getAcademicEntryRequirements']);
        Route::get('/admin/ai-analytics/surveys', [AIAnalyticsController::class, 'getSurveys']);
        Route::post('/admin/ai-analytics/surveys', [AIAnalyticsController::class, 'storeSurvey']);
        Route::get('/admin/ai-analytics/geography', [AIAnalyticsController::class, 'getGeographyData']);
        Route::get('/admin/ai-analytics/geography/skills', [AIAnalyticsController::class, 'getGeographySkills']);
        Route::get('/admin/ai-analytics/industry/skills', [AIAnalyticsController::class, 'getIndustrySkills']);
        Route::get('/admin/ai-analytics/university-opportunities', [AIAnalyticsController::class, 'getUniversityOpportunities']);
        Route::post('/admin/student-interests/config', [StudentInterestController::class, 'storeConfig']);
        Route::delete('/admin/student-interests/config/{id}', [StudentInterestController::class, 'deleteConfig']);
        Route::post('/admin/student-interests/teaching-methods', [StudentInterestController::class, 'storeTeachingMethod']);
        Route::delete('/admin/student-interests/teaching-methods/{id}', [StudentInterestController::class, 'deleteTeachingMethod']);
        Route::post('/admin/student-interests/university-opportunities', [StudentInterestController::class, 'storeUniversityOpportunity']);
        Route::delete('/admin/student-interests/university-opportunities/{id}', [StudentInterestController::class, 'deleteUniversityOpportunity']);

        // Industry survey configs
        Route::post('/admin/industry-analysis/sectors', [StudentInterestController::class, 'storeIndustrySector']);
        Route::delete('/admin/industry-analysis/sectors/{id}', [StudentInterestController::class, 'deleteIndustrySector']);
        Route::post('/admin/industry-analysis/config', [StudentInterestController::class, 'storeIndustryConfig']);
        Route::delete('/admin/industry-analysis/config/{id}', [StudentInterestController::class, 'deleteIndustryConfig']);
    });

    // Super Admin / Director Management routes
    Route::middleware('role:super_admin,director')->group(function () {
        Route::post('/users', [UserController::class, 'store']);
        Route::put('/users/{id}', [UserController::class, 'update']);
        Route::post('/users/{id}/reset-password', [UserController::class, 'resetPassword']);
        Route::delete('/users/{id}', [UserController::class, 'destroy']);
    });

    // Super Admin Only System & Database Table routes
    Route::middleware('role:super_admin')->group(function () {
        Route::get('/admin/tables', [DatabaseTableController::class, 'getTables']);
        Route::get('/admin/tables/{tableName}', [DatabaseTableController::class, 'getTableData']);
        Route::delete('/admin/tables/{tableName}/{id}', [DatabaseTableController::class, 'deleteRecord']);

        // Backups (Super Admin only)
        Route::get('/admin/backups', [BackupController::class, 'index']);
        Route::post('/admin/backups/run', [BackupController::class, 'run']);
        Route::get('/admin/backups/download/{filename}', [BackupController::class, 'download']);
        Route::delete('/admin/backups/{filename}', [BackupController::class, 'destroy']);
    });

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
    Route::get('/courses/{id}/batches/{batchId}/materials', [BatchController::class, 'getMaterials']);
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
    Route::post('/exams/upload-timetable', [ExamController::class, 'uploadTimetable']);

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

});
