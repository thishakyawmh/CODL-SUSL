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
                'skills' => 'Artificial Intelligence, Machine Learning, Data Science, Software Engineering, Cyber Security, Cloud Computing, DevOps, Networking, Database Systems, Mobile App Development, Web Development, UI/UX Design, Game Development, Internet of Things (IoT), Blockchain, Robotics, Digital Forensics, Project Management',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'interest_field' => 'Engineering & Technology',
                'skills' => 'Civil Engineering, Mechanical Engineering, Electrical Engineering, Electronic Engineering, Mechatronics, Chemical Engineering, Biomedical Engineering, Aerospace Engineering, Environmental Engineering, Industrial Engineering, Renewable Energy Engineering, Robotics',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'interest_field' => 'Business & Management',
                'skills' => 'Human Resource Management, Entrepreneurship, International Business, Supply Chain Management, Business Analytics, Digital Marketing, Project Management, Finance, Banking, E-Commerce',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'interest_field' => 'Accounting & Finance',
                'skills' => 'Financial Technology (FinTech), Investment Banking & Wealth Management, Forensic Accounting & Fraud Examination, Corporate Finance & Valuation, International Financial Reporting (IFRS), Tax Strategy & Advisory, Audit & Assurance, Sustainable Finance & ESG Reporting, Risk Management',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'interest_field' => 'Marketing',
                'skills' => 'Digital & Social Media Marketing, Brand Management, Consumer Behavior Analytics, Content Marketing, Influencer & Affiliate Marketing, SEO & SEM Strategies, Public Relations (PR), Neuromarketing, Growth Hacking, E-commerce Marketing',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'interest_field' => 'Economics',
                'skills' => 'Behavioral Economics, Development Economics, Data Analytics & Econometrics, International Trade & Globalization, Public Policy Economics, Financial Economics, Environmental & Resource Economics, Macroeconomic Strategy & Policy, Labor & Health Economics',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'interest_field' => 'Mathematics & Statistics',
                'skills' => 'Applied Mathematics, Data Science & Statistics, Actuarial Science, Financial Mathematics, Operations Research, Cryptography & Security, Mathematical Modeling, Quantitative Finance, Pure Mathematics',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'interest_field' => 'Medicine & Health Sciences',
                'skills' => 'Medicine, Pharmacy, Nursing, Physiotherapy, Medical Laboratory Science, Public Health, Nutrition, Psychology',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'interest_field' => 'Science',
                'skills' => 'Physics, Chemistry, Biology, Biotechnology, Environmental Science, Food Science, Nanotechnology, Astronomy',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'interest_field' => 'Agriculture',
                'skills' => 'Precision Agriculture / Smart Farming, Agribusiness Management, Food Technology & Safety, Horticulture, Sustainable Agriculture, Agricultural Engineering, Plant Biotechnology, Agri-informatics, Aquaculture & Fisheries, Climate-Smart Agriculture',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'interest_field' => 'Law',
                'skills' => 'Corporate & Commercial Law, Cyber Law & Digital Rights, Intellectual Property (IP) Law, International Law, Human Rights Law, Environmental & Climate Law, Criminal Law & Justice, Family Law, Space & Aviation Law, AI & Technology Law, Alternative Dispute Resolution (ADR)',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'interest_field' => 'Education',
                'skills' => 'EdTech (Educational Technology), Early Childhood Education, Special Education & Inclusion, Curriculum & Instructional Design, Educational Leadership & Management, TESOL (Teaching English as a Second Language), STEM/STEAM Education, Adult & Continuing Education',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'interest_field' => 'Social Sciences',
                'skills' => 'Psychology (Clinical & Behavioral), Sociology & Criminology, International Relations & Diplomacy, Political Science, Behavioral Economics, Anthropology, Gender Studies, Public Policy & Administration, Urban & Community Studies',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'interest_field' => 'Arts & Humanities',
                'skills' => 'Digital Arts & Animation, Graphic Design, Performing Arts (Music/Dance/Drama), Fine Arts, Creative Writing, Film & Media Production, Game Art & Design, Fashion Design, Interior Design',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'interest_field' => 'Architecture',
                'skills' => 'Sustainable & Green Architecture, Urban Design & Planning, Landscape Architecture, Interior Architecture, Parametric & Computational Design, Smart City Planning, Architectural Conservation, BIM (Building Information Modeling)',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'interest_field' => 'Environmental Studies',
                'skills' => 'Climate Change & Adaptation Strategy, Sustainable Resource Management, Renewable Energy & Clean Tech, Environmental Policy & Governance, Biodiversity & Conservation Biology, Environmental Impact Assessment (EIA), Disaster Risk Reduction & Management, Urban Ecology & Sustainability, Circular Economy & Waste Management',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'interest_field' => 'Hospitality & Tourism',
                'skills' => 'Hotel & Resort Management, Sustainable Tourism / Ecotourism, Event & Experience Management, Culinary Arts & Management, Aviation & Cruise Management, Travel Tech & Digital Tourism, Luxury Brand Management, Food & Beverage Operations',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'interest_field' => 'Media & Communication',
                'skills' => 'Digital Journalism & New Media, Strategic Communication & Public Relations (PR), Media Production & Broadcasting, Social Media Strategy & Content Creation, Film & Cinema Studies, Advertising & Brand Communication, Corporate & Organizational Communication, Media Analytics & Audience Research, Interactive Media & Game Journalism',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'interest_field' => 'Psychology',
                'skills' => 'Counseling Psychology, Cognitive & Behavioral Neuroscience, Industrial & Organizational (I/O) Psychology, Educational & School Psychology, Child & Adolescent Psychology, Forensic & Criminal Psychology, Health & Sports Psychology, Media & Cyberpsychology, Social & Personality Psychology',
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);

        // Seed default teaching methods
        DB::connection('analytics')->table('survey_teaching_methods')->delete();
        DB::connection('analytics')->table('survey_teaching_methods')->insert([
            ['method_name' => 'Practical Labs', 'created_at' => now(), 'updated_at' => now()],
            ['method_name' => 'Workshops', 'created_at' => now(), 'updated_at' => now()],
            ['method_name' => 'Group Projects', 'created_at' => now(), 'updated_at' => now()],
            ['method_name' => 'Individual Projects', 'created_at' => now(), 'updated_at' => now()],
            ['method_name' => 'Industry Training', 'created_at' => now(), 'updated_at' => now()],
            ['method_name' => 'Research Projects', 'created_at' => now(), 'updated_at' => now()],
            ['method_name' => 'Field Visits', 'created_at' => now(), 'updated_at' => now()],
            ['method_name' => 'Guest Lectures', 'created_at' => now(), 'updated_at' => now()],
            ['method_name' => 'Traditional Lectures', 'created_at' => now(), 'updated_at' => now()],
            ['method_name' => 'Online Learning', 'created_at' => now(), 'updated_at' => now()],
            ['method_name' => 'Competitions / Hackathons', 'created_at' => now(), 'updated_at' => now()],
        ]);

        echo "All 19 academic interest fields and teaching methods seeded successfully!\n";
    }
}
