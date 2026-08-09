<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Course;
use App\Models\CourseApplication;
use App\Models\ExamApplication;
use App\Models\LetterRequest;
use App\Models\PostponementRequest;
use App\Models\ReattemptRequest;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        if (file_exists(base_path('database_backup.json'))) {
            $this->call([
                BackupDataSeeder::class
            ]);
            echo "Database successfully restored from JSON backup file!\n";
        } else {
            $this->call([
                SuperAdminSeeder::class,
                CategorySeeder::class,
                RecommendationRuleSeeder::class,
                RealCoursesSeeder::class,
                SurveyInterestsConfigSeeder::class,
            ]);
            echo "Database seeded successfully with default/essential data!\n";
        }
    }
}
