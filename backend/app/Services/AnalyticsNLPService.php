<?php

namespace App\Services;

use App\Models\StudentInterest;
use App\Models\IndustryRequirement;

class AnalyticsNLPService
{
    protected $synonyms;

    public function __construct()
    {
        // Load the synonym dictionary from config/analytics.php
        $this->synonyms = config('analytics.synonyms', []);
    }

    /**
     * Master method to process all survey data and return structured analytics.
     */
    public function processAll(): array
    {
        $studentSurveys = StudentInterest::all();
        $industrySurveys = IndustryRequirement::all();

        $studentDomains = [];
        $industryDomains = [];

        // 1. Process Student Surveys
        foreach ($studentSurveys as $survey) {
            // using primary_field as the main text to analyze for student skills
            $text = $survey->primary_field . ' ' . $survey->specializations . ' ' . $survey->emerging_fields;
            $domains = $this->extractDomains($text);
            $domains = $this->deduplicateDomains($domains);
            $studentDomains = array_merge($studentDomains, $domains);
        }

        // 2. Process Industry Surveys
        foreach ($industrySurveys as $survey) {
            $text = $survey->required_skills . ' ' . $survey->graduate_skill_gaps . ' ' . $survey->emerging_fields;
            $domains = $this->extractDomains($text);
            $domains = $this->deduplicateDomains($domains);
            $industryDomains = array_merge($industryDomains, $domains);
        }

        // 3. Count Frequencies
        $studentFrequencies = $this->countFrequency($studentDomains);
        $industryFrequencies = $this->countFrequency($industryDomains);

        // 4. Calculate Jaccard Similarity (Overall match between supply and demand)
        $jaccardResults = $this->calculateJaccardSimilarity($studentFrequencies, $industryFrequencies);

        // 5. Structure distributions for the dashboard pie charts
        $studentDistribution = $this->formatDistribution($studentFrequencies);
        $industryDistribution = $this->formatDistribution($industryFrequencies);

        return [
            'student_demand_distribution' => $studentDistribution,
            'industry_demand_distribution' => $industryDistribution,
            'domain_frequency_counts' => [
                'student' => $studentFrequencies,
                'industry' => $industryFrequencies,
            ],
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
    protected function normalizeText(string $text): string
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
    protected function extractDomains(string $text): array
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
