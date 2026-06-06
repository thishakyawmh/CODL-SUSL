<?php

namespace Database\Seeders;

use App\Models\Category;
use Illuminate\Database\Seeder;

class CategorySeeder extends Seeder
{
    public function run(): void
    {
        // Clean up old non-academic categories
        Category::whereIn('name', ['Computing', 'Business', 'Language'])->delete();

        $categories = [
            [
                'name' => 'Degree',
                'description' => '4-Year Academic Undergraduate Programs',
                'icon' => 'BookOpen',
                'color' => '#7C3AED'
            ],
            [
                'name' => 'Higher National Diploma',
                'description' => 'Advanced Professional Diplomas (HND)',
                'icon' => 'Layers',
                'color' => '#F59E0B'
            ],
            [
                'name' => 'Diploma',
                'description' => '1-2 Year Specialized Diploma Courses',
                'icon' => 'BookOpen',
                'color' => '#3B82F6'
            ],
            [
                'name' => 'Advanced Certificate',
                'description' => 'Intermediate Level Academic Certifications',
                'icon' => 'Award',
                'color' => '#EC4899'
            ],
            [
                'name' => 'Certificate',
                'description' => 'Short-term Skill and Proficiency Programs',
                'icon' => 'Award',
                'color' => '#10B981'
            ],
        ];

        foreach ($categories as $cat) {
            Category::updateOrCreate(
                ['name' => $cat['name']],
                $cat
            );
        }
    }
}
