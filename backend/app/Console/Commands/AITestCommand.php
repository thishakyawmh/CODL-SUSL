<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\AI\Models\StudentInterest;
use App\AI\Models\IndustryRequirement;
use App\AI\Models\AnalyticsCache;
use App\AI\Services\AnalyticsNLPService;
use App\AI\Services\RecommendationEngineService;

class AITestCommand extends Command
{
    protected $signature = 'ai:test';
    protected $description = 'Runs a full end-to-end simulation of the AI Analytics pipeline';

    public function handle(AnalyticsNLPService $nlpService, RecommendationEngineService $recommendationEngine)
    {
        $this->info('Starting AI Pipeline Simulation...');

        // 1. Clean the database for a fresh test
        StudentInterest::truncate();
        IndustryRequirement::truncate();
        AnalyticsCache::truncate();

        // 2. Inject Mock Survey Data
        $this->info('Injecting mock Google Forms data...');
        StudentInterest::create([
            'education_level' => 'BSc Computer Science',
            'primary_interest' => 'Web Development',
            'primary_skills' => 'React, Node, HTML, CSS, JavaScript',
            'primary_learning_methods' => 'Online Courses, Practical Projects',
            'primary_learning_balance' => 4,
            'university_opportunities' => 'Good',
            'new_program_suggestion' => 'More AI courses please.'
        ]);

        StudentInterest::create([
            'education_level' => 'BSc Information Technology',
            'primary_interest' => 'Cloud Computing',
            'primary_skills' => 'AWS, Azure, Docker, Kubernetes',
            'primary_learning_methods' => 'Practical Projects',
            'primary_learning_balance' => 3,
            'university_opportunities' => 'Average',
            'new_program_suggestion' => 'Cloud infrastructure'
        ]);

        IndustryRequirement::create([
            'company_name' => 'Tech Innovators',
            'industry_sector' => 'Software Development',
            'organization_size' => 'Medium',
            'primary_academic_field' => 'Web Development',
            'required_skills' => 'We strictly require AWS, DevOps, CI/CD, and Artificial Intelligence models.',
            'graduate_skill_gaps' => 'Students lack practical DevOps and Machine Learning knowledge.',
            'new_program_suggestion' => 'AI, Cloud Computing, Cyber Security'
        ]);

        $this->info('Simulating AI Sync Pipeline...');
        
        // 3. Run the NLP Pipeline
        $analytics = $nlpService->processAll();
        
        // 4. Run the Recommendation Engine
        $recommendations = $recommendationEngine->generateRecommendations($analytics);

        // 5. Output the Results
        $this->newLine();
        $this->info('✅ NLP Output (Top Demanded Skills):');
        foreach ($analytics['domain_frequency_counts']['industry'] as $domain => $count) {
            $this->line(" - $domain: $count mentions");
        }

        $this->newLine();
        $this->info('✅ Generated Curriculum Recommendations (Sorted by Priority):');
        foreach ($recommendations as $rec) {
            $color = $rec['priority'] === 'Critical' ? 'error' : ($rec['priority'] === 'High' ? 'comment' : 'info');
            $this->line("<$color>[{$rec['priority']}] {$rec['title']}</$color>");
            $this->line("   Type: {$rec['type']}");
            $this->line("   Action: {$rec['description']}");
            $this->newLine();
        }

        // Clean up mock data so it doesn't pollute the real DB
        StudentInterest::truncate();
        IndustryRequirement::truncate();

        $this->info('Pipeline test completed successfully! Database cleaned up.');
    }
}
