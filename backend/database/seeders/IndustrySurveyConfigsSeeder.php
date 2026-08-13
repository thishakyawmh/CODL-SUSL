<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class IndustrySurveyConfigsSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Seed Industry Sectors Config
        DB::connection('analytics')->table('industry_sectors_config')->delete();
        $sectors = [
            ['sector_name' => 'Information Technology', 'created_at' => now(), 'updated_at' => now()],
            ['sector_name' => 'Engineering & Construction', 'created_at' => now(), 'updated_at' => now()],
            ['sector_name' => 'Banking & Finance', 'created_at' => now(), 'updated_at' => now()],
            ['sector_name' => 'Tourism & Hospitality', 'created_at' => now(), 'updated_at' => now()],
            ['sector_name' => 'Apparel & Manufacturing', 'created_at' => now(), 'updated_at' => now()],
            ['sector_name' => 'Healthcare & Pharmaceutical', 'created_at' => now(), 'updated_at' => now()],
            ['sector_name' => 'Education & Research', 'created_at' => now(), 'updated_at' => now()]
        ];
        DB::connection('analytics')->table('industry_sectors_config')->insert($sectors);

        // 2. Seed Industry Academic Domains & Sub-Disciplines Config
        DB::connection('analytics')->table('industry_interests_config')->delete();
        $interests = [
            [
                'interest_field' => 'Computing & Information Technology',
                'skills' => 'Computer Science, Software Engineering, Information Systems, Cybersecurity, Artificial Intelligence, Data Science, Cloud Computing, Network Administration, Database Management, Human-Computer Interaction, Game Development, Internet of Things (IoT), Blockchain Technology, Quantum Computing, Bioinformatics',
                'created_at' => now(),
                'updated_at' => now()
            ],
            [
                'interest_field' => 'Engineering & Technology',
                'skills' => 'Civil Engineering, Mechanical Engineering, Electrical Engineering, Chemical Engineering, Aerospace Engineering, Materials Science & Engineering, Industrial Engineering, Biomedical Engineering, Robotics Engineering, Environmental Engineering, Nanotechnology, Mechatronics, Petroleum Engineering, Marine Engineering',
                'created_at' => now(),
                'updated_at' => now()
            ],
            [
                'interest_field' => 'Business & Management',
                'skills' => 'Business Administration, Human Resource Management, Operations Management, Supply Chain Management, International Business, Entrepreneurship, Strategic Management, Project Management, Organizational Behavior, Business Analytics, Risk Management, E-commerce Management, Healthcare Management',
                'created_at' => now(),
                'updated_at' => now()
            ],
            [
                'interest_field' => 'Accounting & Finance',
                'skills' => 'Financial Accounting, Management Accounting, Corporate Finance, Investment Banking, Taxation, Auditing, Forensic Accounting, Wealth Management, Actuarial Finance, Financial Risk Management, Quantitative Finance, Public Accounting, Islamic Finance',
                'created_at' => now(),
                'updated_at' => now()
            ],
            [
                'interest_field' => 'Marketing',
                'skills' => 'Digital Marketing, Brand Management, Market Research, Product Marketing, Advertising, Sales Management, Consumer Behavior, Public Relations (PR), Social Media Marketing, Content Marketing, Search Engine Optimization (SEO), Retail Marketing, B2B Marketing',
                'created_at' => now(),
                'updated_at' => now()
            ],
            [
                'interest_field' => 'Economics',
                'skills' => 'Microeconomics, Macroeconomics, International Economics, Econometrics, Behavioral Economics, Development Economics, Environmental Economics, Labor Economics, Financial Economics, Health Economics, Public Economics, Urban Economics, Industrial Organization',
                'created_at' => now(),
                'updated_at' => now()
            ],
            [
                'interest_field' => 'Science',
                'skills' => 'Physics, Chemistry, Biology, Earth Science, Astronomy, Biochemistry, Zoology, Botany, Microbiology, Genetics, Ecology, Oceanography, Neuroscience, Materials Chemistry',
                'created_at' => now(),
                'updated_at' => now()
            ],
            [
                'interest_field' => 'Mathematics & Statistics',
                'skills' => 'Pure Mathematics, Applied Mathematics, Statistics, Actuarial Science, Data Analytics, Probability Theory, Cryptography, Operations Research, Computational Mathematics, Financial Mathematics, Topology, Number Theory, Geometry',
                'created_at' => now(),
                'updated_at' => now()
            ],
            [
                'interest_field' => 'Medicine & Health Sciences',
                'skills' => 'General Medicine, Nursing, Dentistry, Pharmacy, Public Health, Physiotherapy, Surgery, Pediatrics, Psychiatry, Radiology, Pathology, Medical Laboratory Science, Occupational Therapy, Epidemiology, Nutrition and Dietetics',
                'created_at' => now(),
                'updated_at' => now()
            ],
            [
                'interest_field' => 'Agriculture',
                'skills' => 'Agronomy (Crop Science), Animal Science, Horticulture, Agricultural Economics, Soil Science, Forestry, Plant Pathology, Entomology, Agricultural Engineering, Aquaculture, Agribusiness, Dairy Science, Organic Farming',
                'created_at' => now(),
                'updated_at' => now()
            ],
            [
                'interest_field' => 'Law',
                'skills' => 'Criminal Law, Civil Law, Corporate Law, International Law, Constitutional Law, Intellectual Property Law, Environmental Law, Family Law, Human Rights Law, Tax Law, Labor and Employment Law, Real Estate Law, Space Law',
                'created_at' => now(),
                'updated_at' => now()
            ],
            [
                'interest_field' => 'Education',
                'skills' => 'Early Childhood Education, Special Education, Curriculum and Instruction, Educational Leadership, Educational Psychology, Adult Education, Primary Education, Secondary Education, Educational Technology (EdTech), Physical Education, Language Teaching (e.g., TESOL), Higher Education Administration, Bilingual Education',
                'created_at' => now(),
                'updated_at' => now()
            ],
            [
                'interest_field' => 'Social Sciences',
                'skills' => 'Sociology, Anthropology, Political Science, Geography, International Relations, Criminology, Demography, Cultural Studies, Urban Studies, Public Policy, Social Work, Development Studies, Gender Studies',
                'created_at' => now(),
                'updated_at' => now()
            ],
            [
                'interest_field' => 'Arts & Humanities',
                'skills' => 'History, Philosophy, Literature, Linguistics, Performing Arts (Music, Theater, Dance), Visual Arts, Religious Studies, Classics, Art History, Creative Writing, Cultural Heritage Studies, Archaeology, Ethics',
                'created_at' => now(),
                'updated_at' => now()
            ],
            [
                'interest_field' => 'Architecture',
                'skills' => 'Landscape Architecture, Interior Architecture, Urban Planning, Architectural Engineering, Historic Preservation, Sustainable Design, Industrial Design, Naval Architecture, Parametric Design, Civic Design, Residential Architecture, Commercial Architecture, Construction Management',
                'created_at' => now(),
                'updated_at' => now()
            ],
            [
                'interest_field' => 'Environmental Studies',
                'skills' => 'Environmental Science, Ecology, Conservation Biology, Climate Science, Environmental Policy, Sustainability Studies, Renewable Energy, Wildlife Management, Environmental Toxicology, Water Resource Management, Ocean Conservation, Forestry Management, Environmental Law and Ethics',
                'created_at' => now(),
                'updated_at' => now()
            ],
            [
                'interest_field' => 'Hospitality & Tourism',
                'skills' => 'Hotel Management, Culinary Arts, Event Management, Travel and Tourism, Recreation and Leisure Studies, Resort Management, Food and Beverage Management, Eco-Tourism, Aviation Management, Cruise Ship Management, Casino Management, Hospitality Marketing, Theme Park Management',
                'created_at' => now(),
                'updated_at' => now()
            ],
            [
                'interest_field' => 'Media & Communication',
                'skills' => 'Journalism, Broadcasting, Film and Television Studies, Public Relations, Digital Media, Corporate Communication, Advertising Strategy, Photojournalism, Mass Communication, Media Ethics, Interactive Media, Sports Communication, Publishing',
                'created_at' => now(),
                'updated_at' => now()
            ],
            [
                'interest_field' => 'Psychology',
                'skills' => 'Clinical Psychology, Cognitive Psychology, Developmental Psychology, Forensic Psychology, Social Psychology, Educational Psychology, Industrial-Organizational Psychology, Neuropsychology, Sports Psychology, Counseling Psychology, Health Psychology, Evolutionary Psychology, Consumer Psychology',
                'created_at' => now(),
                'updated_at' => now()
            ]
        ];
        DB::connection('analytics')->table('industry_interests_config')->insert($interests);
    }
}
