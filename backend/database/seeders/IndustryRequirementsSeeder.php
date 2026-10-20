<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class IndustryRequirementsSeeder extends Seeder
{
    public function run(): void
    {
        // Truncate first to avoid duplicates
        DB::connection('analytics')->table('industry_requirements')->truncate();

        $companies = [
            [
                'company_name' => 'WSO2 Sri Lanka',
                'industry_sector' => 'Computing & Information Technology',
                'organization_size' => 'Large (251+ Employees)',
                'primary_academic_field' => 'Computing & Information Technology',
                'secondary_academic_field' => 'Engineering & Technology',
                'third_academic_field' => 'Business & Management',
                'required_skills' => 'Docker, Kubernetes, CI/CD, Git, GitHub Actions, Linux, Microservices, REST APIs, Java, Spring Boot',
                'academic_practices' => 'Practical Labs, Industry Internships, Guest Lectures, Capstone Projects',
                'minimum_qualification' => 'Undergraduate',
                'minimum_degree_result' => 'Second Class Upper',
                'certification_importance' => 4,
                'emerging_fields' => 'DevOps, Cloud Computing, Microservices Orchestration',
                'new_program_suggestion' => 'BSc in DevOps and Cloud Computing',
                'graduate_skill_gaps' => 'Lack of hands-on containerization experience, poor understanding of deployment pipelines',
                'additional_recommendations' => 'Incorporate cloud platform training like AWS or Azure.'
            ],
            [
                'company_name' => 'Sysco Labs',
                'industry_sector' => 'Computing & Information Technology',
                'organization_size' => 'Large (251+ Employees)',
                'primary_academic_field' => 'Computing & Information Technology',
                'secondary_academic_field' => 'Business & Management',
                'third_academic_field' => 'Mathematics & Statistics',
                'required_skills' => 'Python, TensorFlow, PyTorch, SQL, Pandas, NumPy, Data Structures, Algorithms, Software Testing',
                'academic_practices' => 'Practical Labs, Research Projects, Industry Internships, Hackathons',
                'minimum_qualification' => 'Undergraduate',
                'minimum_degree_result' => 'Second Class Upper',
                'certification_importance' => 3,
                'emerging_fields' => 'Artificial Intelligence, Machine Learning, Data Science',
                'new_program_suggestion' => 'BSc in Data Science and Artificial Intelligence',
                'graduate_skill_gaps' => 'Theoretical knowledge of AI is good, but practical model deployment and data engineering skills are lacking',
                'additional_recommendations' => 'Use Jupyter Notebooks and real datasets in assignments.'
            ],
            [
                'company_name' => 'Dialog Axiata',
                'industry_sector' => 'Telecommunications',
                'organization_size' => 'Large (251+ Employees)',
                'primary_academic_field' => 'Computing & Information Technology',
                'secondary_academic_field' => 'Engineering & Technology',
                'third_academic_field' => 'Marketing',
                'required_skills' => 'Cloud Computing, AWS, Network Security, Python, Bash Scripting, Linux, Telecommunication Networks, GSM, LTE',
                'academic_practices' => 'Industry Internships, Field Visits, Practical Labs, Guest Lectures',
                'minimum_qualification' => 'Undergraduate',
                'minimum_degree_result' => 'Pass',
                'certification_importance' => 5,
                'emerging_fields' => 'Network Security, Cloud Security, 5G Network Systems',
                'new_program_suggestion' => 'BSc in Cloud and Network Security',
                'graduate_skill_gaps' => 'Familiarity with cloud security compliance, hands-on Linux system administration',
                'additional_recommendations' => 'Encourage student certifications like AWS Certified Cloud Practitioner.'
            ],
            [
                'company_name' => 'Zone24x7',
                'industry_sector' => 'Computing & Information Technology',
                'organization_size' => 'Medium (51-250 Employees)',
                'primary_academic_field' => 'Engineering & Technology',
                'secondary_academic_field' => 'Computing & Information Technology',
                'third_academic_field' => 'Mathematics & Statistics',
                'required_skills' => 'Embedded Systems, IoT, C++, Python, PLC Programming, Smart Sensors, Signal Processing, MATLAB',
                'academic_practices' => 'Practical Labs, Hackathons, Capstone Projects, Workshops',
                'minimum_qualification' => 'Undergraduate',
                'minimum_degree_result' => 'Second Class Lower',
                'certification_importance' => 3,
                'emerging_fields' => 'Internet of Things (IoT), Robotics, Automation Engineering',
                'new_program_suggestion' => 'BSc in Robotics and Smart Systems',
                'graduate_skill_gaps' => 'Hardware-software interfacing, micro-controller code efficiency',
                'additional_recommendations' => 'Introduce Arduino and Raspberry Pi hardware labs.'
            ],
            [
                'company_name' => 'LSEG Technology',
                'industry_sector' => 'Financial Technology',
                'organization_size' => 'Large (251+ Employees)',
                'primary_academic_field' => 'Computing & Information Technology',
                'secondary_academic_field' => 'Accounting & Finance',
                'third_academic_field' => 'Mathematics & Statistics',
                'required_skills' => 'C++, Java, React, SQL, DevOps, Git, Financial Markets Knowledge, Cryptography, Blockchain',
                'academic_practices' => 'Practical Labs, Guest Lectures, Industry Internships, Competitions',
                'minimum_qualification' => 'Undergraduate',
                'minimum_degree_result' => 'Second Class Upper',
                'certification_importance' => 4,
                'emerging_fields' => 'Financial Technology (FinTech), Blockchain Systems',
                'new_program_suggestion' => 'BSc in Financial Computing',
                'graduate_skill_gaps' => 'Understanding of corporate finance, multi-threading in C++ applications',
                'additional_recommendations' => 'Integrate finance electives into IT programs.'
            ]
        ];

        // Seed 15 more dynamically generated records to have a large population of 20 companies
        $fields = [
            'Computing & Information Technology',
            'Business & Management',
            'Accounting & Finance',
            'Engineering & Technology',
            'Marketing'
        ];

        $skills = [
            'React, Node.js, SQL, REST APIs, Git, UI/UX Design, CSS, TailwindCSS',
            'Project Management, Agile, JIRA, Communication, Scrum, Business Analysis',
            'Accounting, Auditing, Tax Compliance, Excel, ERP Systems, SAP',
            'Digital Marketing, SEO, SEM, Content Writing, Google Analytics, Social Media',
            'HTML, CSS, JavaScript, PHP, MySQL, WordPress, Bootstrap'
        ];

        $practices = [
            'Practical Labs, Group Projects, Guest Lectures',
            'Workshops, Individual Projects, Online Learning',
            'Field Visits, Industry Internships, Capstone Projects'
        ];

        for ($i = 0; $i < 15; $i++) {
            $idx = $i % 5;
            $companies[] = [
                'company_name' => 'Tech Industry Corp ' . ($i + 1),
                'industry_sector' => $fields[$idx],
                'organization_size' => 'Medium (51-250 Employees)',
                'primary_academic_field' => $fields[$idx],
                'secondary_academic_field' => $fields[($idx + 1) % 5],
                'third_academic_field' => $fields[($idx + 2) % 5],
                'required_skills' => $skills[$idx],
                'academic_practices' => $practices[$i % 3],
                'minimum_qualification' => 'Undergraduate',
                'minimum_degree_result' => 'Second Class Lower',
                'certification_importance' => rand(2, 5),
                'emerging_fields' => 'Artificial Intelligence, Digital Transformation, Cloud Solutions',
                'new_program_suggestion' => 'BSc in Digital Business Management',
                'graduate_skill_gaps' => 'Communication, team collaboration, hands-on tool knowledge',
                'additional_recommendations' => 'Focus more on industrial case studies.'
            ];
        }

        foreach ($companies as $c) {
            $c['created_at'] = now();
            $c['updated_at'] = now();
            DB::connection('analytics')->table('industry_requirements')->insert($c);
        }

        echo "20 realistic industry requirements seeded successfully!\n";
    }
}
