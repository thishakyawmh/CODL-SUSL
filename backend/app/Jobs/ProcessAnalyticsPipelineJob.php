<?php

namespace App\Jobs;

use App\AI\Services\AnalyticsNLPService;
use App\AI\Services\RecommendationEngineService;
use App\AI\Models\AnalyticsCache;
use App\Models\Course;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class ProcessAnalyticsPipelineJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    /**
     * The number of times the job may be attempted.
     *
     * @var int
     */
    public $tries = 3;

    /**
     * The number of seconds the job can run before timing out.
     *
     * @var int
     */
    public $timeout = 300;

    /**
     * Create a new job instance.
     */
    public function __construct()
    {
        //
    }

    /**
     * Execute the job.
     */
    public function handle(AnalyticsNLPService $nlpService, RecommendationEngineService $recommendationEngine): void
    {
        Log::info('Background NLP Pipeline processing started.');
        
        try {
            $nlpService->preClassifySurveys();
            $courses = Course::all();
            foreach ($courses as $course) {
                Log::info("Processing course alignment for: " . $course->title);
                $analytics = $nlpService->processAll($course);
                $recommendations = $recommendationEngine->generateRecommendations($analytics);

                $kpis = $analytics['kpis'] ?? [];
                $kpis['coverage_percent'] = $analytics['coverage_percent'];
                $kpis['missing_subjects'] = $analytics['missing_subjects'] ?? [];
                $kpis['outdated_subjects'] = $analytics['outdated_subjects'] ?? [];
                $kpis['low_demand_subjects'] = $analytics['low_demand_subjects'] ?? [];
                $kpis['learning_preferences_data'] = $analytics['learning_preferences_data'] ?? null;

                // Delete existing caches for this course first to ensure clean regeneration
                AnalyticsCache::where('scope_type', 'program')
                    ->where('scope_id', $course->id)
                    ->delete();

                AnalyticsCache::create([
                    'scope_type' => 'program',
                    'scope_id' => $course->id,
                    'student_demand_distribution' => $analytics['student_demand_distribution'],
                    'industry_demand_distribution' => $analytics['industry_demand_distribution'],
                    'domain_frequency_counts' => $analytics['domain_frequency_counts'],
                    'emerging_technologies' => $analytics['emerging_technologies'] ?? [],
                    'skill_gaps' => $analytics['skill_gaps'] ?? [],
                    'jaccard_similarity_results' => $analytics['jaccard_similarity_results'] ?? [],
                    'kpis' => $kpis,
                    'generated_recommendations' => $recommendations,
                    'academic_entry_requirements' => $analytics['academic_entry_requirements'] ?? null,
                    'generated_at' => now(),
                ]);
            }
            Log::info('Background NLP Pipeline processing completed successfully.');
        } catch (\Exception $e) {
            Log::error('Background NLP Pipeline failed: ' . $e->getMessage());
            throw $e;
        }
    }
}
