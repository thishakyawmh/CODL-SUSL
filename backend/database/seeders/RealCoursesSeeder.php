<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Category;
use App\Models\Course;
use App\Models\Semester;
use App\Models\Subject;

class RealCoursesSeeder extends Seeder
{
    public function run(): void
    {
        // Fetch Categories
        $degreeCategory = Category::where('name', 'Degree')->first();
        $hndCategory = Category::where('name', 'Higher National Diploma')->first();
        $diplomaCategory = Category::where('name', 'Diploma')->first();
        $advCertCategory = Category::where('name', 'Advanced Certificate')->first();
        $certCategory = Category::where('name', 'Certificate')->first();

        // 1. Degree Programmes (4 programmes, 3 years, 6 semesters each)
        $degreePrograms = [
            [
                'title' => 'Bachelor of Science in Information Technology',
                'code' => 'BSC-IT',
                'level' => 'Degree',
                'duration' => '3 Years',
                'department' => 'Faculty of Computing',
                'max_students' => 120,
                'category_id' => $degreeCategory?->id,
                'semesters' => [
                    'Semester 1' => [
                        ['code' => 'BIT111', 'name' => 'Introduction to Information Technology', 'credits' => '3'],
                        ['code' => 'BIT112', 'name' => 'Mathematics for Computing', 'credits' => '3'],
                        ['code' => 'BIT113', 'name' => 'Programming Fundamentals', 'credits' => '4'],
                    ],
                    'Semester 2' => [
                        ['code' => 'BIT121', 'name' => 'Database Management Systems', 'credits' => '4'],
                        ['code' => 'BIT122', 'name' => 'Data Structures & Algorithms', 'credits' => '4'],
                        ['code' => 'BIT123', 'name' => 'Object-Oriented Programming', 'credits' => '3'],
                    ],
                    'Semester 3' => [
                        ['code' => 'BIT211', 'name' => 'Web Technologies', 'credits' => '3'],
                        ['code' => 'BIT212', 'name' => 'Operating Systems', 'credits' => '3'],
                        ['code' => 'BIT213', 'name' => 'Software Engineering', 'credits' => '3'],
                    ],
                    'Semester 4' => [
                        ['code' => 'BIT221', 'name' => 'Computer Networks', 'credits' => '4'],
                        ['code' => 'BIT222', 'name' => 'Human-Computer Interaction', 'credits' => '3'],
                        ['code' => 'BIT223', 'name' => 'Object-Oriented Analysis & Design', 'credits' => '3'],
                    ],
                    'Semester 5' => [
                        ['code' => 'BIT311', 'name' => 'Information Security', 'credits' => '3'],
                        ['code' => 'BIT312', 'name' => 'Cloud Computing', 'credits' => '3'],
                        ['code' => 'BIT313', 'name' => 'Mobile Application Development', 'credits' => '4'],
                    ],
                    'Semester 6' => [
                        ['code' => 'BIT321', 'name' => 'IT Project Management', 'credits' => '3'],
                        ['code' => 'BIT322', 'name' => 'Artificial Intelligence', 'credits' => '3'],
                        ['code' => 'BIT323', 'name' => 'Capstone Project', 'credits' => '6'],
                    ],
                ]
            ],
            [
                'title' => 'Bachelor of Business Administration in E-Business',
                'code' => 'BBA-EBUS',
                'level' => 'Degree',
                'duration' => '3 Years',
                'department' => 'Faculty of Management Studies',
                'max_students' => 150,
                'category_id' => $degreeCategory?->id,
                'semesters' => [
                    'Semester 1' => [
                        ['code' => 'BBA111', 'name' => 'Principles of Management', 'credits' => '3'],
                        ['code' => 'BBA112', 'name' => 'Business Mathematics', 'credits' => '3'],
                        ['code' => 'BBA113', 'name' => 'Financial Accounting', 'credits' => '3'],
                    ],
                    'Semester 2' => [
                        ['code' => 'BBA121', 'name' => 'Microeconomics', 'credits' => '3'],
                        ['code' => 'BBA122', 'name' => 'Business Communication', 'credits' => '3'],
                        ['code' => 'BBA123', 'name' => 'Marketing Management', 'credits' => '3'],
                    ],
                    'Semester 3' => [
                        ['code' => 'BBA211', 'name' => 'E-Commerce Fundamentals', 'credits' => '4'],
                        ['code' => 'BBA212', 'name' => 'Organizational Behavior', 'credits' => '3'],
                        ['code' => 'BBA213', 'name' => 'Human Resource Management', 'credits' => '3'],
                    ],
                    'Semester 4' => [
                        ['code' => 'BBA221', 'name' => 'E-Business Strategy', 'credits' => '4'],
                        ['code' => 'BBA222', 'name' => 'Management Information Systems', 'credits' => '3'],
                        ['code' => 'BBA223', 'name' => 'Business Statistics', 'credits' => '3'],
                    ],
                    'Semester 5' => [
                        ['code' => 'BBA311', 'name' => 'Digital Marketing', 'credits' => '3'],
                        ['code' => 'BBA312', 'name' => 'Supply Chain Management', 'credits' => '3'],
                        ['code' => 'BBA313', 'name' => 'Consumer Behavior', 'credits' => '3'],
                    ],
                    'Semester 6' => [
                        ['code' => 'BBA321', 'name' => 'Business Research Methods', 'credits' => '3'],
                        ['code' => 'BBA322', 'name' => 'E-Business Law & Ethics', 'credits' => '3'],
                        ['code' => 'BBA323', 'name' => 'BBA Internship', 'credits' => '6'],
                    ],
                ]
            ],
            [
                'title' => 'Bachelor of Arts in English and Digital Communication',
                'code' => 'BA-EDC',
                'level' => 'Degree',
                'duration' => '3 Years',
                'department' => 'Faculty of Social Sciences and Languages',
                'max_students' => 100,
                'category_id' => $degreeCategory?->id,
                'semesters' => [
                    'Semester 1' => [
                        ['code' => 'BAE111', 'name' => 'History of English Literature', 'credits' => '3'],
                        ['code' => 'BAE112', 'name' => 'Introduction to Digital Media', 'credits' => '3'],
                        ['code' => 'BAE113', 'name' => 'Academic Writing', 'credits' => '3'],
                    ],
                    'Semester 2' => [
                        ['code' => 'BAE121', 'name' => 'Modern English Grammar', 'credits' => '3'],
                        ['code' => 'BAE122', 'name' => 'Creative Writing', 'credits' => '3'],
                        ['code' => 'BAE123', 'name' => 'Media Literacy', 'credits' => '3'],
                    ],
                    'Semester 3' => [
                        ['code' => 'BAE211', 'name' => 'Digital Storytelling', 'credits' => '4'],
                        ['code' => 'BAE212', 'name' => 'Professional Communication', 'credits' => '3'],
                        ['code' => 'BAE213', 'name' => 'Sociolinguistics', 'credits' => '3'],
                    ],
                    'Semester 4' => [
                        ['code' => 'BAE221', 'name' => 'Technical Writing', 'credits' => '4'],
                        ['code' => 'BAE222', 'name' => 'Digital Content Creation', 'credits' => '3'],
                        ['code' => 'BAE223', 'name' => 'Mass Communication', 'credits' => '3'],
                    ],
                    'Semester 5' => [
                        ['code' => 'BAE311', 'name' => 'Public Relations', 'credits' => '3'],
                        ['code' => 'BAE312', 'name' => 'Web Content Writing', 'credits' => '3'],
                        ['code' => 'BAE313', 'name' => 'Translation Methods', 'credits' => '3'],
                    ],
                    'Semester 6' => [
                        ['code' => 'BAE321', 'name' => 'Research Project', 'credits' => '4'],
                        ['code' => 'BAE322', 'name' => 'Digital Journalism', 'credits' => '3'],
                        ['code' => 'BAE323', 'name' => 'Professional Internship', 'credits' => '6'],
                    ],
                ]
            ],
            [
                'title' => 'Bachelor of Science in Agricultural Technology & Management',
                'code' => 'BSC-AGTECH',
                'level' => 'Degree',
                'duration' => '3 Years',
                'department' => 'Faculty of Agricultural Sciences',
                'max_students' => 80,
                'category_id' => $degreeCategory?->id,
                'semesters' => [
                    'Semester 1' => [
                        ['code' => 'AGT111', 'name' => 'Fundamentals of Crop Production', 'credits' => '3'],
                        ['code' => 'AGT112', 'name' => 'Soil Science Basics', 'credits' => '3'],
                        ['code' => 'AGT113', 'name' => 'Introduction to Agrotechnology', 'credits' => '3'],
                    ],
                    'Semester 2' => [
                        ['code' => 'AGT121', 'name' => 'Plant Physiology', 'credits' => '3'],
                        ['code' => 'AGT122', 'name' => 'Principles of Pest Management', 'credits' => '3'],
                        ['code' => 'AGT123', 'name' => 'Agricultural Botany', 'credits' => '3'],
                    ],
                    'Semester 3' => [
                        ['code' => 'AGT211', 'name' => 'Smart Farming & IoT', 'credits' => '4'],
                        ['code' => 'AGT212', 'name' => 'Plant Breeding & Genetics', 'credits' => '3'],
                        ['code' => 'AGT213', 'name' => 'Postharvest Technology', 'credits' => '3'],
                    ],
                    'Semester 4' => [
                        ['code' => 'AGT221', 'name' => 'Agricultural Machinery', 'credits' => '4'],
                        ['code' => 'AGT222', 'name' => 'Organic Farming', 'credits' => '3'],
                        ['code' => 'AGT223', 'name' => 'Farm Business Management', 'credits' => '3'],
                    ],
                    'Semester 5' => [
                        ['code' => 'AGT311', 'name' => 'Greenhouse Technology', 'credits' => '3'],
                        ['code' => 'AGT312', 'name' => 'Agricultural Marketing', 'credits' => '3'],
                        ['code' => 'AGT313', 'name' => 'GIS & Remote Sensing in Agriculture', 'credits' => '3'],
                    ],
                    'Semester 6' => [
                        ['code' => 'AGT321', 'name' => 'Capstone Project', 'credits' => '6'],
                        ['code' => 'AGT322', 'name' => 'Agribusiness & Entrepreneurship', 'credits' => '3'],
                        ['code' => 'AGT323', 'name' => 'Sustainable Resource Management', 'credits' => '3'],
                    ],
                ]
            ],
        ];

        // 2. Higher National Diploma Programmes (4 programs: two 2-year, two 1-year)
        $hndPrograms = [
            [
                'title' => 'Higher National Diploma in Software Engineering',
                'code' => 'HND-SE',
                'level' => 'Higher National Diploma',
                'duration' => '2 Years',
                'department' => 'Faculty of Computing',
                'max_students' => 100,
                'category_id' => $hndCategory?->id,
                'semesters' => [
                    'Semester 1' => [
                        ['code' => 'HNDSE111', 'name' => 'Programming Concepts', 'credits' => '3'],
                        ['code' => 'HNDSE112', 'name' => 'Database Systems', 'credits' => '3'],
                        ['code' => 'HNDSE113', 'name' => 'Computer Systems & Architecture', 'credits' => '3'],
                    ],
                    'Semester 2' => [
                        ['code' => 'HNDSE121', 'name' => 'Web Application Development', 'credits' => '4'],
                        ['code' => 'HNDSE122', 'name' => 'Software Engineering Principles', 'credits' => '3'],
                        ['code' => 'HNDSE123', 'name' => 'Data Structures', 'credits' => '3'],
                    ],
                    'Semester 3' => [
                        ['code' => 'HNDSE211', 'name' => 'Mobile Development', 'credits' => '4'],
                        ['code' => 'HNDSE212', 'name' => 'Cloud Technologies', 'credits' => '3'],
                        ['code' => 'HNDSE213', 'name' => 'Advanced Java Programming', 'credits' => '3'],
                    ],
                    'Semester 4' => [
                        ['code' => 'HNDSE221', 'name' => 'DevOps Fundamentals', 'credits' => '3'],
                        ['code' => 'HNDSE222', 'name' => 'Software Testing & QA', 'credits' => '3'],
                        ['code' => 'HNDSE223', 'name' => 'Software Engineering Group Project', 'credits' => '6'],
                    ],
                ]
            ],
            [
                'title' => 'Higher National Diploma in Business Management',
                'code' => 'HND-BM',
                'level' => 'Higher National Diploma',
                'duration' => '2 Years',
                'department' => 'Faculty of Management Studies',
                'max_students' => 120,
                'category_id' => $hndCategory?->id,
                'semesters' => [
                    'Semester 1' => [
                        ['code' => 'HNDBM111', 'name' => 'Business Environment', 'credits' => '3'],
                        ['code' => 'HNDBM112', 'name' => 'Managing Financial Resources', 'credits' => '3'],
                        ['code' => 'HNDBM113', 'name' => 'Organizations and Behaviour', 'credits' => '3'],
                    ],
                    'Semester 2' => [
                        ['code' => 'HNDBM121', 'name' => 'Marketing Principles', 'credits' => '3'],
                        ['code' => 'HNDBM122', 'name' => 'Human Resource Management', 'credits' => '3'],
                        ['code' => 'HNDBM123', 'name' => 'Business Decision Making', 'credits' => '3'],
                    ],
                    'Semester 3' => [
                        ['code' => 'HNDBM211', 'name' => 'Business Strategy', 'credits' => '4'],
                        ['code' => 'HNDBM212', 'name' => 'Operations Management', 'credits' => '3'],
                        ['code' => 'HNDBM213', 'name' => 'Working with and Leading People', 'credits' => '3'],
                    ],
                    'Semester 4' => [
                        ['code' => 'HNDBM221', 'name' => 'Business Project', 'credits' => '5'],
                        ['code' => 'HNDBM222', 'name' => 'Enterprise & Entrepreneurship', 'credits' => '3'],
                        ['code' => 'HNDBM223', 'name' => 'Financial Decision Making', 'credits' => '3'],
                    ],
                ]
            ],
            [
                'title' => 'Higher National Diploma in Hospitality Management',
                'code' => 'HND-HM',
                'level' => 'Higher National Diploma',
                'duration' => '1 Year',
                'department' => 'Faculty of Management Studies',
                'max_students' => 60,
                'category_id' => $hndCategory?->id,
                'semesters' => [
                    'Semester 1' => [
                        ['code' => 'HNDHM111', 'name' => 'Introduction to Hospitality Industry', 'credits' => '3'],
                        ['code' => 'HNDHM112', 'name' => 'Food and Beverage Operations', 'credits' => '4'],
                        ['code' => 'HNDHM113', 'name' => 'Customer Service Management', 'credits' => '3'],
                    ],
                    'Semester 2' => [
                        ['code' => 'HNDHM121', 'name' => 'Front Office Operations', 'credits' => '3'],
                        ['code' => 'HNDHM122', 'name' => 'Facility and Operations Management', 'credits' => '4'],
                        ['code' => 'HNDHM123', 'name' => 'Hospitality Project', 'credits' => '4'],
                    ],
                ]
            ],
            [
                'title' => 'Higher National Diploma in Graphic Design',
                'code' => 'HND-GD',
                'level' => 'Higher National Diploma',
                'duration' => '1 Year',
                'department' => 'Faculty of Social Sciences and Languages',
                'max_students' => 50,
                'category_id' => $hndCategory?->id,
                'semesters' => [
                    'Semester 1' => [
                        ['code' => 'HNDGD111', 'name' => 'Visual Communication Principles', 'credits' => '4'],
                        ['code' => 'HNDGD112', 'name' => 'Typography Essentials', 'credits' => '3'],
                        ['code' => 'HNDGD113', 'name' => 'Digital Design Tools', 'credits' => '3'],
                    ],
                    'Semester 2' => [
                        ['code' => 'HNDGD121', 'name' => 'Branding and Packaging', 'credits' => '4'],
                        ['code' => 'HNDGD122', 'name' => 'Web and Interactive Design', 'credits' => '4'],
                        ['code' => 'HNDGD123', 'name' => 'Design Portfolio Project', 'credits' => '5'],
                    ],
                ]
            ],
        ];

        // 3. Diploma Programmes (4 programs, 1 year each)
        $diplomaPrograms = [
            [
                'title' => 'Diploma in Computer Networks',
                'code' => 'D-NET',
                'level' => 'Diploma',
                'duration' => '1 Year',
                'department' => 'Faculty of Computing',
                'max_students' => 80,
                'category_id' => $diplomaCategory?->id,
                'semesters' => [
                    'Semester 1' => [
                        ['code' => 'DNET111', 'name' => 'Networking Basics & Theory', 'credits' => '3'],
                        ['code' => 'DNET112', 'name' => 'Hardware & Operating Systems', 'credits' => '3'],
                        ['code' => 'DNET113', 'name' => 'Routing & Switching Essentials', 'credits' => '4'],
                    ],
                    'Semester 2' => [
                        ['code' => 'DNET121', 'name' => 'Network Security', 'credits' => '4'],
                        ['code' => 'DNET122', 'name' => 'Server Administration', 'credits' => '4'],
                        ['code' => 'DNET123', 'name' => 'Network Troubleshooting Project', 'credits' => '4'],
                    ],
                ]
            ],
            [
                'title' => 'Diploma in Financial Accounting',
                'code' => 'D-FA',
                'level' => 'Diploma',
                'duration' => '1 Year',
                'department' => 'Faculty of Management Studies',
                'max_students' => 100,
                'category_id' => $diplomaCategory?->id,
                'semesters' => [
                    'Semester 1' => [
                        ['code' => 'DFA111', 'name' => 'Financial Accounting Principles', 'credits' => '3'],
                        ['code' => 'DFA112', 'name' => 'Business Mathematics', 'credits' => '3'],
                        ['code' => 'DFA113', 'name' => 'Principles of Microeconomics', 'credits' => '3'],
                    ],
                    'Semester 2' => [
                        ['code' => 'DFA121', 'name' => 'Cost Accounting', 'credits' => '4'],
                        ['code' => 'DFA122', 'name' => 'Tax Law and Practice', 'credits' => '4'],
                        ['code' => 'DFA123', 'name' => 'Computerized Accounting Systems', 'credits' => '4'],
                    ],
                ]
            ],
            [
                'title' => 'Diploma in English Language Studies',
                'code' => 'D-ELS',
                'level' => 'Diploma',
                'duration' => '1 Year',
                'department' => 'Faculty of Social Sciences and Languages',
                'max_students' => 120,
                'category_id' => $diplomaCategory?->id,
                'semesters' => [
                    'Semester 1' => [
                        ['code' => 'DELS111', 'name' => 'Basic Grammar & Composition', 'credits' => '3'],
                        ['code' => 'DELS112', 'name' => 'Conversational English', 'credits' => '3'],
                        ['code' => 'DELS113', 'name' => 'Reading Comprehension', 'credits' => '3'],
                    ],
                    'Semester 2' => [
                        ['code' => 'DELS121', 'name' => 'Advanced Composition', 'credits' => '4'],
                        ['code' => 'DELS122', 'name' => 'Business Communication', 'credits' => '3'],
                        ['code' => 'DELS123', 'name' => 'Introduction to English Literature', 'credits' => '3'],
                    ],
                ]
            ],
            [
                'title' => 'Diploma in Agribusiness Management',
                'code' => 'D-ABM',
                'level' => 'Diploma',
                'duration' => '1 Year',
                'department' => 'Faculty of Agricultural Sciences',
                'max_students' => 60,
                'category_id' => $diplomaCategory?->id,
                'semesters' => [
                    'Semester 1' => [
                        ['code' => 'DABM111', 'name' => 'Introduction to Agribusiness', 'credits' => '3'],
                        ['code' => 'DABM112', 'name' => 'Crop Production Management', 'credits' => '3'],
                        ['code' => 'DABM113', 'name' => 'Principles of Farm Accounting', 'credits' => '3'],
                    ],
                    'Semester 2' => [
                        ['code' => 'DABM121', 'name' => 'Agricultural Marketing', 'credits' => '4'],
                        ['code' => 'DABM122', 'name' => 'Supply Chain in Agriculture', 'credits' => '4'],
                        ['code' => 'DABM123', 'name' => 'Agribusiness Project', 'credits' => '4'],
                    ],
                ]
            ],
        ];

        // 4. Advanced Certificate Programmes (4 programs: two 6-month, two 4-month)
        $advCertPrograms = [
            [
                'title' => 'Advanced Certificate in Python Programming',
                'code' => 'AC-PY',
                'level' => 'Advanced Certificate',
                'duration' => '6 Months',
                'department' => 'Faculty of Computing',
                'max_students' => 80,
                'category_id' => $advCertCategory?->id,
                'semesters' => [
                    'Semester 1' => [
                        ['code' => 'ACPY101', 'name' => 'Python Basics & Syntax', 'credits' => '3'],
                        ['code' => 'ACPY102', 'name' => 'Object-Oriented Python', 'credits' => '3'],
                        ['code' => 'ACPY103', 'name' => 'Web Development with Flask/Django', 'credits' => '4'],
                    ]
                ]
            ],
            [
                'title' => 'Advanced Certificate in Digital Marketing',
                'code' => 'AC-DM',
                'level' => 'Advanced Certificate',
                'duration' => '6 Months',
                'department' => 'Faculty of Management Studies',
                'max_students' => 100,
                'category_id' => $advCertCategory?->id,
                'semesters' => [
                    'Semester 1' => [
                        ['code' => 'ACDM101', 'name' => 'Fundamentals of Digital Marketing', 'credits' => '3'],
                        ['code' => 'ACDM102', 'name' => 'Search Engine Optimization (SEO)', 'credits' => '3'],
                        ['code' => 'ACDM103', 'name' => 'Social Media & Content Marketing', 'credits' => '4'],
                    ]
                ]
            ],
            [
                'title' => 'Advanced Certificate in Human Resource Practices',
                'code' => 'AC-HRP',
                'level' => 'Advanced Certificate',
                'duration' => '4 Months',
                'department' => 'Faculty of Management Studies',
                'max_students' => 75,
                'category_id' => $advCertCategory?->id,
                'semesters' => [
                    'Semester 1' => [
                        ['code' => 'ACHR101', 'name' => 'Modern HR Concepts', 'credits' => '3'],
                        ['code' => 'ACHR102', 'name' => 'Employee Relations & Labor Law', 'credits' => '3'],
                        ['code' => 'ACHR103', 'name' => 'Performance Management Systems', 'credits' => '3'],
                    ]
                ]
            ],
            [
                'title' => 'Advanced Certificate in Tourism Management',
                'code' => 'AC-TM',
                'level' => 'Advanced Certificate',
                'duration' => '4 Months',
                'department' => 'Faculty of Management Studies',
                'max_students' => 50,
                'category_id' => $advCertCategory?->id,
                'semesters' => [
                    'Semester 1' => [
                        ['code' => 'ACTM101', 'name' => 'Basics of Tourism Management', 'credits' => '3'],
                        ['code' => 'ACTM102', 'name' => 'Travel Agency Operations', 'credits' => '3'],
                        ['code' => 'ACTM103', 'name' => 'Tour Guiding Techniques', 'credits' => '3'],
                    ]
                ]
            ],
        ];

        // 5. Certificate Programmes (4 programs: two 3-month, two 4-month)
        $certPrograms = [
            [
                'title' => 'Certificate in Web Design',
                'code' => 'C-WD',
                'level' => 'Certificate',
                'duration' => '3 Months',
                'department' => 'Faculty of Computing',
                'max_students' => 90,
                'category_id' => $certCategory?->id,
                'semesters' => [
                    'Semester 1' => [
                        ['code' => 'CWD101', 'name' => 'HTML5 & CSS3 Essentials', 'credits' => '3'],
                        ['code' => 'CWD102', 'name' => 'Introduction to Javascript', 'credits' => '3'],
                        ['code' => 'CWD103', 'name' => 'Responsive Web Layouts', 'credits' => '2'],
                    ]
                ]
            ],
            [
                'title' => 'Certificate in Spoken English',
                'code' => 'C-SE',
                'level' => 'Certificate',
                'duration' => '3 Months',
                'department' => 'Faculty of Social Sciences and Languages',
                'max_students' => 150,
                'category_id' => $certCategory?->id,
                'semesters' => [
                    'Semester 1' => [
                        ['code' => 'CSE101', 'name' => 'Phonetics & Pronunciation', 'credits' => '3'],
                        ['code' => 'CSE102', 'name' => 'Conversational Practice', 'credits' => '3'],
                        ['code' => 'CSE103', 'name' => 'Public Speaking Basics', 'credits' => '2'],
                    ]
                ]
            ],
            [
                'title' => 'Certificate in Graphic Design Tools',
                'code' => 'C-GDT',
                'level' => 'Certificate',
                'duration' => '4 Months',
                'department' => 'Faculty of Social Sciences and Languages',
                'max_students' => 60,
                'category_id' => $certCategory?->id,
                'semesters' => [
                    'Semester 1' => [
                        ['code' => 'CGD101', 'name' => 'Adobe Photoshop Essentials', 'credits' => '3'],
                        ['code' => 'CGD102', 'name' => 'Adobe Illustrator Vector Art', 'credits' => '3'],
                        ['code' => 'CGD103', 'name' => 'Indesign Page Layouts', 'credits' => '3'],
                    ]
                ]
            ],
            [
                'title' => 'Certificate in Entrepreneurship',
                'code' => 'C-ENT',
                'level' => 'Certificate',
                'duration' => '4 Months',
                'department' => 'Faculty of Management Studies',
                'max_students' => 80,
                'category_id' => $certCategory?->id,
                'semesters' => [
                    'Semester 1' => [
                        ['code' => 'CENT101', 'name' => 'Business Plan Formulation', 'credits' => '3'],
                        ['code' => 'CENT102', 'name' => 'Small Business Finance', 'credits' => '3'],
                        ['code' => 'CENT103', 'name' => 'Local Market Research', 'credits' => '3'],
                    ]
                ]
            ],
        ];

        // Merge all arrays
        $allPrograms = array_merge(
            $degreePrograms,
            $hndPrograms,
            $diplomaPrograms,
            $advCertPrograms,
            $certPrograms
        );

        foreach ($allPrograms as $prog) {
            // Create or update Course
            $course = Course::updateOrCreate(
                ['code' => $prog['code']],
                [
                    'title' => $prog['title'],
                    'level' => $prog['level'],
                    'duration' => $prog['duration'],
                    'department' => $prog['department'],
                    'max_students' => $prog['max_students'],
                    'category_id' => $prog['category_id'],
                    'intake_status' => 'Open',
                ]
            );

            // Create Semesters and Subjects
            foreach ($prog['semesters'] as $semName => $subjectsList) {
                $semester = Semester::updateOrCreate(
                    [
                        'course_id' => $course->id,
                        'name' => $semName,
                    ]
                );

                foreach ($subjectsList as $subData) {
                    Subject::updateOrCreate(
                        ['code' => $subData['code']],
                        [
                            'course_id' => $course->id,
                            'semester_id' => $semester->id,
                            'name' => $subData['name'],
                            'credits' => $subData['credits'],
                        ]
                    );
                }
            }
        }
    }
}
