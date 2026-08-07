<?php

namespace App\AI\Services;

use App\AI\Models\RecommendationRule;

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
        $totalIndustryDemand = array_sum($industryFrequencies) ?: 1;

        // 1. Process standard static rules (MVP Rules)
        foreach ($rules as $rule) {
            $isTriggered = $this->evaluateRule($rule, $industryFrequencies, $totalIndustryDemand);
            if ($isTriggered) {
                $recommendations[] = [
                    'id' => 'rule_' . $rule->id,
                    'course' => $rule->recommendation_subject,
                    'type' => $rule->recommendation_type,
                    'title' => $rule->rule_name,
                    'description' => $rule->recommendation_text,
                    'priority' => $rule->priority,
                    'evidence_source' => $rule->evidence_source,
                    'impact' => '+15% Industry Match',
                ];
            }
        }

        // 2. Generate Outdated Subject Warnings (from real curriculum)
        if (!empty($analyticsData['outdated_subjects'])) {
            foreach ($analyticsData['outdated_subjects'] as $idx => $subject) {
                $recommendations[] = [
                    'id' => 'outdated_' . $idx,
                    'course' => $subject['code'],
                    'type' => 'Curriculum Revision',
                    'title' => 'Deprecate / Revise Legacy Subject: ' . $subject['name'],
                    'description' => 'This subject teaches legacy technologies (' . $subject['reason'] . '). We recommend deprecating it and replacing the syllabus with modern equivalent libraries and tools.',
                    'priority' => 'Critical',
                    'evidence_source' => 'Course Management',
                    'impact' => 'Outdated Code Removal',
                ];
            }
        }

        // 3. Generate Low-Demand Subject Alerts (from real curriculum & survey intersect)
        if (!empty($analyticsData['low_demand_subjects'])) {
            foreach ($analyticsData['low_demand_subjects'] as $idx => $subject) {
                $recommendations[] = [
                    'id' => 'lowdemand_' . $idx,
                    'course' => $subject['code'],
                    'type' => 'Syllabus Review',
                    'title' => 'Review Low-Demand Subject: ' . $subject['name'],
                    'description' => 'This subject has very low demand (<5%) in both student and industry surveys. Consider converting it into an elective or merging it with related modules.',
                    'priority' => 'Medium',
                    'evidence_source' => 'Surveys & Curriculum',
                    'impact' => 'Syllabus Optimization',
                ];
            }
        }

        // 4. Generate Missing Subject Recommendations (real curriculum gap analysis)
        if (!empty($analyticsData['missing_subjects'])) {
            foreach ($analyticsData['missing_subjects'] as $idx => $domain) {
                $recommendations[] = [
                    'id' => 'missing_' . $idx,
                    'course' => $domain,
                    'type' => 'New Module',
                    'title' => 'Introduce Core Module: ' . $domain,
                    'description' => 'Student and industry surveys show high demand for ' . $domain . ', but it is completely absent in the current curriculum. We recommend introducing a new dedicated module to teach ' . $domain . ' concepts.',
                    'priority' => 'High',
                    'evidence_source' => 'Survey Gap Analysis',
                    'impact' => '+25% Industry Alignment',
                ];
            }
        }

        // 5. Generate learning preferences and teaching method suggestions
        if (!empty($analyticsData['learning_preferences_data'])) {
            $prefData = $analyticsData['learning_preferences_data'];
            
            if (($prefData['student_practical_percent'] ?? 0) >= 60) {
                $recommendations[] = [
                    'id' => 'pref_practical',
                    'course' => 'Pedagogy / Delivery',
                    'type' => 'Teaching Delivery',
                    'title' => 'Increase Practical Learning Delivery',
                    'description' => 'Students express a strong preference for practical learning (' . $prefData['student_practical_percent'] . '% practical preference). Realign assessments to include more hands-on labs and project-based assignments.',
                    'priority' => 'High',
                    'evidence_source' => 'Student Learning Preferences',
                    'impact' => 'Higher Student Satisfaction',
                ];
            }

            if (($prefData['certification_importance'] ?? 0) >= 60) {
                $recommendations[] = [
                    'id' => 'pref_cert',
                    'course' => 'Pedagogy / Industry',
                    'type' => 'Industry Collaboration',
                    'title' => 'Integrate Professional Certifications',
                    'description' => 'Industry feedback indicates high value on professional certifications (' . $prefData['certification_importance'] . '% importance). Consider partnering with certified vendors to embed certifications within the curriculum.',
                    'priority' => 'Medium',
                    'evidence_source' => 'Industry Gaps Audit',
                    'impact' => 'Employability Boost',
                ];
            }
        }

        // Add a fallback recommendation if no rules triggered and no gaps found
        if (empty($recommendations)) {
            $recommendations[] = [
                'id' => 'fallback_999',
                'course' => 'System-wide Curriculum',
                'type' => 'Review Completed',
                'title' => 'Curriculum Review',
                'description' => 'Gather more survey data or add more semesters/subjects in Course Management to run the AI gap analysis engine.',
                'priority' => 'Medium',
                'evidence_source' => 'System Audit',
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
