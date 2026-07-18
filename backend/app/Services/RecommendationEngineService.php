<?php

namespace App\Services;

use App\Models\RecommendationRule;

class RecommendationEngineService
{
    /**
     * Consumes the processed analytics data from the NLP service
     * and generates actionable curriculum recommendations.
     */
    public function generateRecommendations(array $analyticsData): array
    {
        $rules = $this->loadRules();
        $recommendations = [];
        
        $industryFrequencies = $analyticsData['domain_frequency_counts']['industry'] ?? [];
        $studentFrequencies = $analyticsData['domain_frequency_counts']['student'] ?? [];

        // For MVP, we evaluate rules based on domain frequency percentages.
        // A full implementation might do regex matching on specific course titles.
        $totalIndustryDemand = array_sum($industryFrequencies) ?: 1;

        foreach ($rules as $rule) {
            $isTriggered = $this->evaluateRule($rule, $industryFrequencies, $totalIndustryDemand);
            
            if ($isTriggered) {
                $recommendations[] = [
                    'id' => $rule->id,
                    'course' => $rule->recommendation_subject,
                    'type' => $rule->recommendation_type,
                    'title' => $rule->rule_name,
                    'description' => $rule->recommendation_text,
                    'impact' => '+15% Industry Match', // Simulated impact metric
                ];
            }
        }

        // Add a fallback recommendation if no rules triggered
        if (empty($recommendations)) {
            $recommendations[] = [
                'id' => 999,
                'course' => 'System-wide Curriculum',
                'type' => 'Review Needed',
                'title' => 'Curriculum Review',
                'description' => 'Gather more survey data to trigger specific actionable AI recommendations.',
                'impact' => 'N/A',
            ];
        }

        return $recommendations;
    }

    /**
     * Loads active recommendation rules from the database and sorts them by priority.
     */
    protected function loadRules()
    {
        $rules = RecommendationRule::where('is_active', true)->get();
        
        $priorityMap = [
            'Critical' => 4,
            'High' => 3,
            'Medium' => 2,
            'Low' => 1
        ];

        // Sort rules so highest priority triggers first
        return $rules->sortByDesc(function ($rule) use ($priorityMap) {
            return $priorityMap[$rule->priority] ?? 0;
        })->values();
    }

    /**
     * Evaluates a single rule against the processed analytics data (normalized domains).
     */
    protected function evaluateRule(RecommendationRule $rule, array $industryFrequencies, int $totalDemand): bool
    {
        $triggerPattern = $rule->trigger_skill_pattern;
        
        foreach ($industryFrequencies as $domain => $count) {
            $percentage = ($count / $totalDemand) * 100;
            
            // Execute the exact regex string stored in the database against the normalized domain
            if (preg_match($triggerPattern, $domain)) {
                if ($percentage >= $rule->threshold_percent) {
                    return true;
                }
            }
        }

        return false;
    }
}
