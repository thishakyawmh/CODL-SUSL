<?php

namespace App\AI\Services;

use App\AI\Models\StudentInterest;
use App\AI\Models\IndustryRequirement;

class AnalyticsNLPService
{
    protected $synonyms;

    public function __construct()
    {
        // Load the synonym dictionary from config/analytics.php
        $this->synonyms = config('analytics.synonyms', []);
    }

    /**
     * Master method to process survey data for a specific course/program scope.
     * Uses multi-signal semantic matching to find relevant surveys.
     */
    public function processAll(\App\Models\Course $course = null): array
    {
        $studentSurveys = StudentInterest::all();
        $industrySurveys = IndustryRequirement::all();

        $studentDomains = [];
        $industryDomains = [];
        $emergingTechnologies = [];
        $skillGapsList = [];

        // Learning preferences containers
        $theoryPracticalScores = [];
        $learningPreferences = [];
        $academicPractices = [];
        $certImportances = [];

        // Helper to convert balance input (text or number) to a 1-5 score
        $parseBalance = function ($balance) {
            if (is_numeric($balance)) {
                return (float) $balance;
            }
            $b = strtolower(trim($balance));
            if (empty($b)) return 3.0;
            if (str_contains($b, 'balanced')) return 3.0;
            if (str_contains($b, 'practical oriented') || str_contains($b, 'mostly practical')) return 4.0;
            if (str_contains($b, 'theory oriented') || str_contains($b, 'mostly theory')) return 2.0;
            if (str_contains($b, 'practical')) return 5.0;
            if (str_contains($b, 'theory')) return 1.0;
            return 3.0;
        };

        // Load config thresholds & weights
        $minStudentThreshold = config('analytics.thresholds.min_student_responses', 10);
        $minIndustryThreshold = config('analytics.thresholds.min_industry_responses', 5);
        $minRelevanceScore = config('analytics.thresholds.min_relevance_score', 0.65);
        $weightInterest = config('analytics.weights.interest_match', 0.7);
        $weightKeyword = config('analytics.weights.keyword_similarity', 0.3);

        $evidenceStatus = 'sufficient';
        $confidence = 'High';
        $studentCount = 0;
        $industryCount = 0;
        $totalRelevant = 0;

        $relevantStudentSurveys = [];
        $relevantIndustrySurveys = [];

        if ($course) {
            // Build Program Profile
            $course->loadMissing('semesters.subjects', 'category');
            
            $profileParts = [];
            $profileParts[] = $course->title;
            $profileParts[] = $course->level;
            $profileParts[] = $course->department;
            if ($course->category) {
                $profileParts[] = $course->category->name;
            }
            foreach ($course->semesters as $semester) {
                foreach ($semester->subjects as $subject) {
                    $profileParts[] = $subject->name;
                    $profileParts[] = $subject->code;
                }
            }
            $profileText = implode(' ', $profileParts);
            
            $profileTokens = $this->removeStopWords($this->tokenize($this->normalizeText($profileText)));
            $profileDomains = array_unique($this->extractDomains($profileText));
            $courseFields = $this->classifyCourseFields($course);

            // 1. Filter Student Surveys
            foreach ($studentSurveys as $survey) {
                $interestScore = 0.0;
                if (in_array($survey->primary_interest, $courseFields)) {
                    $interestScore = 1.0;
                } elseif (in_array($survey->secondary_interest, $courseFields)) {
                    $interestScore = 0.6;
                } elseif (in_array($survey->ternary_interest, $courseFields)) {
                    $interestScore = 0.3;
                }

                $surveyText = implode(' ', array_filter([
                    $survey->primary_skills,
                    $survey->secondary_skills,
                    $survey->ternary_skills,
                    $survey->new_program_suggestion
                ]));
                $surveyTokens = $this->removeStopWords($this->tokenize($this->normalizeText($surveyText)));
                
                $surveyDomains = array_unique($this->extractDomains($surveyText));
                $domainOverlap = array_intersect($profileDomains, $surveyDomains);
                $tokenOverlap = array_intersect($profileTokens, $surveyTokens);
                
                $similarityScore = 0.0;
                if (count($surveyDomains) > 0) {
                    $similarityScore = count($domainOverlap) > 0 ? 1.0 : 0.0;
                } elseif (count($surveyTokens) > 0) {
                    $similarityScore = count($tokenOverlap) > 0 ? 0.5 : 0.0;
                }

                $relevanceScore = ($interestScore * $weightInterest) + ($similarityScore * $weightKeyword);

                if ($relevanceScore >= $minRelevanceScore) {
                    $relevantStudentSurveys[] = [
                        'survey' => $survey,
                        'relevance_score' => $relevanceScore,
                        'interest_score' => $interestScore,
                        'similarity_score' => $similarityScore,
                        'matched_domains' => array_values($domainOverlap),
                        'matched_keywords' => array_values(array_slice($tokenOverlap, 0, 5)),
                    ];
                }
            }

            // 2. Filter Industry Surveys
            foreach ($industrySurveys as $survey) {
                $interestScore = 0.0;
                if (in_array($survey->primary_academic_field, $courseFields)) {
                    $interestScore = 1.0;
                } elseif (in_array($survey->secondary_academic_field, $courseFields)) {
                    $interestScore = 0.6;
                } elseif (in_array($survey->third_academic_field, $courseFields)) {
                    $interestScore = 0.3;
                }

                $surveyText = implode(' ', array_filter([
                    $survey->required_skills,
                    $survey->emerging_fields,
                    $survey->new_program_suggestion,
                    $survey->graduate_skill_gaps,
                ]));
                $surveyTokens = $this->removeStopWords($this->tokenize($this->normalizeText($surveyText)));
                
                $surveyDomains = array_unique($this->extractDomains($surveyText));
                $domainOverlap = array_intersect($profileDomains, $surveyDomains);
                $tokenOverlap = array_intersect($profileTokens, $surveyTokens);
                
                $similarityScore = 0.0;
                if (count($surveyDomains) > 0) {
                    $similarityScore = count($domainOverlap) > 0 ? 1.0 : 0.0;
                } elseif (count($surveyTokens) > 0) {
                    $similarityScore = count($tokenOverlap) > 0 ? 0.5 : 0.0;
                }

                $relevanceScore = ($interestScore * $weightInterest) + ($similarityScore * $weightKeyword);

                if ($relevanceScore >= $minRelevanceScore) {
                    $relevantIndustrySurveys[] = [
                        'survey' => $survey,
                        'relevance_score' => $relevanceScore,
                        'interest_score' => $interestScore,
                        'similarity_score' => $similarityScore,
                        'matched_domains' => array_values($domainOverlap),
                        'matched_keywords' => array_values(array_slice($tokenOverlap, 0, 5)),
                    ];
                }
            }

            $studentCount = count($relevantStudentSurveys);
            $industryCount = count($relevantIndustrySurveys);
            $totalRelevant = $studentCount + $industryCount;

            // Calculate confidence & evidence status
            if ($totalRelevant === 0) {
                $evidenceStatus = 'insufficient';
                $confidence = 'Insufficient evidence';
            } elseif ($studentCount < $minStudentThreshold || $industryCount < $minIndustryThreshold) {
                $evidenceStatus = 'limited';
                $confidence = 'Medium';
            } else {
                $evidenceStatus = 'sufficient';
                $confidence = 'High';
            }

            // If evidence is insufficient, bypass normal analysis and return empty KPIs
            if ($evidenceStatus === 'insufficient') {
                return [
                    'student_demand_distribution' => [['name' => 'Insufficient data', 'value' => 0]],
                    'industry_demand_distribution' => [['name' => 'Insufficient data', 'value' => 0]],
                    'domain_frequency_counts' => [
                        'student' => [],
                        'industry' => [],
                    ],
                    'emerging_technologies' => [],
                    'skill_gaps' => [],
                    'jaccard_similarity_results' => [
                        'intersection' => [],
                        'union' => [],
                        'overall_score' => null
                    ],
                    
                    'coverage_percent' => null,
                    'missing_subjects' => [],
                    'outdated_subjects' => [],
                    'low_demand_subjects' => [],
                    
                    'learning_preferences_data' => [
                        'student_theory_percent' => null,
                        'student_practical_percent' => null,
                        'student_methods' => [],
                        'industry_practices' => [],
                        'certification_importance' => null
                    ],

                    'kpis' => [
                        'studentMatch' => null,
                        'industryMatch' => null,
                        'alignment' => null,
                        'surveys' => 0,
                        'companies' => 0,
                        'courses' => \App\Models\Course::count(),
                        'evidence_status' => $evidenceStatus,
                        'confidence' => $confidence,
                        'student_count' => 0,
                        'industry_count' => 0,
                    ],
                    'explainability' => [
                        'student_surveys' => [],
                        'industry_surveys' => [],
                    ]
                ];
            }

            // 3. Process Relevant Student Surveys
            foreach ($relevantStudentSurveys as $item) {
                $survey = $item['survey'];
                $weight = $item['interest_score'];
                if ($weight <= 0.0) $weight = 0.3;

                $skills = $survey->primary_skills;
                $methods = $survey->primary_learning_methods;
                $balance = $survey->primary_learning_balance;

                if (in_array($survey->secondary_interest, $courseFields) && !in_array($survey->primary_interest, $courseFields)) {
                    $skills = $survey->secondary_skills;
                    $methods = $survey->secondary_learning_methods;
                    $balance = $survey->secondary_learning_balance;
                } elseif (in_array($survey->ternary_interest, $courseFields) && !in_array($survey->primary_interest, $courseFields) && !in_array($survey->secondary_interest, $courseFields)) {
                    $skills = $survey->ternary_skills;
                    $methods = $survey->ternary_learning_methods;
                    $balance = $survey->ternary_learning_balance;
                }

                $domains = $this->extractDomains($skills);
                $domains = $this->deduplicateDomains($domains);

                $relevanceCount = (int) round($weight * 10);
                for ($i = 0; $i < $relevanceCount; $i++) {
                    $studentDomains = array_merge($studentDomains, $domains);
                }

                if ($survey->new_program_suggestion) {
                    for ($i = 0; $i < $relevanceCount; $i++) {
                        $emergingTechnologies[] = $survey->new_program_suggestion;
                    }
                }

                if ($balance) {
                    $score = $parseBalance($balance);
                    for ($i = 0; $i < $relevanceCount; $i++) {
                        $theoryPracticalScores[] = $score;
                    }
                }

                if ($methods) {
                    $prefs = array_map('trim', explode(',', $methods));
                    for ($i = 0; $i < $relevanceCount; $i++) {
                        foreach ($prefs as $p) {
                            if ($p) $learningPreferences[] = $p;
                        }
                    }
                }
            }

            // 4. Process Relevant Industry Surveys
            foreach ($relevantIndustrySurveys as $item) {
                $survey = $item['survey'];
                $weight = $item['interest_score'];
                if ($weight <= 0.0) $weight = 0.3;

                $domains = $this->extractDomains($survey->required_skills);
                $domains = $this->deduplicateDomains($domains);

                $relevanceCount = (int) round($weight * 10);
                for ($i = 0; $i < $relevanceCount; $i++) {
                    $industryDomains = array_merge($industryDomains, $domains);
                }

                if ($survey->emerging_fields) {
                    for ($i = 0; $i < $relevanceCount; $i++) {
                        $emergingTechnologies[] = $survey->emerging_fields;
                    }
                }

                if ($survey->graduate_skill_gaps) {
                    $gaps = $this->extractDomains($survey->graduate_skill_gaps);
                    for ($i = 0; $i < $relevanceCount; $i++) {
                        $skillGapsList = array_merge($skillGapsList, $gaps);
                    }
                }

                if ($survey->academic_practices) {
                    $practices = array_map('trim', explode(',', $survey->academic_practices));
                    for ($i = 0; $i < $relevanceCount; $i++) {
                        foreach ($practices as $p) {
                            if ($p) $academicPractices[] = $p;
                        }
                    }
                }

                if (isset($survey->certification_importance)) {
                    for ($i = 0; $i < $relevanceCount; $i++) {
                        $certImportances[] = $survey->certification_importance;
                    }
                }
            }

        } else {
            // Global scope fallback
            foreach ($studentSurveys as $survey) {
                $text = implode(' ', [$survey->primary_interest, $survey->primary_skills, $survey->secondary_interest, $survey->secondary_skills, $survey->ternary_interest, $survey->ternary_skills]);
                $domains = $this->extractDomains($text);
                $studentDomains = array_merge($studentDomains, $domains);
                
                if ($survey->new_program_suggestion) {
                    $emergingTechnologies[] = $survey->new_program_suggestion;
                }

                if ($survey->primary_learning_balance) {
                    $theoryPracticalScores[] = $parseBalance($survey->primary_learning_balance);
                }

                $prefsText = implode(',', array_filter([$survey->primary_learning_methods, $survey->secondary_learning_methods, $survey->ternary_learning_methods]));
                if ($prefsText) {
                    $prefs = array_map('trim', explode(',', $prefsText));
                    foreach ($prefs as $p) {
                        if ($p) $learningPreferences[] = $p;
                    }
                }
            }

            foreach ($industrySurveys as $survey) {
                $text = $survey->required_skills . ' ' . $survey->graduate_skill_gaps . ' ' . $survey->emerging_fields;
                $domains = $this->extractDomains($text);
                $industryDomains = array_merge($industryDomains, $domains);

                if ($survey->emerging_fields) {
                    $emergingTechnologies[] = $survey->emerging_fields;
                }
                if ($survey->graduate_skill_gaps) {
                    $skillGapsList = array_merge($skillGapsList, $this->extractDomains($survey->graduate_skill_gaps));
                }
                if ($survey->academic_practices) {
                    $practices = array_map('trim', explode(',', $survey->academic_practices));
                    foreach ($practices as $p) {
                        if ($p) $academicPractices[] = $p;
                    }
                }
                if (isset($survey->certification_importance)) {
                    $certImportances[] = $survey->certification_importance;
                }
            }
        }

        // 3. Count Frequencies
        $studentFrequencies = $this->countFrequency($studentDomains);
        $industryFrequencies = $this->countFrequency($industryDomains);

        // 4. Calculate Jaccard Similarity (Overall match between supply and demand)
        $jaccardResults = $this->calculateJaccardSimilarity($studentFrequencies, $industryFrequencies);

        // 5. Structure distributions for the dashboard pie charts
        $studentDistribution = $this->formatDistribution($studentFrequencies);
        $industryDistribution = $this->formatDistribution($industryFrequencies);

        // 6. Format emerging technologies and skill gaps
        $emergingTechnologiesCounts = array_count_values($emergingTechnologies);
        arsort($emergingTechnologiesCounts);
        
        $skillGapsCounts = array_count_values($skillGapsList);
        arsort($skillGapsCounts);

        // 7. Process Learning Preferences Aggregates
        $avgTheoryPractical = count($theoryPracticalScores) > 0 ? array_sum($theoryPracticalScores) / count($theoryPracticalScores) : 3.0;
        $studentPracticalPercent = round(($avgTheoryPractical / 5) * 100);
        $studentTheoryPercent = 100 - $studentPracticalPercent;

        $studentPrefsCounts = array_count_values($learningPreferences);
        arsort($studentPrefsCounts);
        $studentPrefsFormatted = [];
        $totalPrefs = array_sum($studentPrefsCounts) ?: 1;
        foreach (array_slice($studentPrefsCounts, 0, 5) as $name => $count) {
            $studentPrefsFormatted[] = ['name' => $name, 'value' => round(($count / $totalPrefs) * 100)];
        }

        $industryPracticesCounts = array_count_values($academicPractices);
        arsort($industryPracticesCounts);
        $industryPracticesFormatted = [];
        $totalPractices = array_sum($industryPracticesCounts) ?: 1;
        foreach (array_slice($industryPracticesCounts, 0, 5) as $name => $count) {
            $industryPracticesFormatted[] = ['name' => $name, 'value' => round(($count / $totalPractices) * 100)];
        }

        $avgCertImportance = count($certImportances) > 0 ? array_sum($certImportances) / count($certImportances) : 3.0;
        $certImportancePercent = round(($avgCertImportance / 5) * 100);

        // 8. Dynamic Curriculum Coverage & Gaps Analysis
        $curriculumDomains = [];
        $curriculumSubjects = [];
        $coveragePercent = 0;
        $missingSubjects = [];
        $outdatedSubjects = [];
        $lowDemandSubjects = [];

        if ($course) {
            $course->loadMissing('semesters.subjects');
            foreach ($course->semesters as $semester) {
                foreach ($semester->subjects as $subject) {
                    $curriculumSubjects[] = [
                        'id' => $subject->id,
                        'code' => $subject->code,
                        'name' => $subject->name,
                        'credits' => $subject->credits
                    ];
                    $subjectDomains = $this->extractDomains($subject->name);
                    $curriculumDomains = array_merge($curriculumDomains, $subjectDomains);
                }
            }
            $curriculumDomains = $this->deduplicateDomains($curriculumDomains);

            // Calculate Jaccard / Coverage against survey domains
            $targetDomains = array_unique(array_merge(array_keys($studentFrequencies), array_keys($industryFrequencies)));
            if (count($targetDomains) > 0) {
                $coveredDomains = array_intersect($curriculumDomains, $targetDomains);
                $coveragePercent = round((count($coveredDomains) / count($targetDomains)) * 100);
            } else {
                $coveragePercent = count($curriculumSubjects) > 0 ? 100 : 0;
            }

            // Identify Missing Subjects: High-demand domains not present in the curriculum
            $totalResponses = $studentCount + $industryCount;
            $highDemandDomains = [];
            foreach ($studentFrequencies as $domain => $count) {
                if ($totalResponses > 0 && ($count / $totalResponses) >= 0.15) {
                    $highDemandDomains[] = $domain;
                }
            }
            foreach ($industryFrequencies as $domain => $count) {
                if ($totalResponses > 0 && ($count / $totalResponses) >= 0.15) {
                    $highDemandDomains[] = $domain;
                }
            }
            $highDemandDomains = array_unique($highDemandDomains);
            $missingSubjects = array_values(array_diff($highDemandDomains, $curriculumDomains));

            // Identify Outdated Subjects (Legacy Tech) & Low-Demand Subjects
            $legacyKeywords = ['visual basic', 'flash', 'silverlight', 'cobol', 'dreamweaver', 'pascal', 'fortran'];
            foreach ($curriculumSubjects as $subject) {
                $subLower = strtolower($subject['name']);
                $isLegacy = false;
                foreach ($legacyKeywords as $kw) {
                    if (str_contains($subLower, $kw)) {
                        $isLegacy = true;
                        break;
                    }
                }

                $subDomains = $this->extractDomains($subject['name']);
                $isLowDemand = false;
                if (!empty($subDomains)) {
                    $combinedDemand = 0;
                    foreach ($subDomains as $sd) {
                        $combinedDemand += ($studentFrequencies[$sd] ?? 0) + ($industryFrequencies[$sd] ?? 0);
                    }
                    if ($totalResponses > 0 && ($combinedDemand / $totalResponses) < 0.05) {
                        $isLowDemand = true;
                    }
                }

                if ($isLegacy) {
                    $outdatedSubjects[] = [
                        'code' => $subject['code'],
                        'name' => $subject['name'],
                        'reason' => 'Legacy technology detected.'
                    ];
                } elseif ($isLowDemand && count($curriculumSubjects) > 3) {
                    $lowDemandSubjects[] = [
                        'code' => $subject['code'],
                        'name' => $subject['name'],
                        'reason' => 'Low survey interest (<5%).'
                    ];
                }
            }
        }

        if ($course && ($evidenceStatus === 'insufficient' || $evidenceStatus === 'limited')) {
            $coveragePercent = null;
            $jaccardResults['overall_score'] = null;
        }

        return [
            'student_demand_distribution' => $studentDistribution,
            'industry_demand_distribution' => $industryDistribution,
            'domain_frequency_counts' => [
                'student' => $studentFrequencies,
                'industry' => $industryFrequencies,
            ],
            'emerging_technologies' => array_keys(array_slice($emergingTechnologiesCounts, 0, 10)),
            'skill_gaps' => array_keys(array_slice($skillGapsCounts, 0, 5)),
            'jaccard_similarity_results' => $jaccardResults,
            
            // Newly introduced dynamic curriculum metrics
            'coverage_percent' => $coveragePercent,
            'missing_subjects' => $missingSubjects,
            'outdated_subjects' => $outdatedSubjects,
            'low_demand_subjects' => $lowDemandSubjects,
            
            // Teaching & learning preferences metrics
            'learning_preferences_data' => [
                'student_theory_percent' => $studentTheoryPercent,
                'student_practical_percent' => $studentPracticalPercent,
                'student_methods' => $studentPrefsFormatted,
                'industry_practices' => $industryPracticesFormatted,
                'certification_importance' => $certImportancePercent
            ],

            'kpis' => [
                'studentMatch' => $jaccardResults['overall_score'] ?? 0,
                'industryMatch' => $jaccardResults['overall_score'] ?? 0,
                'alignment' => $coveragePercent,
                'surveys' => $totalRelevant,
                'companies' => count($relevantIndustrySurveys) > 0 ? count(array_unique(array_column(array_column($relevantIndustrySurveys, 'survey'), 'company_name'))) : 0,
                'courses' => \App\Models\Course::count(),
                'evidence_status' => $evidenceStatus,
                'confidence' => $confidence,
                'student_count' => $studentCount,
                'industry_count' => $industryCount,
            ],
            'explainability' => [
                'student_surveys' => array_map(function($s) {
                    unset($s['survey']);
                    return $s;
                }, $relevantStudentSurveys),
                'industry_surveys' => array_map(function($s) {
                    unset($s['survey']);
                    return $s;
                }, $relevantIndustrySurveys),
            ]
        ];
    }

    /**
     * Normalizes text by lowercasing and removing punctuation.
     */
    public function normalizeText(string $text): string
    {
        $text = strtolower($text);
        // Remove everything except letters, numbers, and spaces
        $text = preg_replace('/[^a-z0-9\s]/', ' ', $text);
        // Replace multiple spaces with a single space
        return preg_replace('/\s+/', ' ', $text);
    }

    /**
     * Tokenizes text into an array of words.
     */
    protected function tokenize(string $text): array
    {
        return array_filter(explode(' ', $text));
    }

    /**
     * Removes common stop words from tokens.
     */
    protected function removeStopWords(array $tokens): array
    {
        $stopWords = ['and', 'the', 'want', 'learn', 'should', 'with', 'would', 'also', 'about', 'to', 'in', 'of', 'for', 'a', 'an'];
        return array_diff($tokens, $stopWords);
    }

    /**
     * Maps normalized text to standard domains using the synonym dictionary.
     */
    public function extractDomains(string $text): array
    {
        if (empty(trim($text))) {
            return [];
        }

        $normalized = $this->normalizeText($text);
        
        $matchedDomains = [];

        foreach ($this->synonyms as $domain => $keywords) {
            foreach ($keywords as $keyword) {
                // If the keyword appears in the normalized text
                if (str_contains($normalized, strtolower($keyword))) {
                    $matchedDomains[] = $domain;
                }
            }
        }

        return $matchedDomains;
    }

    /**
     * Deduplicates domains to prevent one survey from skewing the frequency.
     */
    protected function deduplicateDomains(array $domains): array
    {
        return array_values(array_unique($domains));
    }

    /**
     * Counts the frequency of each domain.
     */
    protected function countFrequency(array $domains): array
    {
        $frequencies = array_count_values($domains);
        arsort($frequencies);
        return $frequencies;
    }

    /**
     * Calculates the Jaccard similarity between two frequency distributions.
     */
    protected function calculateJaccardSimilarity(array $setA, array $setB): array
    {
        $keysA = array_keys($setA);
        $keysB = array_keys($setB);

        $intersection = array_intersect($keysA, $keysB);
        $union = array_unique(array_merge($keysA, $keysB));

        $score = count($union) > 0 ? (count($intersection) / count($union)) * 100 : 0;

        return [
            'intersection' => array_values($intersection),
            'union' => array_values($union),
            'overall_score' => round($score)
        ];
    }

    /**
     * Formats frequency array into standard charting format.
     */
    protected function formatDistribution(array $frequencies): array
    {
        $total = array_sum($frequencies) ?: 1;
        $distribution = [];
        
        // Take top 5 for charts
        $topFrequencies = array_slice($frequencies, 0, 5, true);
        
        foreach ($topFrequencies as $name => $count) {
            $distribution[] = [
                'name' => $name,
                'value' => round(($count / $total) * 100)
            ];
        }

        if (empty($distribution)) {
            $distribution[] = ['name' => 'Data needed', 'value' => 0];
        }

        return $distribution;
    }

    /**
     * Helper to classify a course into one of the 19 standard academic interests.
     */
    public function classifyCourseField(\App\Models\Course $course): string
    {
        $text = strtolower($course->title . ' ' . $course->department);
        
        $fields = [
            'Computing & Information Technology' => ['computing', 'information technology', 'software', 'computer', 'it', 'programming', 'network', 'system'],
            'Accounting & Finance' => ['accounting', 'finance', 'audit', 'taxation', 'banking'],
            'Business & Management' => ['business', 'management', 'mba', 'administration', 'hr', 'human resource', 'entrepreneurship'],
            'Hospitality & Tourism' => ['hospitality', 'tourism', 'hotel', 'travel', 'event management'],
            'Marketing' => ['marketing', 'digital marketing', 'advertising', 'sales'],
            'Economics' => ['economics', 'macroeconomics', 'microeconomics'],
            'Psychology' => ['psychology', 'counseling', 'behavior'],
            'Media & Communication' => ['media', 'communication', 'journalism', 'public relations'],
            'Environmental Studies' => ['environmental', 'ecology', 'forestry'],
            'Architecture' => ['architecture', 'design', 'building'],
            'Mathematics & Statistics' => ['mathematics', 'statistics', 'math', 'actuarial'],
            'Education' => ['education', 'teaching', 'pedagogy'],
            'Arts & Humanities' => ['arts', 'humanities', 'english', 'history', 'philosophy'],
            'Social Science' => ['social science', 'sociology', 'anthropology'],
            'Engineering & Technology' => ['engineering', 'mechanical', 'civil', 'electrical', 'electronic'],
            'Medicine & Health Sciences' => ['medicine', 'health', 'nursing', 'medical', 'dental', 'pharmacy'],
            'Agriculture' => ['agriculture', 'farming', 'crop', 'horticulture'],
            'Law' => ['law', 'legal', 'jurisprudence'],
            'Science' => ['science', 'chemistry', 'physics', 'biology', 'zoology', 'botany']
        ];

        foreach ($fields as $fieldName => $keywords) {
            foreach ($keywords as $kw) {
                $pattern = '/\b' . preg_quote($kw, '/') . '\b/i';
                if (preg_match($pattern, $text)) {
                    return $fieldName;
                }
            }
        }

        return $course->department;
    }

    /**
     * Recommends multiple related academic interests based on program title, category, and subject names.
     */
    public function classifyCourseFields(\App\Models\Course $course): array
    {
        $course->loadMissing('semesters.subjects', 'category');
        $textParts = [$course->title, $course->department];
        if ($course->category) {
            $textParts[] = $course->category->name;
        }
        foreach ($course->semesters as $semester) {
            foreach ($semester->subjects as $subject) {
                $textParts[] = $subject->name;
            }
        }
        $fullText = strtolower(implode(' ', $textParts));

        $fields = [
            'Computing & Information Technology' => ['computing', 'information technology', 'software', 'computer', 'it', 'programming', 'network', 'system', 'database', 'developer'],
            'Accounting & Finance' => ['accounting', 'finance', 'audit', 'taxation', 'banking', 'accountant'],
            'Business & Management' => ['business', 'management', 'mba', 'administration', 'hr', 'human resource', 'entrepreneurship'],
            'Hospitality & Tourism' => ['hospitality', 'tourism', 'hotel', 'travel', 'event management'],
            'Marketing' => ['marketing', 'digital marketing', 'advertising', 'sales'],
            'Economics' => ['economics', 'macroeconomics', 'microeconomics'],
            'Psychology' => ['psychology', 'counseling', 'behavior'],
            'Media & Communication' => ['media', 'communication', 'journalism', 'public relations'],
            'Environmental Studies' => ['environmental', 'ecology', 'forestry'],
            'Architecture' => ['architecture', 'design', 'building'],
            'Mathematics & Statistics' => ['mathematics', 'statistics', 'math', 'actuarial'],
            'Education' => ['education', 'teaching', 'pedagogy'],
            'Arts & Humanities' => ['arts', 'humanities', 'english', 'history', 'philosophy', 'language', 'literature', 'creative writing'],
            'Social Science' => ['social science', 'sociology', 'anthropology'],
            'Engineering & Technology' => ['engineering', 'mechanical', 'civil', 'electrical', 'electronic', 'mechatronics'],
            'Medicine & Health Sciences' => ['medicine', 'health', 'nursing', 'medical', 'dental', 'pharmacy'],
            'Agriculture' => ['agriculture', 'farming', 'crop', 'horticulture'],
            'Law' => ['law', 'legal', 'jurisprudence'],
            'Science' => ['science', 'chemistry', 'physics', 'biology', 'zoology', 'botany']
        ];

        $matchedFields = [];
        foreach ($fields as $fieldName => $keywords) {
            foreach ($keywords as $kw) {
                $pattern = '/\b' . preg_quote($kw, '/') . '\b/i';
                if (preg_match($pattern, $fullText)) {
                    $matchedFields[] = $fieldName;
                    break;
                }
            }
        }

        if (empty($matchedFields)) {
            $matchedFields[] = $course->department;
        }

        return array_unique($matchedFields);
    }
}
