<?php

namespace App\AI\Services;

use App\AI\Models\RecommendationRule;

class RecommendationEngineService
{
     
    public function generateRecommendations(array $analyticsData): array
    {
        $evidenceStatus = $analyticsData['kpis']['evidence_status'] ?? 'sufficient';
        $curriculumStatus = $analyticsData['kpis']['curriculum_status'] ?? 'sufficient';

        if ($curriculumStatus === 'insufficient') {
            return [
                [
                    'id' => 'insufficient_curriculum',
                    'course' => 'Curriculum Audit',
                    'type' => 'System Audit',
                    'title' => 'Curriculum Analysis Unavailable',
                    'description' => "This program does not currently have curriculum data available. Add the program's curriculum subjects to enable AI-powered curriculum gap and anomaly recommendations.",
                    'priority' => 'Medium',
                    'evidence_source' => 'AI Curriculum Gate',
                    'impact' => 'N/A',
                    'evidence' => [
                        'relevant_responses' => 0,
                        'observed_percentage' => 'N/A',
                        'supporting_domain' => 'None',
                        'threshold' => '1 subject minimum',
                        'confidence' => 'N/A',
                        'trigger' => 'Curriculum Gate'
                    ]
                ]
            ];
        }
        
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


        if (!empty($analyticsData['curriculum_enhancements'])) {
            foreach ($analyticsData['curriculum_enhancements'] as $idx => $anomaly) {
                $affected = $anomaly['affected_subject'];
                $parts = explode(':', $affected, 2);
                $code = trim($parts[0]);
                $name = trim($parts[1] ?? $affected);
                
                $priority = 'Medium';
                $recType = 'Syllabus Review';
                if ($anomaly['anomaly_type'] === 'Curriculum Modernization') {
                    $priority = 'Critical';
                    $recType = 'Curriculum Revision';
                } elseif ($anomaly['anomaly_type'] === 'Skill Coverage Gap') {
                    $priority = 'High';
                    $recType = 'Syllabus Enrichment';
                }

                $recommendations[] = [
                    'id' => 'anomaly_' . $idx,
                    'course' => $code,
                    'type' => $recType,
                    'title' => $anomaly['anomaly_type'] . ': ' . $name,
                    'description' => $anomaly['explanation'],
                    'priority' => $priority,
                    'evidence_source' => 'Curriculum Audit',
                    'impact' => $anomaly['anomaly_type'] === 'Curriculum Modernization' ? 'Outdated Code Removal' : 'Relevance Optimization',
                    'evidence' => [
                        'relevant_responses' => $anomaly['combined_evidence'] . '% combined demand',
                        'observed_percentage' => $anomaly['combined_evidence'] . '%',
                        'supporting_domain' => $name,
                        'threshold' => '5%',
                        'confidence' => $anomaly['confidence'],
                        'trigger' => $anomaly['anomaly_type']
                    ]
                ];
            }
        }


        if (!empty($analyticsData['missing_subjects'])) {
            foreach ($analyticsData['missing_subjects'] as $idx => $subject) {
                $classification = $subject['classification'] ?? 'Core Curriculum Gap';
                

                if ($classification === 'Emerging / Industry Technology Trend' || $classification === 'Already Covered') {
                    continue;
                }

                $domainName = $subject['name'];
                $percentage = $subject['combined_pct'];
                $count = $subject['count'];
                $priority = ($classification === 'Core Curriculum Gap') ? 'High' : 'Medium';
                $recType = ($classification === 'Core Curriculum Gap') ? 'New Module' : 'Module Expansion';

                $recommendations[] = [
                    'id' => 'missing_' . $idx,
                    'course' => $domainName,
                    'type' => $recType,
                    'title' => 'Introduce Core Module: ' . $domainName,
                    'description' => $subject['explanation'] . ' Supporting skills requested: ' . implode(', ', $subject['skills']) . '.',
                    'priority' => $priority,
                    'evidence_source' => 'Survey Gap Analysis',
                    'impact' => '+25% Industry Alignment',
                    'evidence' => [
                        'relevant_responses' => $count,
                        'observed_percentage' => $percentage . '%',
                        'supporting_domain' => $domainName,
                        'threshold' => '5% combined',
                        'confidence' => $subject['confidence'],
                        'trigger' => 'Curriculum Gap'
                    ]
                ];
            }
        }


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
                    'relevant_responses' => $analyticsData['kpis']['surveys'] ?? 0,
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

     
    protected function loadRules()
    {
        $rules = RecommendationRule::where('is_active', true)->get();
        
        $priorityMap = [
            'Critical' => 4,
            'High' => 3,
            'Medium' => 2,
            'Low' => 1
        ];


        return $rules->sortByDesc(function ($rule) use ($priorityMap) {
            return $priorityMap[$rule->priority] ?? 0;
        })->values();
    }

     
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

