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
        Schema::create('industry_surveys', function (Blueprint $table) {
            $table->id();
            $table->string('company_name');
            $table->string('industry_sector');
            $table->text('job_roles'); // JSON array of roles
            $table->text('required_skills'); // JSON array of skills
            $table->string('demand_level'); // High, Medium, Low
            $table->timestamps();
        });

        // Seed default industry data
        $companies = [
            [
                'company_name' => 'Dialog Axiata PLC',
                'industry_sector' => 'Telecommunications',
                'job_roles' => json_encode(['Cloud Engineer', 'Network Security Engineer', 'Systems Analyst']),
                'required_skills' => json_encode(['Cloud Computing', 'Cyber Security', 'Networking', 'Linux']),
                'demand_level' => 'High',
            ],
            [
                'company_name' => 'WSO2 Sri Lanka',
                'industry_sector' => 'Software Development',
                'job_roles' => json_encode(['Senior Software Engineer', 'Solutions Architect', 'DevOps Engineer']),
                'required_skills' => json_encode(['Software Engineering', 'Cloud Computing', 'Programming', 'Databases']),
                'demand_level' => 'High',
            ],
            [
                'company_name' => 'Virtusa Corp',
                'industry_sector' => 'IT Services & Consulting',
                'job_roles' => json_encode(['Data Scientist', 'AI Developer', 'Software Engineer']),
                'required_skills' => json_encode(['Artificial Intelligence', 'Data Science', 'Programming', 'Machine Learning', 'Databases']),
                'demand_level' => 'High',
            ],
            [
                'company_name' => 'Sysco LABS',
                'industry_sector' => 'Technology & Food Services',
                'job_roles' => json_encode(['Software Engineer', 'Quality Assurance Engineer', 'Cloud Architect']),
                'required_skills' => json_encode(['Software Engineering', 'Cloud Computing', 'Databases', 'Programming']),
                'demand_level' => 'High',
            ],
            [
                'company_name' => 'Lanka ORIX Information Technology',
                'industry_sector' => 'Finance & IT',
                'job_roles' => json_encode(['Cyber Security Specialist', 'Database Administrator']),
                'required_skills' => json_encode(['Cyber Security', 'Databases', 'Networking', 'Web Development']),
                'demand_level' => 'Medium',
            ],
            [
                'company_name' => 'CodeGen International',
                'industry_sector' => 'Software & AI Research',
                'job_roles' => json_encode(['Robotics Engineer', 'AI Research Assistant', 'Full Stack Developer']),
                'required_skills' => json_encode(['Robotics', 'Artificial Intelligence', 'Machine Learning', 'Programming', 'Web Development']),
                'demand_level' => 'High',
            ],
            [
                'company_name' => 'John Keells IT',
                'industry_sector' => 'IT Services & Consulting',
                'job_roles' => json_encode(['Cloud Specialist', 'Data Analyst', 'CRM Developer']),
                'required_skills' => json_encode(['Cloud Computing', 'Data Science', 'Databases', 'Web Development']),
                'demand_level' => 'Medium',
            ],
            [
                'company_name' => 'Commercial Bank of Ceylon',
                'industry_sector' => 'Banking & Finance',
                'job_roles' => json_encode(['Information Security Officer', 'Database Administrator', 'Network Engineer']),
                'required_skills' => json_encode(['Cyber Security', 'Databases', 'Networking', 'Linux']),
                'demand_level' => 'High',
            ],
            [
                'company_name' => 'Hayleys PLC',
                'industry_sector' => 'Conglomerate',
                'job_roles' => json_encode(['Systems Administrator', 'IT Support Specialist']),
                'required_skills' => json_encode(['Networking', 'Databases', 'Software Engineering']),
                'demand_level' => 'Low',
            ],
            [
                'company_name' => 'Axiata Digital Labs',
                'industry_sector' => 'Software Development',
                'job_roles' => json_encode(['AI Engineer', 'Data Scientist', 'React Developer']),
                'required_skills' => json_encode(['Artificial Intelligence', 'Data Science', 'Machine Learning', 'Web Development', 'Programming']),
                'demand_level' => 'High',
            ],
            [
                'company_name' => 'MAS Holdings',
                'industry_sector' => 'Apparel & Manufacturing',
                'job_roles' => json_encode(['Automation Engineer', 'Data Analyst']),
                'required_skills' => json_encode(['Robotics', 'Data Science', 'Programming', 'Databases']),
                'demand_level' => 'Medium',
            ],
            [
                'company_name' => 'Fortude',
                'industry_sector' => 'Enterprise Consulting',
                'job_roles' => json_encode(['Cloud Solutions Analyst', 'Business Intelligence Developer']),
                'required_skills' => json_encode(['Cloud Computing', 'Data Science', 'Databases', 'Software Engineering']),
                'demand_level' => 'Medium',
            ]
        ];

        $now = now();
        foreach ($companies as $company) {
            DB::table('industry_surveys')->insert([
                'company_name' => $company['company_name'],
                'industry_sector' => $company['industry_sector'],
                'job_roles' => $company['job_roles'],
                'required_skills' => $company['required_skills'],
                'demand_level' => $company['demand_level'],
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
        Schema::dropIfExists('industry_surveys');
    }
};
