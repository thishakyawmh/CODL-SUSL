<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\RecommendationRule;

class RecommendationRuleSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Standardized recommendation_type vocabulary:
        // New Course, New Module, Course Update, Curriculum Revision, New Specialization, Industry Partnership, Laboratory Upgrade
        
        $rules = [
            // --- Computing & Information Technology ---
            [
                'rule_name' => 'Integrate Cloud Computing',
                'description' => 'Recommends adding cloud fundamentals when industry demand for cloud technologies is high.',
                'target_course_pattern' => '/^(computing|information technology|software engineering)$/i',
                'trigger_skill_pattern' => '/^(cloud computing)$/i',
                'recommendation_type' => 'New Module',
                'recommendation_subject' => 'Cloud Computing & Infrastructure',
                'recommendation_text' => 'Introduce a compulsory second-year module covering AWS, Azure, cloud architecture, cloud security, and practical deployment laboratories aligned with current industry demand.',
                'threshold_percent' => 30,
                'priority' => 'High',
                'evidence_source' => 'Industry',
                'is_active' => true,
            ],
            [
                'rule_name' => 'Introduce DevOps Practices',
                'description' => 'Suggests teaching DevOps pipelines when demand for CI/CD and containers spikes.',
                'target_course_pattern' => '/^(software engineering|computer science)$/i',
                'trigger_skill_pattern' => '/^(devops)$/i',
                'recommendation_type' => 'Course Update',
                'recommendation_subject' => 'DevOps & Continuous Integration',
                'recommendation_text' => 'Embed continuous integration and continuous deployment (CI/CD) practices, including Docker and Kubernetes orchestration, directly into the final year software engineering capstone projects.',
                'threshold_percent' => 25,
                'priority' => 'Critical',
                'evidence_source' => 'Both',
                'is_active' => true,
            ],
            [
                'rule_name' => 'Expand AI & Machine Learning',
                'description' => 'Recommends advanced AI topics based on industry trends.',
                'target_course_pattern' => '/^(computer science|data science)$/i',
                'trigger_skill_pattern' => '/^(artificial intelligence)$/i',
                'recommendation_type' => 'New Specialization',
                'recommendation_subject' => 'Applied Artificial Intelligence',
                'recommendation_text' => 'Establish a specialized academic track in Applied AI focusing heavily on Neural Networks, Natural Language Processing, and enterprise ML model deployment to meet surging employer demand.',
                'threshold_percent' => 35,
                'priority' => 'High',
                'evidence_source' => 'Industry',
                'is_active' => true,
            ],
            [
                'rule_name' => 'Strengthen Cyber Security',
                'description' => 'Recommends integrating security practices across IT courses.',
                'target_course_pattern' => '/^(networking|information technology)$/i',
                'trigger_skill_pattern' => '/^(cyber security)$/i',
                'recommendation_type' => 'Curriculum Revision',
                'recommendation_subject' => 'Information Security Principles',
                'recommendation_text' => 'Perform a comprehensive curriculum revision to weave secure coding standards, cryptography, and penetration testing methodologies throughout all primary IT and networking degrees.',
                'threshold_percent' => 20,
                'priority' => 'Critical',
                'evidence_source' => 'Industry',
                'is_active' => true,
            ],

            // --- Business & Management ---
            [
                'rule_name' => 'Integrate Business Analytics',
                'description' => 'Adds data-driven decision making to management degrees.',
                'target_course_pattern' => '/^(business management|marketing|finance)$/i',
                'trigger_skill_pattern' => '/^(business analytics|data science)$/i',
                'recommendation_type' => 'Laboratory Upgrade',
                'recommendation_subject' => 'Data-Driven Business Intelligence',
                'recommendation_text' => 'Upgrade business computing laboratories with enterprise licenses for Power BI and Tableau, and introduce mandatory practical assignments on data-driven corporate decision making.',
                'threshold_percent' => 35,
                'priority' => 'Medium',
                'evidence_source' => 'Both',
                'is_active' => true,
            ],

            // --- Education ---
            [
                'rule_name' => 'Educational Technology (EdTech)',
                'description' => 'Prepares educators for digital classrooms.',
                'target_course_pattern' => '/^(education|teaching)$/i',
                'trigger_skill_pattern' => '/^(educational technology|edtech|digital learning)$/i',
                'recommendation_type' => 'New Module',
                'recommendation_subject' => 'Digital Pedagogy & EdTech',
                'recommendation_text' => 'Introduce a module focused on Digital Pedagogy, teaching future educators how to utilize Learning Management Systems (LMS) and interactive EdTech tools in modern classrooms.',
                'threshold_percent' => 25,
                'priority' => 'Medium',
                'evidence_source' => 'Industry',
                'is_active' => true,
            ],

            // --- Law ---
            [
                'rule_name' => 'Tech & Cyber Law',
                'description' => 'Updates legal studies with modern tech legislation.',
                'target_course_pattern' => '/^(law|legal studies)$/i',
                'trigger_skill_pattern' => '/^(cyber law|tech policy|data privacy)$/i',
                'recommendation_type' => 'New Specialization',
                'recommendation_subject' => 'Technology & Data Privacy Law',
                'recommendation_text' => 'Launch a specialized track covering GDPR, intellectual property in software, AI ethics legislation, and corporate data privacy compliance.',
                'threshold_percent' => 20,
                'priority' => 'Low',
                'evidence_source' => 'Industry',
                'is_active' => true,
            ],

            // --- Psychology ---
            [
                'rule_name' => 'Digital Psychology & HCI',
                'description' => 'Bridges psychology with user experience design.',
                'target_course_pattern' => '/^(psychology|behavioral science)$/i',
                'trigger_skill_pattern' => '/^(human computer interaction|hci|digital behavior)$/i',
                'recommendation_type' => 'Course Update',
                'recommendation_subject' => 'Psychology in Digital Environments',
                'recommendation_text' => 'Update the curriculum to explore human-computer interaction (HCI), digital addiction, and the behavioral psychology behind modern UX/UI design.',
                'threshold_percent' => 15,
                'priority' => 'Medium',
                'evidence_source' => 'Both',
                'is_active' => true,
            ],

            // --- Mathematics & Statistics ---
            [
                'rule_name' => 'Applied Machine Learning Mathematics',
                'description' => 'Connects pure math with data science algorithms.',
                'target_course_pattern' => '/^(mathematics|statistics)$/i',
                'trigger_skill_pattern' => '/^(machine learning|data science|artificial intelligence)$/i',
                'recommendation_type' => 'Curriculum Revision',
                'recommendation_subject' => 'Mathematics for Machine Learning',
                'recommendation_text' => 'Revise linear algebra and probability modules to explicitly demonstrate their direct application in algorithmic modeling, deep learning, and predictive analytics.',
                'threshold_percent' => 40,
                'priority' => 'High',
                'evidence_source' => 'Student',
                'is_active' => true,
            ],

            // --- Economics ---
            [
                'rule_name' => 'Quantitative Econometrics',
                'description' => 'Modernizes economics with big data tools.',
                'target_course_pattern' => '/^(economics|applied economics)$/i',
                'trigger_skill_pattern' => '/^(data analytics|big data|r programming|python)$/i',
                'recommendation_type' => 'Laboratory Upgrade',
                'recommendation_subject' => 'Big Data in Econometrics',
                'recommendation_text' => 'Transition econometrics tutorials from legacy statistical software to modern open-source data science tools like Python (Pandas) and R to align with financial industry practices.',
                'threshold_percent' => 30,
                'priority' => 'Medium',
                'evidence_source' => 'Industry',
                'is_active' => true,
            ],

            // --- Social Sciences ---
            [
                'rule_name' => 'Computational Social Science',
                'description' => 'Introduces data scraping and analysis to social sciences.',
                'target_course_pattern' => '/^(sociology|social sciences|political science)$/i',
                'trigger_skill_pattern' => '/^(computational social science|data analysis|social network analysis)$/i',
                'recommendation_type' => 'New Module',
                'recommendation_subject' => 'Social Network Analysis & Big Data',
                'recommendation_text' => 'Establish a new module teaching students how to scrape, clean, and ethically analyze large-scale social media datasets for sociological research.',
                'threshold_percent' => 20,
                'priority' => 'Low',
                'evidence_source' => 'Both',
                'is_active' => true,
            ],

            // --- Arts & Humanities ---
            [
                'rule_name' => 'Digital Humanities',
                'description' => 'Modernizes arts with digital archiving and curation.',
                'target_course_pattern' => '/^(history|literature|arts|humanities)$/i',
                'trigger_skill_pattern' => '/^(digital humanities|digital archiving|content management)$/i',
                'recommendation_type' => 'Industry Partnership',
                'recommendation_subject' => 'Digital Curation & Archiving',
                'recommendation_text' => 'Forge a strategic industry partnership with digital museums and archives to provide students with hands-on experience in modern digital content curation and preservation systems.',
                'threshold_percent' => 15,
                'priority' => 'Medium',
                'evidence_source' => 'Industry',
                'is_active' => true,
            ],
            
            // --- Architecture & Design ---
            [
                'rule_name' => 'BIM Technologies in Architecture',
                'description' => 'Ensures architecture students are learning modern 3D modeling.',
                'target_course_pattern' => '/^(architecture|civil engineering)$/i',
                'trigger_skill_pattern' => '/^(bim|building information modeling|smart architecture)$/i',
                'recommendation_type' => 'Course Update',
                'recommendation_subject' => 'Advanced BIM Software',
                'recommendation_text' => 'Transition traditional drafting courses completely to Building Information Modeling (BIM) workflows (e.g., Revit) to meet modern construction industry standards.',
                'threshold_percent' => 45,
                'priority' => 'High',
                'evidence_source' => 'Industry',
                'is_active' => true,
            ],
            
            // --- Medicine & Health Sciences ---
            [
                'rule_name' => 'Health Informatics & Digital Health',
                'description' => 'Updates healthcare management with digital health records.',
                'target_course_pattern' => '/^(nursing|public health|medicine)$/i',
                'trigger_skill_pattern' => '/^(health informatics|digital health|telemedicine)$/i',
                'recommendation_type' => 'New Module',
                'recommendation_subject' => 'Digital Health Systems',
                'recommendation_text' => 'Implement a mandatory module on telemedicine platforms and Electronic Medical Records (EMR) to ensure all clinical graduates are proficient in modern digital health ecosystems.',
                'threshold_percent' => 40,
                'priority' => 'Critical',
                'evidence_source' => 'Both',
                'is_active' => true,
            ],
        ];

        // Clear existing rules to prevent duplicates on re-seeding
        RecommendationRule::truncate();

        // Insert all rules
        foreach ($rules as $rule) {
            RecommendationRule::create($rule);
        }
    }
}
