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
            'kpis' => [
                'studentMatch' => $jaccardResults['overall_score'] ?? 0,
                'industryMatch' => $jaccardResults['overall_score'] ?? 0,
                'alignment' => $jaccardResults['overall_score'] ?? 0,
                'surveys' => $studentSurveys->count() + $industrySurveys->count(),
                'companies' => IndustryRequirement::distinct('company_name')->count(),
                'courses' => \App\Models\Course::count(), // Fast count from main DB
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
