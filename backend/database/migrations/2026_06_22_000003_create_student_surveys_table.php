<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('student_surveys', function (Blueprint $table) {
            $table->id();
            $table->string('name')->nullable();
            $table->string('email')->nullable();
            $table->string('interest_field'); // AI, Cyber Security, etc.
            $table->string('career_path')->nullable();
            $table->timestamps();
        });

        // Seed prospective student interests (around 25 responses)
        $responses = [
            ['name' => 'Amal Perera', 'email' => 'amal@gmail.com', 'interest_field' => 'Artificial Intelligence', 'career_path' => 'Machine Learning Engineer'],
            ['name' => 'Nimal Silva', 'email' => 'nimal@yahoo.com', 'interest_field' => 'Cyber Security', 'career_path' => 'Security Architect / Consultant'],
            ['name' => 'Saman Kumara', 'email' => 'saman@hotmail.com', 'interest_field' => 'Data Science', 'career_path' => 'Data Analyst / Statistician'],
            ['name' => 'Kavindi Bandara', 'email' => 'kavindi@gmail.com', 'interest_field' => 'Software Engineering', 'career_path' => 'Full Stack Developer'],
            ['name' => 'Thisara Fernando', 'email' => 'thisara@gmail.com', 'interest_field' => 'Cloud Computing', 'career_path' => 'Cloud Solutions Architect'],
            ['name' => 'Chathuri Senanayake', 'email' => 'chathuri@gmail.com', 'interest_field' => 'Robotics', 'career_path' => 'Automation Engineer'],
            ['name' => 'Dimuthu Jayasinghe', 'email' => 'dimuthu@gmail.com', 'interest_field' => 'Networking', 'career_path' => 'Network Administrator'],
            ['name' => 'Roshan Ranasinghe', 'email' => 'roshan@gmail.com', 'interest_field' => 'Artificial Intelligence', 'career_path' => 'AI Researcher'],
            ['name' => 'Sachini Wijesinghe', 'email' => 'sachini@gmail.com', 'interest_field' => 'Cyber Security', 'career_path' => 'Ethical Hacker'],
            ['name' => 'Pradeep Edirisinghe', 'email' => 'pradeep@gmail.com', 'interest_field' => 'Data Science', 'career_path' => 'Data Scientist'],
            ['name' => 'Kasun Dissanayake', 'email' => 'kasun@gmail.com', 'interest_field' => 'Software Engineering', 'career_path' => 'Mobile App Developer'],
            ['name' => 'Nipuni Gunasekara', 'email' => 'nipuni@gmail.com', 'interest_field' => 'Artificial Intelligence', 'career_path' => 'Machine Learning Engineer'],
            ['name' => 'Ruwan Karunaratne', 'email' => 'ruwan@gmail.com', 'interest_field' => 'Robotics', 'career_path' => 'Control Systems Engineer'],
            ['name' => 'Sanduni Liyanage', 'email' => 'sanduni@gmail.com', 'interest_field' => 'Software Engineering', 'career_path' => 'Frontend Developer'],
            ['name' => 'Ishara Madusanka', 'email' => 'ishara@gmail.com', 'interest_field' => 'Cloud Computing', 'career_path' => 'Cloud Engineer'],
            ['name' => 'Mahela Jayawardene', 'email' => 'mahela@gmail.com', 'interest_field' => 'Networking', 'career_path' => 'Network Architect'],
            ['name' => 'Shalini Peiris', 'email' => 'shalini@gmail.com', 'interest_field' => 'Data Science', 'career_path' => 'Business Intelligence Specialist'],
            ['name' => 'Harsha de Silva', 'email' => 'harsha@gmail.com', 'interest_field' => 'Cyber Security', 'career_path' => 'Penetration Tester'],
            ['name' => 'Dilhani Ratnayake', 'email' => 'dilhani@gmail.com', 'interest_field' => 'Artificial Intelligence', 'career_path' => 'NLP Specialist'],
            ['name' => 'Yohan Cabraal', 'email' => 'yohan@gmail.com', 'interest_field' => 'Robotics', 'career_path' => 'Roboticist'],
            ['name' => 'Gayani Alwis', 'email' => 'gayani@gmail.com', 'interest_field' => 'Software Engineering', 'career_path' => 'Software Engineer'],
            ['name' => 'Minura Perera', 'email' => 'minura@gmail.com', 'interest_field' => 'Cyber Security', 'career_path' => 'Incident Responder'],
            ['name' => 'Lakshan Gunawardena', 'email' => 'lakshan@gmail.com', 'interest_field' => 'Data Science', 'career_path' => 'AI Engineer'],
            ['name' => 'Supun Weerasinghe', 'email' => 'supun@gmail.com', 'interest_field' => 'Cloud Computing', 'career_path' => 'DevOps Specialist'],
            ['name' => 'Eranga Karunaratne', 'email' => 'eranga@gmail.com', 'interest_field' => 'Networking', 'career_path' => 'Network Security Engineer']
        ];

        $now = now();
        foreach ($responses as $resp) {
            DB::table('student_surveys')->insert([
                'name' => $resp['name'],
                'email' => $resp['email'],
                'interest_field' => $resp['interest_field'],
                'career_path' => $resp['career_path'],
                'created_at' => $now,
                'updated_at' => $now,
            ]);
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('student_surveys');
    }
};
