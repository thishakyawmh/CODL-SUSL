<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Http\Controllers\CourseController;
use Illuminate\Support\Facades\Cache;

class CourseCacheTest extends TestCase
{
    public function test_clear_manage_course_cache_initializes_missing_key()
    {
        $courseId = 999;
        Cache::forget("manage_course_version_{$courseId}");

        CourseController::clearManageCourseCache($courseId);

        $version = Cache::get("manage_course_version_{$courseId}");
        $this->assertNotNull($version);
        $this->assertNotFalse($version);
    }

    public function test_clear_manage_course_cache_increments_existing_key()
    {
        $courseId = 999;
        Cache::put("manage_course_version_{$courseId}", 10, 120);

        CourseController::clearManageCourseCache($courseId);

        $version = Cache::get("manage_course_version_{$courseId}");
        $this->assertEquals(11, $version);
    }
}
