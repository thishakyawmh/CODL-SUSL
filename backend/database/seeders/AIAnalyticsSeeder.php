<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Course;
use App\Models\Category;
use App\Models\Semester;
use App\Models\Subject;
use App\Models\Batch;

class AIAnalyticsSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Fetch categories
        $degreeCat = Category::where('name', 'Degree')->first();
        $diplomaCat = Category::where('name', 'Diploma')->first();
        $certificateCat = Category::where('name', 'Certificate')->first();

        // If categories don't exist, create them
        if (!$degreeCat) {
            $degreeCat = Category::create(['name' => 'Degree', 'description' => '4-Year Academic Undergraduate Programs', 'icon' => 'BookOpen', 'color' => '#7C3AED']);
        }
        if (!$diplomaCat) {
            $diplomaCat = Category::create(['name' => 'Diploma', 'description' => '1-2 Year Specialized Diploma Courses', 'icon' => 'BookOpen', 'color' => '#3B82F6']);
        }
        if (!$certificateCat) {
            $certificateCat = Category::create(['name' => 'Certificate', 'description' => 'Short-term Skill and Proficiency Programs', 'icon' => 'Award', 'color' => '#10B981']);
        }

        // --- BSc (Hons) in Software Engineering (Degree) ---
        $seCourse = Course::updateOrCreate(
            ['code' => 'BSc-SE'],
            [
                'title' => 'BSc (Hons) in Software Engineering',
                'level' => 'Degree',
                'department' => 'Computing',
                'duration' => '4 Years',
                'intake_status' => 'Open',
                'max_students' => 120,
                'category_id' => $degreeCat->id
            ]
        );

        // Delete existing semesters/subjects for BSc-SE to avoid duplicates
        foreach ($seCourse->semesters as $sem) {
            $sem->subjects()->delete();
        }
        $seCourse->semesters()->delete();

        // Create semesters and subjects for BSc-SE
        $sem1 = $seCourse->semesters()->create(['name' => 'Year 1 - Semester 1']);
        $sem1->subjects()->createMany([
            ['course_id' => $seCourse->id, 'code' => 'SE-1101', 'name' => 'Introduction to Programming (Python)', 'credits' => '3'],
            ['course_id' => $seCourse->id, 'code' => 'SE-1102', 'name' => 'Web Technologies & Markup Systems (HTML/CSS)', 'credits' => '3'],
            ['course_id' => $seCourse->id, 'code' => 'SE-1103', 'name' => 'Mathematics for Computing', 'credits' => '2']
        ]);

        $sem2 = $seCourse->semesters()->create(['name' => 'Year 1 - Semester 2']);
        $sem2->subjects()->createMany([
            ['course_id' => $seCourse->id, 'code' => 'SE-1201', 'name' => 'Object Oriented Programming (Java)', 'credits' => '3'],
            ['course_id' => $seCourse->id, 'code' => 'SE-1202', 'name' => 'Database Management Systems & SQL', 'credits' => '3'],
            ['course_id' => $seCourse->id, 'code' => 'SE-1203', 'name' => 'Computer Architecture & Systems', 'credits' => '3']
        ]);

        $sem3 = $seCourse->semesters()->create(['name' => 'Year 2 - Semester 1']);
        $sem3->subjects()->createMany([
            ['course_id' => $seCourse->id, 'code' => 'SE-2101', 'name' => 'Data Structures & Algorithms', 'credits' => '3'],
            ['course_id' => $seCourse->id, 'code' => 'SE-2102', 'name' => 'Advanced Web Development (React & Node.js)', 'credits' => '3'],
            ['course_id' => $seCourse->id, 'code' => 'SE-2103', 'name' => 'Operating Systems & Networking', 'credits' => '3']
        ]);

        $sem4 = $seCourse->semesters()->create(['name' => 'Year 2 - Semester 2']);
        $sem4->subjects()->createMany([
            ['course_id' => $seCourse->id, 'code' => 'SE-2201', 'name' => 'Software Project & Quality Assurance', 'credits' => '4'],
            ['course_id' => $seCourse->id, 'code' => 'SE-2202', 'name' => 'Cloud Computing & DevOps (AWS & Docker)', 'credits' => '3'],
            ['course_id' => $seCourse->id, 'code' => 'SE-2203', 'name' => 'Mobile Application Development (Flutter & Dart)', 'credits' => '3']
        ]);

        // Create a default batch and attach materials (slides and files)
        Batch::where('course_id', $seCourse->id)->delete();
        Batch::create([
            'course_id' => $seCourse->id,
            'name' => 'Batch 01',
            'subtitle' => 'Active Regular Batch',
            'start_date' => now()->toDateString(),
            'max_enrollments' => 100,
            'status' => 'Active',
            'materials' => [
                ['filename' => 'Lec_01_Python_Basics.pdf', 'url' => 'http://localhost:8000/storage/materials/python_basics.pdf', 'size' => 1048576],
                ['filename' => 'Lec_02_Python_DataStructures.pdf', 'url' => 'http://localhost:8000/storage/materials/python_ds.pdf', 'size' => 1048576],
                ['filename' => 'Lec_01_HTML5_and_CSS3.pdf', 'url' => 'http://localhost:8000/storage/materials/html_css.pdf', 'size' => 1048576],
                ['filename' => 'Lec_02_Responsive_Web_Design.pdf', 'url' => 'http://localhost:8000/storage/materials/responsive_design.pdf', 'size' => 1048576],
                ['filename' => 'Lec_01_OOP_Concepts_Java.pdf', 'url' => 'http://localhost:8000/storage/materials/oop_java.pdf', 'size' => 1048576],
                ['filename' => 'Lec_02_SQL_Joins_and_Aggregations.pdf', 'url' => 'http://localhost:8000/storage/materials/sql_queries.pdf', 'size' => 1048576],
                ['filename' => 'Lec_01_ReactJS_Functional_Components.pdf', 'url' => 'http://localhost:8000/storage/materials/react_comp.pdf', 'size' => 1048576],
                ['filename' => 'Lec_02_State_Management_Redux.pdf', 'url' => 'http://localhost:8000/storage/materials/redux_state.pdf', 'size' => 1048576],
                ['filename' => 'Lec_03_NodeJS_RESTful_APIs.pdf', 'url' => 'http://localhost:8000/storage/materials/nodejs_api.pdf', 'size' => 1048576],
                ['filename' => 'Lec_01_Cloud_Virtualization_AWS.pdf', 'url' => 'http://localhost:8000/storage/materials/aws_cloud.pdf', 'size' => 1048576],
                ['filename' => 'Lec_02_Docker_Containerization.pdf', 'url' => 'http://localhost:8000/storage/materials/docker.pdf', 'size' => 1048576],
                ['filename' => 'Lec_03_CI_CD_Pipelines_GitHubActions.pdf', 'url' => 'http://localhost:8000/storage/materials/github_actions.pdf', 'size' => 1048576]
            ]
        ]);


        // --- Diploma in Software Engineering (Diploma) ---
        $dipSECourse = Course::updateOrCreate(
            ['code' => 'Dip-SE'],
            [
                'title' => 'Diploma in Software Engineering',
                'level' => 'Diploma',
                'department' => 'Computing',
                'duration' => '1 Year',
                'intake_status' => 'Open',
                'max_students' => 80,
                'category_id' => $diplomaCat->id
            ]
        );

        foreach ($dipSECourse->semesters as $sem) {
            $sem->subjects()->delete();
        }
        $dipSECourse->semesters()->delete();

        $dipSem1 = $dipSECourse->semesters()->create(['name' => 'Semester 1']);
        $dipSem1->subjects()->createMany([
            ['course_id' => $dipSECourse->id, 'code' => 'DSE-101', 'name' => 'Fundamentals of Programming (JavaScript)', 'credits' => '4'],
            ['course_id' => $dipSECourse->id, 'code' => 'DSE-102', 'name' => 'Database Design & SQL Queries', 'credits' => '3']
        ]);

        $dipSem2 = $dipSECourse->semesters()->create(['name' => 'Semester 2']);
        $dipSem2->subjects()->createMany([
            ['course_id' => $dipSECourse->id, 'code' => 'DSE-201', 'name' => 'Web Application Design (PHP & Laravel)', 'credits' => '4'],
            ['course_id' => $dipSECourse->id, 'code' => 'DSE-202', 'name' => 'Software Engineering Concepts', 'credits' => '3']
        ]);

        Batch::where('course_id', $dipSECourse->id)->delete();
        Batch::create([
            'course_id' => $dipSECourse->id,
            'name' => 'Batch 01',
            'subtitle' => 'Active Regular Batch',
            'start_date' => now()->toDateString(),
            'max_enrollments' => 50,
            'status' => 'Active',
            'materials' => [
                ['filename' => 'Lec_01_JavaScript_Basics.pdf', 'url' => 'http://localhost:8000/storage/materials/js_basics.pdf', 'size' => 1048576],
                ['filename' => 'Lec_02_DOM_Manipulation.pdf', 'url' => 'http://localhost:8000/storage/materials/dom_manip.pdf', 'size' => 1048576],
                ['filename' => 'Lec_01_Relational_Databases_SQL.pdf', 'url' => 'http://localhost:8000/storage/materials/db_sql.pdf', 'size' => 1048576],
                ['filename' => 'Lec_01_PHP_Introduction.pdf', 'url' => 'http://localhost:8000/storage/materials/php_intro.pdf', 'size' => 1048576],
                ['filename' => 'Lec_02_MVC_and_Laravel_Routing.pdf', 'url' => 'http://localhost:8000/storage/materials/laravel_route.pdf', 'size' => 1048576]
            ]
        ]);


        // --- Certificate in Python & Data Science (Certificate) ---
        $certDSCourse = Course::updateOrCreate(
            ['code' => 'Cert-DS'],
            [
                'title' => 'Certificate in Python & Data Science',
                'level' => 'Certificate',
                'department' => 'Computing',
                'duration' => '6 Months',
                'intake_status' => 'Open',
                'max_students' => 50,
                'category_id' => $certificateCat->id
            ]
        );

        $certDSCourse->subjects()->delete();
        foreach ($certDSCourse->semesters as $sem) {
            $sem->subjects()->delete();
        }
        $certDSCourse->semesters()->delete();

        $certDSCourse->subjects()->createMany([
            ['code' => 'CDS-01', 'name' => 'Python Scripting & Data Wrangling (Pandas)', 'credits' => '3'],
            ['code' => 'CDS-02', 'name' => 'Introduction to Machine Learning (Scikit-Learn)', 'credits' => '3'],
            ['code' => 'CDS-03', 'name' => 'Data Analysis & Business Intelligence (SQL & PowerBI)', 'credits' => '3']
        ]);

        Batch::where('course_id', $certDSCourse->id)->delete();
        Batch::create([
            'course_id' => $certDSCourse->id,
            'name' => 'Batch 01',
            'subtitle' => 'Active Regular Batch',
            'start_date' => now()->toDateString(),
            'max_enrollments' => 40,
            'status' => 'Active',
            'materials' => [
                ['filename' => 'Lec_01_Python_DataWrangling_Pandas.pdf', 'url' => 'http://localhost:8000/storage/materials/pandas.pdf', 'size' => 1048576],
                ['filename' => 'Lec_02_Data_Cleaning_and_Numpy.pdf', 'url' => 'http://localhost:8000/storage/materials/numpy.pdf', 'size' => 1048576],
                ['filename' => 'Lec_01_Regression_and_Classification_ScikitLearn.pdf', 'url' => 'http://localhost:8000/storage/materials/scikit.pdf', 'size' => 1048576],
                ['filename' => 'Lec_02_Deep_Learning_Neural_Networks.pdf', 'url' => 'http://localhost:8000/storage/materials/neural.pdf', 'size' => 1048576],
                ['filename' => 'Lec_01_SQL_for_Analytics.pdf', 'url' => 'http://localhost:8000/storage/materials/sql_analytics.pdf', 'size' => 1048576],
                ['filename' => 'Lec_02_Business_Intelligence_PowerBI.pdf', 'url' => 'http://localhost:8000/storage/materials/powerbi.pdf', 'size' => 1048576]
            ]
        ]);


        // --- Certificate in Cybersecurity Foundations (Certificate) ---
        $certSecCourse = Course::updateOrCreate(
            ['code' => 'Cert-CS'],
            [
                'title' => 'Certificate in Cybersecurity Foundations',
                'level' => 'Certificate',
                'department' => 'Computing',
                'duration' => '6 Months',
                'intake_status' => 'Open',
                'max_students' => 50,
                'category_id' => $certificateCat->id
            ]
        );

        $certSecCourse->subjects()->delete();
        foreach ($certSecCourse->semesters as $sem) {
            $sem->subjects()->delete();
        }
        $certSecCourse->semesters()->delete();

        $certSecCourse->subjects()->createMany([
            ['code' => 'CCS-01', 'name' => 'Introduction to Cryptography & Network Security', 'credits' => '3'],
            ['code' => 'CCS-02', 'name' => 'Ethical Hacking & Web Vulnerabilities (OWASP Top 10)', 'credits' => '3']
        ]);

        Batch::where('course_id', $certSecCourse->id)->delete();
        Batch::create([
            'course_id' => $certSecCourse->id,
            'name' => 'Batch 01',
            'subtitle' => 'Active Regular Batch',
            'start_date' => now()->toDateString(),
            'max_enrollments' => 30,
            'status' => 'Active',
            'materials' => [
                ['filename' => 'Lec_01_Symmetric_Asymmetric_Cryptography.pdf', 'url' => 'http://localhost:8000/storage/materials/cryptography.pdf', 'size' => 1048576],
                ['filename' => 'Lec_02_Network_Security_Protocols.pdf', 'url' => 'http://localhost:8000/storage/materials/net_security.pdf', 'size' => 1048576],
                ['filename' => 'Lec_01_OWASP_Top_10_Vulnerabilities.pdf', 'url' => 'http://localhost:8000/storage/materials/owasp.pdf', 'size' => 1048576],
                ['filename' => 'Lec_02_Penetration_Testing_Lab.pdf', 'url' => 'http://localhost:8000/storage/materials/pentest.pdf', 'size' => 1048576]
            ]
        ]);

        echo "AI Analytics demo courses and subjects seeded successfully!\n";
    }
}
