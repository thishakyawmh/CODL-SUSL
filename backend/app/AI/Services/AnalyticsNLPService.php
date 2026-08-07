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

        // If a course is provided, use multi-signal NLP to filter relevant surveys
        if ($course) {
            $courseText = $course->title . ' ' . $course->department . ' ' . $course->code;
            $courseDomains = $this->extractDomains($courseText);
            // Default to broad matching if course text is too vague
            if (empty($courseDomains)) {
                $courseDomains = [$course->department];
            }

            $studentSurveys = $studentSurveys->filter(function ($survey) use ($courseDomains) {
                // Multi-signal evaluation
                $text = $survey->primary_field . ' ' . $survey->specializations . ' ' . $survey->emerging_fields;
                $surveyDomains = $this->extractDomains($text);
                // Return true if there is any semantic intersection
                return count(array_intersect($courseDomains, $surveyDomains)) > 0;
            });

            $industrySurveys = $industrySurveys->filter(function ($survey) use ($courseDomains) {
                $text = $survey->industry_sector . ' ' . $survey->primary_academic_field . ' ' . $survey->required_skills;
                $surveyDomains = $this->extractDomains($text);
                return count(array_intersect($courseDomains, $surveyDomains)) > 0;
            });
        }

        $studentDomains = [];
        $industryDomains = [];
        $emergingTechnologies = [];
        $skillGapsList = [];

        // Learning preferences containers
        $theoryPracticalScores = [];
        $learningPreferences = [];
        $academicPractices = [];
        $certImportances = [];

        // 1. Process Student Surveys
        foreach ($studentSurveys as $survey) {
            $text = $survey->primary_field . ' ' . $survey->specializations . ' ' . $survey->emerging_fields;
            $domains = $this->extractDomains($text);
            $domains = $this->deduplicateDomains($domains);
            $studentDomains = array_merge($studentDomains, $domains);
            
            // Also collect raw emerging fields for the tag cloud
            if ($survey->emerging_fields) {
                $emergingTechnologies[] = $survey->emerging_fields;
            }

            // Extract theory practical score
            if (isset($survey->theory_practical_score)) {
                $theoryPracticalScores[] = $survey->theory_practical_score;
            }

            // Extract learning preferences
            if ($survey->learning_preferences) {
                $prefs = array_map('trim', explode(',', $survey->learning_preferences));
                foreach ($prefs as $p) {
                    if ($p) $learningPreferences[] = $p;
                }
            }
        }

        // 2. Process Industry Surveys
        foreach ($industrySurveys as $survey) {
            $text = $survey->required_skills . ' ' . $survey->graduate_skill_gaps . ' ' . $survey->emerging_fields;
            $domains = $this->extractDomains($text);
            $domains = $this->deduplicateDomains($domains);
            $industryDomains = array_merge($industryDomains, $domains);
            
            if ($survey->emerging_fields) {
                $emergingTechnologies[] = $survey->emerging_fields;
            }
            if ($survey->graduate_skill_gaps) {
                $skillGapsList = array_merge($skillGapsList, $this->extractDomains($survey->graduate_skill_gaps));
            }

            // Extract academic practices
            if ($survey->academic_practices) {
                $practices = array_map('trim', explode(',', $survey->academic_practices));
                foreach ($practices as $p) {
                    if ($p) $academicPractices[] = $p;
                }
            }

            // Extract certification importance
            if (isset($survey->certification_importance)) {
                $certImportances[] = $survey->certification_importance;
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
            $course->load('semesters.subjects');
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
            $totalResponses = $studentSurveys->count() + $industrySurveys->count();
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
                'alignment' => $coveragePercent, // Align alignment score to actual coverage percentage!
                'surveys' => $studentSurveys->count() + $industrySurveys->count(),
                'companies' => IndustryRequirement::distinct('company_name')->count(),
                'courses' => \App\Models\Course::count(),
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
}
