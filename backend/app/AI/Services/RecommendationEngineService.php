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
        $evidenceStatus = $analyticsData['kpis']['evidence_status'] ?? 'sufficient';
        
        if ($evidenceStatus === 'insufficient' || $evidenceStatus === 'limited') {
            $studentMin = config('analytics.thresholds.min_student_responses', 10);
            $industryMin = config('analytics.thresholds.min_industry_responses', 5);
            $studentCount = $analyticsData['kpis']['student_count'] ?? 0;
            $industryCount = $analyticsData['kpis']['industry_count'] ?? 0;

            if ($evidenceStatus === 'insufficient') {
                $title = 'No Recommendations Generated';
                $description = "There is currently not enough program-specific survey data (minimum required: {$studentMin} student and {$industryMin} industry responses) to produce reliable AI curriculum recommendations. Please collect more target surveys.";
                $confidenceText = 'Insufficient evidence';
            } else {
                $title = 'Limited Evidence - Recommendations Suppressed';
                $description = "We found some matching data ({$studentCount} student and {$industryCount} industry responses), but it is below the confidence thresholds (requires at least {$studentMin} student and {$industryMin} industry responses) to generate confident curriculum recommendations.";
                $confidenceText = 'Limited evidence';
            }

            return [
                [
                    'id' => 'insufficient_evidence',
                    'course' => 'Curriculum Audit',
                    'type' => 'System Audit',
                    'title' => $title,
                    'description' => $description,
                    'priority' => 'Medium',
                    'evidence_source' => 'AI Evidence Gate',
                    'impact' => 'N/A',
                    'evidence' => [
                        'relevant_responses' => $studentCount + $industryCount,
                        'observed_percentage' => 'N/A',
                        'supporting_domain' => 'None',
                        'threshold' => "{$studentMin} Stud / {$industryMin} Ind",
                        'confidence' => $confidenceText,
                        'trigger' => 'Evidence Gate'
                    ]
                ]
            ];
        }

        $rules = $this->loadRules();
        $recommendations = [];
        
        $industryFrequencies = $analyticsData['domain_frequency_counts']['industry'] ?? [];
        $studentFrequencies = $analyticsData['domain_frequency_counts']['student'] ?? [];
        $totalIndustryDemand = array_sum($industryFrequencies) ?: 1;

        // 1. Process standard static rules (MVP Rules)
        foreach ($rules as $rule) {
            $matchData = $this->evaluateRule($rule, $industryFrequencies, $totalIndustryDemand);
            if ($matchData) {
                $recommendations[] = [
                    'id' => 'rule_' . $rule->id,
                    'course' => $rule->recommendation_subject,
                    'type' => $rule->recommendation_type,
                    'title' => $rule->rule_name,
                    'description' => $rule->recommendation_text,
                    'priority' => $rule->priority,
                    'evidence_source' => $rule->evidence_source,
                    'impact' => '+15% Industry Match',
                    'evidence' => [
                        'relevant_responses' => $matchData['count'],
                        'observed_percentage' => $matchData['percentage'] . '%',
                        'supporting_domain' => $matchData['domain'],
                        'threshold' => $matchData['threshold'] . '%',
                        'confidence' => $analyticsData['kpis']['confidence'] ?? 'High',
                        'trigger' => $matchData['pattern']
                    ]
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
                    'evidence' => [
                        'relevant_responses' => 1,
                        'observed_percentage' => '100%',
                        'supporting_domain' => $subject['name'],
                        'threshold' => 'Legacy Keyword Match',
                        'confidence' => 'High',
                        'trigger' => 'Outdated Tech Detected'
                    ]
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
                    'evidence' => [
                        'relevant_responses' => 0,
                        'observed_percentage' => '<5%',
                        'supporting_domain' => $subject['name'],
                        'threshold' => '5%',
                        'confidence' => $analyticsData['kpis']['confidence'] ?? 'High',
                        'trigger' => 'Low Observed Demand'
                    ]
                ];
            }
        }

        // 4. Generate Missing Subject Recommendations (real curriculum gap analysis)
        if (!empty($analyticsData['missing_subjects'])) {
            foreach ($analyticsData['missing_subjects'] as $idx => $domain) {
                $count = ($industryFrequencies[$domain] ?? 0) + ($studentFrequencies[$domain] ?? 0);
                $totalResponses = ($analyticsData['kpis']['student_count'] ?? 0) + ($analyticsData['kpis']['industry_count'] ?? 0);
                $percentage = $totalResponses > 0 ? round(($count / $totalResponses) * 100, 1) : 0;

                $recommendations[] = [
                    'id' => 'missing_' . $idx,
                    'course' => $domain,
                    'type' => 'New Module',
                    'title' => 'Introduce Core Module: ' . $domain,
                    'description' => 'Student and industry surveys show high demand for ' . $domain . ', but it is completely absent in the current curriculum. We recommend introducing a new dedicated module to teach ' . $domain . ' concepts.',
                    'priority' => 'High',
                    'evidence_source' => 'Survey Gap Analysis',
                    'impact' => '+25% Industry Alignment',
                    'evidence' => [
                        'relevant_responses' => $count,
                        'observed_percentage' => $percentage . '%',
                        'supporting_domain' => $domain,
                        'threshold' => '15%',
                        'confidence' => $analyticsData['kpis']['confidence'] ?? 'High',
                        'trigger' => 'Curriculum Gap'
                    ]
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
                    'evidence' => [
                        'relevant_responses' => $analyticsData['kpis']['student_count'] ?? 0,
                        'observed_percentage' => ($prefData['student_practical_percent'] ?? 0) . '%',
                        'supporting_domain' => 'Pedagogy',
                        'threshold' => '60%',
                        'confidence' => $analyticsData['kpis']['confidence'] ?? 'High',
                        'trigger' => 'Practical/Theory Ratio'
                    ]
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
                    'evidence' => [
                        'relevant_responses' => $analyticsData['kpis']['industry_count'] ?? 0,
                        'observed_percentage' => ($prefData['certification_importance'] ?? 0) . '%',
                        'supporting_domain' => 'Certifications',
                        'threshold' => '60%',
                        'confidence' => $analyticsData['kpis']['confidence'] ?? 'High',
                        'trigger' => 'Industry Certification Value'
                    ]
                ];
            }
        }

        // Add a fallback recommendation if no rules triggered and no gaps found
        if (empty($recommendations)) {
            $recommendations[] = [
                'id' => 'fallback_999',
                'course' => 'System-wide Curriculum',
                'type' => 'Review Completed',
                'title' => 'Curriculum Review Completed',
                'description' => 'No additional gaps or anomalies found based on current matching surveys. The curriculum appears well-aligned with student and industry expectations.',
                'priority' => 'Medium',
                'evidence_source' => 'System Audit',
                'impact' => 'N/A',
                'evidence' => [
                    'relevant_responses' => $totalRelevant,
                    'observed_percentage' => '100%',
                    'supporting_domain' => 'N/A',
                    'threshold' => 'N/A',
                    'confidence' => $analyticsData['kpis']['confidence'] ?? 'High',
                    'trigger' => 'No Anomalies Found'
                ]
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
    protected function evaluateRule(RecommendationRule $rule, array $industryFrequencies, int $totalDemand)
    {
        $triggerPattern = $rule->trigger_skill_pattern;
        
        foreach ($industryFrequencies as $domain => $count) {
            $percentage = ($count / $totalDemand) * 100;
            
            if (preg_match($triggerPattern, $domain)) {
                if ($percentage >= $rule->threshold_percent) {
                    return [
                        'domain' => $domain,
                        'count' => $count,
                        'percentage' => round($percentage, 1),
                        'threshold' => $rule->threshold_percent,
                        'pattern' => $triggerPattern
                    ];
                }
            }
        }

        return null;
    }
}

