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
        // Define a comprehensive list of recommendation rules covering major academic disciplines.
        // These rules are evaluated by RecommendationEngineService against industry demand percentages.
        
        $rules = [
            // --- Computing & Information Technology ---
            [
                'rule_name' => 'Integrate Cloud Computing',
                'description' => 'Recommends adding cloud fundamentals when industry demand for cloud technologies is high.',
                'target_course_pattern' => '.*(computing|information technology|software).*',
                'trigger_skill_pattern' => 'cloud|aws|azure|gcp|serverless',
                'recommendation_type' => 'Course Update',
                'recommendation_subject' => 'Cloud Computing & Infrastructure',
                'recommendation_text' => 'High industry demand detected for cloud skills. Integrate AWS/Azure fundamentals and cloud infrastructure concepts into the core curriculum.',
                'threshold_percent' => 30,
                'is_active' => true,
            ],
            [
                'rule_name' => 'Introduce DevOps Practices',
                'description' => 'Suggests teaching DevOps pipelines when demand for CI/CD and containers spikes.',
                'target_course_pattern' => '.*(software engineering|computer science).*',
                'trigger_skill_pattern' => 'devops|docker|kubernetes|ci/cd|jenkins|ansible|terraform',
                'recommendation_type' => 'New Module',
                'recommendation_subject' => 'DevOps & Continuous Integration',
                'recommendation_text' => 'Significant industry gap in deployment automation. Introduce a new module focusing on Docker, Kubernetes, and CI/CD pipelines.',
                'threshold_percent' => 25,
                'is_active' => true,
            ],
            [
                'rule_name' => 'Expand AI & Machine Learning',
                'description' => 'Recommends advanced AI topics based on industry trends.',
                'target_course_pattern' => '.*(computer science|data science).*',
                'trigger_skill_pattern' => 'ai|machine learning|deep learning|neural networks|nlp',
                'recommendation_type' => 'New Specialization',
                'recommendation_subject' => 'Applied Artificial Intelligence',
                'recommendation_text' => 'AI skills are in critical demand. Consider offering a dedicated specialization in Machine Learning and Natural Language Processing.',
                'threshold_percent' => 35,
                'is_active' => true,
            ],
            [
                'rule_name' => 'Modern Web Development',
                'description' => 'Updates web dev courses to include modern JS frameworks.',
                'target_course_pattern' => '.*(web development|software engineering).*',
                'trigger_skill_pattern' => 'react|angular|vue|node.js|full stack',
                'recommendation_type' => 'Curriculum Refresh',
                'recommendation_subject' => 'Modern Full-Stack Engineering',
                'recommendation_text' => 'Shift focus from legacy web technologies to modern reactive frameworks (React/Vue) and API-first backend development.',
                'threshold_percent' => 40,
                'is_active' => true,
            ],
            [
                'rule_name' => 'Strengthen Cyber Security',
                'description' => 'Recommends integrating security practices across IT courses.',
                'target_course_pattern' => '.*(networking|information technology).*',
                'trigger_skill_pattern' => 'security|cybersecurity|penetration testing|cryptography',
                'recommendation_type' => 'System-wide Integration',
                'recommendation_subject' => 'Information Security Principles',
                'recommendation_text' => 'Security is a primary concern for employers. Embed secure coding practices and basic penetration testing across all IT degree programs.',
                'threshold_percent' => 20,
                'is_active' => true,
            ],

            // --- Engineering & Technology ---
            [
                'rule_name' => 'Smart Manufacturing & IoT',
                'description' => 'Bridges the gap between traditional engineering and smart tech.',
                'target_course_pattern' => '.*(mechanical|industrial engineering).*',
                'trigger_skill_pattern' => 'iot|smart manufacturing|automation|robotics',
                'recommendation_type' => 'New Course',
                'recommendation_subject' => 'Industrial IoT and Automation',
                'recommendation_text' => 'Industry 4.0 skills are highly requested. Introduce coursework on sensor networks, IoT, and automated robotics in manufacturing.',
                'threshold_percent' => 25,
                'is_active' => true,
            ],
            [
                'rule_name' => 'Renewable Energy Systems',
                'description' => 'Updates electrical engineering to focus on green tech.',
                'target_course_pattern' => '.*(electrical engineering|environmental).*',
                'trigger_skill_pattern' => 'renewable|solar|wind|green energy',
                'recommendation_type' => 'Course Update',
                'recommendation_subject' => 'Renewable Energy Technologies',
                'recommendation_text' => 'Strong shift towards green energy detected. Expand curriculum to cover solar grid integration and sustainable energy systems.',
                'threshold_percent' => 30,
                'is_active' => true,
            ],

            // --- Business & Management ---
            [
                'rule_name' => 'Integrate Business Analytics',
                'description' => 'Adds data-driven decision making to management degrees.',
                'target_course_pattern' => '.*(business|management|marketing).*',
                'trigger_skill_pattern' => 'business analytics|data visualization|power bi|tableau|data-driven',
                'recommendation_type' => 'New Module',
                'recommendation_subject' => 'Data-Driven Business Analytics',
                'recommendation_text' => 'Employers expect business graduates to handle data. Introduce hands-on modules using Power BI or Tableau for business intelligence.',
                'threshold_percent' => 35,
                'is_active' => true,
            ],
            [
                'rule_name' => 'FinTech & Blockchain Basics',
                'description' => 'Modernizes finance degrees with new financial technologies.',
                'target_course_pattern' => '.*(finance|accounting).*',
                'trigger_skill_pattern' => 'fintech|blockchain|cryptocurrency|smart contracts',
                'recommendation_type' => 'Course Update',
                'recommendation_subject' => 'Financial Technologies (FinTech)',
                'recommendation_text' => 'The finance sector is rapidly adopting blockchain. Introduce foundational concepts of smart contracts and decentralized finance.',
                'threshold_percent' => 20,
                'is_active' => true,
            ],

            // --- Science & Agriculture ---
            [
                'rule_name' => 'Precision Agriculture',
                'description' => 'Modernizes agriculture degrees with tech-driven farming methods.',
                'target_course_pattern' => '.*(agriculture|farming).*',
                'trigger_skill_pattern' => 'precision agriculture|smart farming|agritech|drones',
                'recommendation_type' => 'New Specialization',
                'recommendation_subject' => 'AgriTech & Precision Farming',
                'recommendation_text' => 'AgriTech is booming. Consider a specialization focusing on drone mapping, soil sensors, and data-driven crop management.',
                'threshold_percent' => 30,
                'is_active' => true,
            ],
            [
                'rule_name' => 'Bioinformatics & Data',
                'description' => 'Combines biology with data science skills.',
                'target_course_pattern' => '.*(biology|biotechnology|genetics).*',
                'trigger_skill_pattern' => 'bioinformatics|genomic data|computational biology',
                'recommendation_type' => 'Course Update',
                'recommendation_subject' => 'Computational Biology',
                'recommendation_text' => 'Life sciences require heavy data analysis. Introduce Python and R programming specifically tailored for genomic and biological data.',
                'threshold_percent' => 25,
                'is_active' => true,
            ],

            // --- Medicine & Health Sciences ---
            [
                'rule_name' => 'Health Informatics & Digital Health',
                'description' => 'Updates healthcare management with digital health records.',
                'target_course_pattern' => '.*(nursing|public health|medicine).*',
                'trigger_skill_pattern' => 'health informatics|digital health|emr|telemedicine',
                'recommendation_type' => 'New Module',
                'recommendation_subject' => 'Digital Health Systems',
                'recommendation_text' => 'Telemedicine and Electronic Medical Records (EMR) are standard. Ensure all health science students are proficient in digital health platforms.',
                'threshold_percent' => 40,
                'is_active' => true,
            ],

            // --- Architecture & Design ---
            [
                'rule_name' => 'BIM Technologies in Architecture',
                'description' => 'Ensures architecture students are learning modern 3D modeling.',
                'target_course_pattern' => '.*(architecture|civil engineering).*',
                'trigger_skill_pattern' => 'bim|building information modeling|revit',
                'recommendation_type' => 'Curriculum Refresh',
                'recommendation_subject' => 'Advanced BIM Software',
                'recommendation_text' => 'Transition traditional drafting courses completely to Building Information Modeling (BIM) workflows (e.g., Revit) to meet industry standards.',
                'threshold_percent' => 45,
                'is_active' => true,
            ],

            // --- Hospitality & Tourism ---
            [
                'rule_name' => 'Smart Tourism & Hospitality Tech',
                'description' => 'Updates tourism degrees with booking tech and smart systems.',
                'target_course_pattern' => '.*(hospitality|tourism|hotel management).*',
                'trigger_skill_pattern' => 'smart tourism|hospitality tech|booking systems|digital marketing',
                'recommendation_type' => 'Course Update',
                'recommendation_subject' => 'Digital Innovations in Hospitality',
                'recommendation_text' => 'The hospitality industry relies heavily on digital systems. Add modules covering modern booking engines, revenue management software, and smart hotel tech.',
                'threshold_percent' => 30,
                'is_active' => true,
            ],

            // --- Media & Communication ---
            [
                'rule_name' => 'Digital Content & Multimedia',
                'description' => 'Modernizes communication degrees for the digital era.',
                'target_course_pattern' => '.*(media|communication|journalism).*',
                'trigger_skill_pattern' => 'digital media|content creation|seo|multimedia',
                'recommendation_type' => 'Curriculum Refresh',
                'recommendation_subject' => 'Digital Content Strategy',
                'recommendation_text' => 'Traditional media is shifting. Focus curriculum heavily on SEO, digital content creation, and multimedia storytelling platforms.',
                'threshold_percent' => 35,
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
