<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class SurveyInterestsConfigSeeder extends Seeder
{
    public function run(): void
    {
        // Delete existing records to avoid duplicate entries
        DB::connection('analytics')->table('survey_interests_config')->delete();

        // Insert exactly the 19 user-specified academic interest areas with relevant skills
        DB::connection('analytics')->table('survey_interests_config')->insert([
            [
                'interest_field' => 'Computing & Information Technology',
                'skills' => 'Software Development, Web Development, Cloud Computing, Cyber Security, Artificial Intelligence, Database Management, Mobile Apps, Networking',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'interest_field' => 'Engineering & Technology',
                'skills' => 'AutoCAD, Robotics, Circuit Design, Mechanical Design, Project Planning, MATLAB, Civil Engineering, Embedded Systems',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'interest_field' => 'Business & Management',
                'skills' => 'Project Management, Strategic Planning, Operations Management, Entrepreneurship, Human Resources, Leadership, Business Communication, Supply Chain',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'interest_field' => 'Accounting & Finance',
                'skills' => 'Financial Analysis, Tax Preparation, Auditing, Excel Modeling, Corporate Finance, Bookkeeping, Investment Analysis',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'interest_field' => 'Marketing',
                'skills' => 'Digital Marketing, SEO & SEM, Content Creation, Social Media Management, Market Research, Branding, Copywriting, Advertising',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'interest_field' => 'Economics',
                'skills' => 'Data Analysis, Econometrics, Financial Markets, Policy Analysis, Macroeconomics, Microeconomics, Game Theory',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'interest_field' => 'Mathematics & Statistics',
                'skills' => 'Statistical Analysis, Calculus, Probability, Linear Algebra, Data Modeling, Quantitative Research, R/SAS Programming',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'interest_field' => 'Medicine & Health Sciences',
                'skills' => 'Clinical Research, First Aid, Anatomy & Physiology, Patient Care, Medical Diagnostics, Health Administration, Public Health, Pharmacology',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'interest_field' => 'Science',
                'skills' => 'Scientific Research, Laboratory Techniques, Physics, Chemistry, Biology, Environmental Science, Genetics, Data Interpretation',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'interest_field' => 'Agriculture',
                'skills' => 'Crop Cultivation, Soil Science, Agribusiness, Sustainable Farming, Pest Control, Irrigation Systems, Horticulture',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'interest_field' => 'Law',
                'skills' => 'Legal Research, Case Analysis, Contract Drafting, Corporate Law, Litigation, Public Speaking, Analytical Reasoning',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'interest_field' => 'Education',
                'skills' => 'Lesson Planning, Classroom Management, Curriculum Design, Educational Technology, Special Education, Tutoring, Assessment Methods',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'interest_field' => 'Social Sciences',
                'skills' => 'Sociological Analysis, Research Methods, Qualitative Analysis, Anthropological Research, Policy Evaluation, Community Engagement',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'interest_field' => 'Arts & Humanities',
                'skills' => 'Creative Writing, Graphic Design, History Analysis, Philosophy, Fine Arts, Cultural Studies, Photography',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'interest_field' => 'Architecture',
                'skills' => '3D Modeling, Revit/AutoCAD, Architectural Design, Urban Planning, Building Materials, Interior Design, Sustainable Architecture',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'interest_field' => 'Environmental Studies',
                'skills' => 'Climate Change Analysis, GIS Mapping, Sustainability Planning, Conservation Biology, Waste Management, Environmental Impact Assessment',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'interest_field' => 'Hospitality & Tourism',
                'skills' => 'Customer Service, Hotel Management, Event Planning, Tourism Operations, Food & Beverage Service, Tourism Marketing',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'interest_field' => 'Media & Communication',
                'skills' => 'Public Relations, Journalism, Video Editing, Broadcasting, Strategic Communication, Social Media, Scriptwriting',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'interest_field' => 'Psychology',
                'skills' => 'Counseling Techniques, Cognitive Behavior, Behavioral Research, Psychological Assessment, Mental Health Support, Developmental Psychology',
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);

        echo "All 19 academic interest fields seeded successfully into survey_interests_config!\n";
    }
}
