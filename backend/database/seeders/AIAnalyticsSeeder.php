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
    }
}