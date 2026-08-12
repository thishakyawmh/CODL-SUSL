<?php

namespace Database\Seeders;

use App\Models\StudentInterest;
use App\Models\IndustryRequirement;
use App\Models\RecommendationRule;
use Illuminate\Database\Seeder;

class AIAnalyticsSeeder extends Seeder
{
    public function run(): void
    {
        // Clean old SQLite records
        StudentInterest::truncate();
        IndustryRequirement::truncate();
        RecommendationRule::truncate();

        // 1. Seed Student Interests (Kaggle Trends Mappings)
        $studentSurveys = [
            ['respondent_type' => 'school_leaver', 'preferred_field' => 'Software Engineering', 'career_interests' => 'Full-Stack Developer', 'skills_to_learn' => 'React, JavaScript, Node.js, HTML, CSS', 'job_aspirations' => 'Software Engineer at Sysco Labs', 'comments' => 'I love building web applications.'],
            ['respondent_type' => 'prospective_student', 'preferred_field' => 'Computer Science', 'career_interests' => 'Machine Learning Engineer', 'skills_to_learn' => 'Python, PyTorch, Linear Algebra, AI, Neural Networks', 'job_aspirations' => 'Data Scientist', 'comments' => 'Surging interest in artificial intelligence models.'],
            ['respondent_type' => 'current_student', 'preferred_field' => 'Information Systems', 'career_interests' => 'DevOps Specialist', 'skills_to_learn' => 'Docker, Kubernetes, Linux, AWS, CI/CD, Pipelines', 'job_aspirations' => 'DevOps Architect', 'comments' => 'Need more hands-on cloud deployment modules.'],
            ['respondent_type' => 'school_leaver', 'preferred_field' => 'Computer Science', 'career_interests' => 'Mobile Application Developer', 'skills_to_learn' => 'Kotlin, Swift, Flutter, Android, iOS Development', 'job_aspirations' => 'Mobile Engineer', 'comments' => 'Want to build app store projects.'],
            ['respondent_type' => 'current_student', 'preferred_field' => 'Software Engineering', 'career_interests' => 'Cyber Security Analyst', 'skills_to_learn' => 'Ethical Hacking, Penetration Testing, Linux, Cryptography', 'job_aspirations' => 'Information Security Officer', 'comments' => 'Interested in network defensive systems.'],
            // Additional student records can be seeded here...
        ];

        // Seed 40 more simple student profiles dynamically to reach 45+ responses
        for ($i = 0; $i < 40; $i++) {
            $types = ['school_leaver', 'prospective_student', 'current_student'];
            $fields = ['Software Engineering', 'Computer Science', 'Information Systems'];
            $careers = ['Backend Engineer', 'Data Analyst', 'Cloud Engineer', 'Web Designer'];
            $skills = [
                'Java, SQL, Git, Databases',
                'Python, Pandas, PowerBI, Excel',
                'AWS, Terraform, Docker, Serverless',
                'React, TailwindCSS, TypeScript, Next.js'
            ];
            $studentSurveys[] = [
                'respondent_type' => $types[array_rand($types)],
                'preferred_field' => $fields[array_rand($fields)],
                'career_interests' => $careers[array_rand($careers)],
                'skills_to_learn' => $skills[array_rand($skills)],
                'job_aspirations' => 'Tech Specialist',
                'comments' => 'Excited to learn.'
            ];
        }

        foreach ($studentSurveys as $survey) {
            StudentInterest::create($survey);
        }

        // 2. Seed Industry Requirements (Stack Overflow Trends Mappings)
        $companySurveys = [
            ['company_name' => 'WSO2', 'industry_sector' => 'Software Development', 'demanded_roles' => 'DevOps Engineer', 'required_skills' => 'Docker, Kubernetes, CI/CD, GitHub Actions, Linux', 'emerging_technologies' => 'Microservices, Serverless', 'expected_competencies' => 'Problem Solving, Teamwork', 'skill_shortages' => 'Containerization, DevOps pipelines'],
            ['company_name' => 'Sysco Labs', 'industry_sector' => 'Enterprise Software', 'demanded_roles' => 'Machine Learning Engineer', 'required_skills' => 'Python, TensorFlow, PyTorch, Pandas, SQL', 'emerging_technologies' => 'Generative AI, LLMs', 'expected_competencies' => 'Analytical Thinking, Math', 'skill_shortages' => 'Practical AI deployments'],
            ['company_name' => 'Dialog Axiata', 'industry_sector' => 'Telecommunications', 'demanded_roles' => 'Cloud Infrastructure Architect', 'required_skills' => 'AWS, Azure, Terraform, Cloud Security', 'emerging_technologies' => 'Edge Computing, 5G architectures', 'expected_competencies' => 'Systems Architecture, Security Audits', 'skill_shortages' => 'Cloud Engineers'],
            ['company_name' => 'Zone24x7', 'industry_sector' => 'IT Research', 'demanded_roles' => 'Embedded Software Engineer', 'required_skills' => 'C++, IoT, Firmware, Python', 'emerging_technologies' => 'Edge AI, Smart Sensors', 'expected_competencies' => 'Hardware-Software Interfacing', 'skill_shortages' => 'Embedded C++ devs']
        ];

        // Seed 16 more mock industry reviews to reach 20 companies
        for ($i = 0; $i < 16; $i++) {
            $companySurveys[] = [
                'company_name' => 'Tech Company ' . ($i + 1),
                'industry_sector' => 'Information Technology',
                'demanded_roles' => 'Software Engineer, Quality Assurance Specialist',
                'required_skills' => 'React, Node.js, TypeScript, PostgreSQL, Selenium, JIRA',
                'emerging_technologies' => 'Web3, Automated QA',
                'expected_competencies' => 'Communication, Agile Methodologies',
                'skill_shortages' => 'Automated QA testing'
            ];
        }

        foreach ($companySurveys as $survey) {
            IndustryRequirement::create($survey);
        }

        // 3. Seed Recommendation Rules (Regex matching blueprints)
        $rules = [
            [
                'rule_name' => 'DevOps curriculum integration',
                'target_course_pattern' => '/bsc.*(info|computer|systems|science)/i',
                'trigger_skill_pattern' => '/docker|kubernetes|devops|ci\/cd|pipeline/i',
                'recommendation_subject' => 'DevOps & Cloud Infrastructure',
                'recommendation_text' => 'Introduce DevOps practices, CI/CD automated deployment pipelines, and Docker/Kubernetes container orchestration into practical laboratory sessions.',
                'threshold_percent' => 15
            ],
            [
                'rule_name' => 'Artificial Intelligence specialization',
                'target_course_pattern' => '/bsc.*(computer|science|software)/i',
                'trigger_skill_pattern' => '/ai|artificial intelligence|machine learning|ml|pytorch|tensorflow/i',
                'recommendation_subject' => 'Artificial Intelligence & Machine Learning',
                'recommendation_text' => 'Incorporate core Machine Learning algorithms, python model training, PyTorch library use, and neural network foundation studies.',
                'threshold_percent' => 15
            ],
            [
                'rule_name' => 'Cloud Computing deployment fundamentals',
                'target_course_pattern' => '/bsc.*(info|computer|systems)/i',
                'trigger_skill_pattern' => '/cloud|aws|azure|gcp|serverless/i',
                'recommendation_subject' => 'Cloud Computing Fundamentals',
                'recommendation_text' => 'Add Cloud Computing Fundamentals as a second-year course, highlighting AWS cloud deployment, serverless architectures, and resource updates.',
                'threshold_percent' => 15
            ]
        ];

        foreach ($rules as $rule) {
            RecommendationRule::create($rule);
        }

        // 4. Seed Industry Sectors Config
        \Illuminate\Support\Facades\DB::connection('analytics')->table('industry_sectors_config')->truncate();
        $sectors = [
            ['sector_name' => 'Information Technology', 'created_at' => now(), 'updated_at' => now()],
            ['sector_name' => 'Engineering & Construction', 'created_at' => now(), 'updated_at' => now()],
            ['sector_name' => 'Banking & Finance', 'created_at' => now(), 'updated_at' => now()],
            ['sector_name' => 'Tourism & Hospitality', 'created_at' => now(), 'updated_at' => now()],
            ['sector_name' => 'Apparel & Manufacturing', 'created_at' => now(), 'updated_at' => now()],
            ['sector_name' => 'Healthcare & Pharmaceutical', 'created_at' => now(), 'updated_at' => now()],
            ['sector_name' => 'Education & Research', 'created_at' => now(), 'updated_at' => now()]
        ];
        \Illuminate\Support\Facades\DB::connection('analytics')->table('industry_sectors_config')->insert($sectors);

        // 5. Seed Industry Academic Domains & Sub-Disciplines Config
        \Illuminate\Support\Facades\DB::connection('analytics')->table('industry_interests_config')->truncate();
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
        \Illuminate\Support\Facades\DB::connection('analytics')->table('industry_interests_config')->insert($interests);
    }
}