<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Course;
use App\Models\CourseApplication;
use App\Models\ExamApplication;
use App\Models\LetterRequest;
use App\Models\PostponementRequest;
use App\Models\ReattemptRequest;
use App\Models\Approval;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->call([
            SuperAdminSeeder::class,
            CategorySeeder::class,
        ]);

        echo "Database seeded successfully with essential data!\n";
    }
}
