<?php

namespace App\AI\Services;

use App\AI\Models\StudentInterest;
use App\AI\Models\IndustryRequirement;
use Illuminate\Support\Facades\Log;

class AnalyticsNLPService
{
    protected $synonyms;
    protected static $geminiCache = [];

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
        // Use memory-efficient cursors to process database rows one by one
        $studentSurveys = StudentInterest::cursor();
        $industrySurveys = IndustryRequirement::cursor();

        $studentFrequencies = [];
        $industryFrequencies = [];
        $emergingTechnologiesCounts = [];
        $skillGapsCounts = [];
        $studentPrefsCounts = [];
        $industryPracticesCounts = [];

        // Theory/Practical preferred learning weighted average variables
        $theoryPracticalSum = 0.0;
        $theoryPracticalWeightSum = 0.0;

        // Certification importance weighted average variables
        $certImportanceSum = 0.0;
        $certImportanceWeightSum = 0.0;

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

            // 1. Filter Student Surveys using memory-efficient cursor loop
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

            // 2. Filter Industry Surveys using memory-efficient cursor loop
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

                // Count each domain once per survey response weighted by interest score (No amplification bug)
                foreach ($domains as $d) {
                    $studentFrequencies[$d] = ($studentFrequencies[$d] ?? 0.0) + $weight;
                }

                if ($survey->new_program_suggestion) {
                    $emergingTechnologiesCounts[$survey->new_program_suggestion] = ($emergingTechnologiesCounts[$survey->new_program_suggestion] ?? 0.0) + $weight;
                }

                if ($balance) {
                    $score = $parseBalance($balance);
                    $theoryPracticalSum += $score * $weight;
                    $theoryPracticalWeightSum += $weight;
                }

                if ($methods) {
                    $prefs = array_map('trim', explode(',', $methods));
                    foreach ($prefs as $p) {
                        if ($p) {
                            $studentPrefsCounts[$p] = ($studentPrefsCounts[$p] ?? 0.0) + $weight;
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

                // Count each domain once per survey response weighted by interest score (No amplification bug)
                foreach ($domains as $d) {
                    $industryFrequencies[$d] = ($industryFrequencies[$d] ?? 0.0) + $weight;
                }

                if ($survey->emerging_fields) {
                    $emergingTechnologiesCounts[$survey->emerging_fields] = ($emergingTechnologiesCounts[$survey->emerging_fields] ?? 0.0) + $weight;
                }

                if ($survey->graduate_skill_gaps) {
                    $gaps = $this->extractDomains($survey->graduate_skill_gaps);
                    foreach ($gaps as $g) {
                        $skillGapsCounts[$g] = ($skillGapsCounts[$g] ?? 0.0) + $weight;
                    }
                }

                if ($survey->academic_practices) {
                    $practices = array_map('trim', explode(',', $survey->academic_practices));
                    foreach ($practices as $p) {
                        if ($p) {
                            $industryPracticesCounts[$p] = ($industryPracticesCounts[$p] ?? 0.0) + $weight;
                        }
                    }
                }

                if (isset($survey->certification_importance)) {
                    $certImportanceSum += (float) $survey->certification_importance * $weight;
                    $certImportanceWeightSum += $weight;
                }
            }

        } else {
            // Global scope fallback using memory-efficient cursor loop
            foreach ($studentSurveys as $survey) {
                $text = implode(' ', [$survey->primary_interest, $survey->primary_skills, $survey->secondary_interest, $survey->secondary_skills, $survey->ternary_interest, $survey->ternary_skills]);
                $domains = $this->extractDomains($text);
                $domains = $this->deduplicateDomains($domains);
                foreach ($domains as $d) {
                    $studentFrequencies[$d] = ($studentFrequencies[$d] ?? 0.0) + 1.0;
                }
                
                if ($survey->new_program_suggestion) {
                    $emergingTechnologiesCounts[$survey->new_program_suggestion] = ($emergingTechnologiesCounts[$survey->new_program_suggestion] ?? 0.0) + 1.0;
                }

                if ($survey->primary_learning_balance) {
                    $score = $parseBalance($survey->primary_learning_balance);
                    $theoryPracticalSum += $score;
                    $theoryPracticalWeightSum += 1.0;
                }

                $prefsText = implode(',', array_filter([$survey->primary_learning_methods, $survey->secondary_learning_methods, $survey->ternary_learning_methods]));
                if ($prefsText) {
                    $prefs = array_map('trim', explode(',', $prefsText));
                    foreach ($prefs as $p) {
                        if ($p) {
                            $studentPrefsCounts[$p] = ($studentPrefsCounts[$p] ?? 0.0) + 1.0;
                        }
                    }
                }
            }

            foreach ($industrySurveys as $survey) {
                $text = $survey->required_skills . ' ' . $survey->graduate_skill_gaps . ' ' . $survey->emerging_fields;
                $domains = $this->extractDomains($text);
                $domains = $this->deduplicateDomains($domains);
                foreach ($domains as $d) {
                    $industryFrequencies[$d] = ($industryFrequencies[$d] ?? 0.0) + 1.0;
                }

                if ($survey->emerging_fields) {
                    $emergingTechnologiesCounts[$survey->emerging_fields] = ($emergingTechnologiesCounts[$survey->emerging_fields] ?? 0.0) + 1.0;
                }
                if ($survey->graduate_skill_gaps) {
                    $gaps = $this->extractDomains($survey->graduate_skill_gaps);
                    foreach ($gaps as $g) {
                        $skillGapsCounts[$g] = ($skillGapsCounts[$g] ?? 0.0) + 1.0;
                    }
                }
                if ($survey->academic_practices) {
                    $practices = array_map('trim', explode(',', $survey->academic_practices));
                    foreach ($practices as $p) {
                        if ($p) {
                            $industryPracticesCounts[$p] = ($industryPracticesCounts[$p] ?? 0.0) + 1.0;
                        }
                    }
                }
                if (isset($survey->certification_importance)) {
                    $certImportanceSum += (float) $survey->certification_importance;
                    $certImportanceWeightSum += 1.0;
                }
            }
        }

        // Sort all accumulated frequencies
        arsort($studentFrequencies);
        arsort($industryFrequencies);
        arsort($emergingTechnologiesCounts);
        arsort($skillGapsCounts);
        arsort($studentPrefsCounts);
        arsort($industryPracticesCounts);

        // 4. Calculate Weighted Jaccard Similarity (Overall match between supply and demand)
        $jaccardResults = $this->calculateWeightedJaccard($studentFrequencies, $industryFrequencies);

        // 5. Structure distributions for the dashboard pie charts
        $studentDistribution = $this->formatDistribution($studentFrequencies);
        $industryDistribution = $this->formatDistribution($industryFrequencies);

        // 7. Process Learning Preferences Aggregates
        $avgTheoryPractical = $theoryPracticalWeightSum > 0 ? $theoryPracticalSum / $theoryPracticalWeightSum : 3.0;
        $studentPracticalPercent = (int) round(($avgTheoryPractical / 5) * 100);
        $studentTheoryPercent = 100 - $studentPracticalPercent;

        $studentPrefsFormatted = [];
        $totalPrefs = array_sum($studentPrefsCounts) ?: 1;
        foreach (array_slice($studentPrefsCounts, 0, 5, true) as $name => $count) {
            $studentPrefsFormatted[] = ['name' => $name, 'value' => (int) round(($count / $totalPrefs) * 100)];
        }

        $industryPracticesFormatted = [];
        $totalPractices = array_sum($industryPracticesCounts) ?: 1;
        foreach (array_slice($industryPracticesCounts, 0, 5, true) as $name => $count) {
            $industryPracticesFormatted[] = ['name' => $name, 'value' => (int) round(($count / $totalPractices) * 100)];
        }

        $avgCertImportance = $certImportanceWeightSum > 0 ? $certImportanceSum / $certImportanceWeightSum : 3.0;
        $certImportancePercent = (int) round(($avgCertImportance / 5) * 100);

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

            // Identify Outdated Subjects (Legacy Tech) & Low-Demand Subjects (Using config array)
            $legacyKeywords = config('analytics.legacy_keywords', ['visual basic', 'flash', 'silverlight', 'cobol', 'dreamweaver', 'pascal', 'fortran']);
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

        // Calculate separate match KPIs using Cosine Similarity of curriculum vs student/industry
        $studentMatchScore = 0;
        $industryMatchScore = 0;
        if ($course) {
            $studentMatchScore = (int) round($this->calculateCosineSimilarity($curriculumDomains, $studentFrequencies));
            $industryMatchScore = (int) round($this->calculateCosineSimilarity($curriculumDomains, $industryFrequencies));
        } else {
            // Global scope fallback: just use the weighted Jaccard score
            $studentMatchScore = $jaccardResults['overall_score'] ?? 0;
            $industryMatchScore = $jaccardResults['overall_score'] ?? 0;
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
                'studentMatch' => $studentMatchScore,
                'industryMatch' => $industryMatchScore,
                'alignment' => $coveragePercent,
                'surveys' => $totalRelevant,
                'companies' => count($relevantIndustrySurveys) > 0 ? count(array_unique(array_filter(array_column(array_column($relevantIndustrySurveys, 'survey'), 'company_name')))) : 0,
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

    public function preClassifySurveys(): void
    {
        $apiKey = env('GEMINI_API_KEY');
        if (!$apiKey) {
            return;
        }

        Log::info("Pre-classifying survey texts via Gemini API...");

        $texts = [];
        // Extract texts from student interests
        foreach (\App\AI\Models\StudentInterest::cursor() as $survey) {
            $t = trim(implode(' ', array_filter([
                $survey->primary_skills,
                $survey->secondary_skills,
                $survey->ternary_skills,
                $survey->new_program_suggestion
            ])));
            if ($t) $texts[] = $t;
            if ($survey->primary_skills) $texts[] = trim($survey->primary_skills);
            if ($survey->secondary_skills) $texts[] = trim($survey->secondary_skills);
            if ($survey->ternary_skills) $texts[] = trim($survey->ternary_skills);
        }

        // Extract texts from industry requirements
        foreach (\App\AI\Models\IndustryRequirement::cursor() as $survey) {
            $t = trim(implode(' ', array_filter([
                $survey->required_skills,
                $survey->emerging_fields,
                $survey->new_program_suggestion,
                $survey->graduate_skill_gaps
            ])));
            if ($t) $texts[] = $t;
            if ($survey->required_skills) $texts[] = trim($survey->required_skills);
            if ($survey->graduate_skill_gaps) $texts[] = trim($survey->graduate_skill_gaps);
        }

        $uniqueTexts = array_values(array_unique(array_filter($texts)));
        Log::info("Found " . count($uniqueTexts) . " unique survey texts to pre-classify.");

        if (empty($uniqueTexts)) {
            return;
        }

        $domainsList = array_keys($this->synonyms);
        $chunks = array_chunk($uniqueTexts, 30); // Use 30 to stay within response token limits safely

        foreach ($chunks as $chunkIndex => $chunk) {
            Log::info("Sending batch " . ($chunkIndex + 1) . " of " . count($chunks) . " to Gemini...");
            
            try {
                $payload = [];
                foreach ($chunk as $idx => $txt) {
                    $payload[] = ['id' => $idx, 'text' => $txt];
                }

                $prompt = "You are an expert curriculum alignment classifier. Your task is to analyze the following list of survey responses and map each response to one or more academic/industry domains from this allowed list:\n"
                    . json_encode($domainsList) . "\n\n"
                    . "Here are the survey responses to classify:\n"
                    . json_encode($payload) . "\n\n"
                    . "Response format requirement: Return a raw JSON array containing objects with keys 'text' (exact match to input text) and 'domains' (array of strings from the allowed list). Do not write any conversational intro/outro text, code blocks, or markdown. Output only the raw valid JSON array.";

                $response = \Illuminate\Support\Facades\Http::post(
                    "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=" . $apiKey,
                    [
                        'contents' => [[
                            'parts' => [[
                                'text' => $prompt
                            ]]
                        ]],
                        'generationConfig' => [
                            'responseMimeType' => 'application/json'
                        ]
                    ]
                );

                if ($response->successful()) {
                    $responseText = $response->json('candidates.0.content.parts.0.text');
                    $results = json_decode(trim($responseText), true);
                    if (is_array($results)) {
                        foreach ($results as $res) {
                            if (isset($res['text']) && isset($res['domains'])) {
                                $cacheKey = md5(trim($res['text']));
                                self::$geminiCache[$cacheKey] = array_values(array_unique(array_filter($res['domains'])));
                            }
                        }
                    }
                } else {
                    Log::error("Gemini batch call failed with status: " . $response->status() . " Body: " . $response->body());
                }
            } catch (\Exception $e) {
                Log::error("Error in Gemini batch pre-classification: " . $e->getMessage());
            }

            // Sleep 4 seconds between calls to respect the 15 RPM free-tier limit
            if (count($chunks) > 1 && $chunkIndex < count($chunks) - 1) {
                sleep(4);
            }
        }

        Log::info("Pre-classification completed. Cached " . count(self::$geminiCache) . " classifications.");
    }

    public function extractDomains(string $text): array
    {
        if (empty(trim($text))) {
            return [];
        }

        $apiKey = env('GEMINI_API_KEY');
        if ($apiKey) {
            $cacheKey = md5(trim($text));
            if (isset(self::$geminiCache[$cacheKey])) {
                return self::$geminiCache[$cacheKey];
            }
        }

        return $this->extractDomainsLocalRegex($text);
    }

    public function extractDomainsLocalRegex(string $text): array
    {
        $normalized = $this->normalizeText($text);
        
        $matchedDomains = [];

        foreach ($this->synonyms as $domain => $keywords) {
            foreach ($keywords as $keyword) {
                $normalizedKeyword = $this->normalizeText($keyword);
                if (empty($normalizedKeyword)) {
                    continue;
                }
                // Match with word boundaries to avoid false positives (e.g. 'ml' in 'html')
                $pattern = '/\b' . preg_quote($normalizedKeyword, '/') . '\b/i';
                if (preg_match($pattern, $normalized)) {
                    $matchedDomains[] = $domain;
                }
            }
        }

        return array_values(array_unique($matchedDomains));
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
        ];        $matchedFields = [];
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

    /**
     * Calculates the cosine similarity between curriculum domains and survey frequency distribution.
     */
    protected function calculateCosineSimilarity(array $curriculumDomains, array $frequencies): float
    {
        if (empty($curriculumDomains) || empty($frequencies)) {
            return 0.0;
        }

        $dotProduct = 0.0;
        $normA = count($curriculumDomains); // Since each domain in curriculum has weight 1.0, sum of 1.0^2 is count.
        $normB = 0.0;

        foreach ($frequencies as $domain => $count) {
            $normB += $count * $count;
            if (in_array($domain, $curriculumDomains)) {
                $dotProduct += 1.0 * $count;
            }
        }

        if ($normA === 0 || $normB === 0.0) {
            return 0.0;
        }

        return ($dotProduct / (sqrt($normA) * sqrt($normB))) * 100;
    }

    /**
     * Calculates the weighted Jaccard similarity between two frequency distributions.
     */
    protected function calculateWeightedJaccard(array $setA, array $setB): array
    {
        $keysA = array_keys($setA);
        $keysB = array_keys($setB);
        $intersection = array_intersect($keysA, $keysB);
        $union = array_unique(array_merge($keysA, $keysB));

        $allKeys = array_unique(array_merge($keysA, $keysB));
        if (empty($allKeys)) {
            return [
                'intersection' => [],
                'union' => [],
                'overall_score' => 0
            ];
        }

        $sumMin = 0.0;
        $sumMax = 0.0;

        foreach ($allKeys as $key) {
            $valA = $setA[$key] ?? 0.0;
            $valB = $setB[$key] ?? 0.0;
            $sumMin += min($valA, $valB);
            $sumMax += max($valA, $valB);
        }

        $score = $sumMax > 0 ? ($sumMin / $sumMax) * 100 : 0.0;

        return [
            'intersection' => array_values($intersection),
            'union' => array_values($union),
            'overall_score' => (int) round($score)
        ];
    }
}
