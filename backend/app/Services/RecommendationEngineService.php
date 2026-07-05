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
     * Loads active recommendation rules from the database.
     */
    protected function loadRules()
    {
        return RecommendationRule::where('is_active', true)->get();
    }

    /**
     * Evaluates a single rule against the processed analytics data.
     */
    protected function evaluateRule(RecommendationRule $rule, array $industryFrequencies, int $totalDemand): bool
    {
        // Get the trigger pattern (e.g., 'Cloud Computing' or 'docker|kubernetes')
        $triggerPattern = strtolower($rule->trigger_skill_pattern);
        
        // Check if any of our high-frequency industry domains match this trigger
        foreach ($industryFrequencies as $domain => $count) {
            $percentage = ($count / $totalDemand) * 100;
            
            // Basic matching for MVP (can be upgraded to full regex later)
            if (str_contains(strtolower($domain), $triggerPattern) || str_contains($triggerPattern, strtolower($domain))) {
                if ($percentage >= $rule->threshold_percent) {
                    return true; // The demand exceeds the threshold, trigger the rule
                }
            }
        }

        return false;
    }
}
