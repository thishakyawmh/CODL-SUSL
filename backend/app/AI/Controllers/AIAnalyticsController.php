<?php

namespace App\AI\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\DB;
use App\Models\Course;
use App\AI\Models\StudentInterest;
use App\AI\Models\IndustryRequirement;
use App\AI\Services\AnalyticsNLPService;
use App\AI\Services\RecommendationEngineService;
use Illuminate\Support\Facades\Log;

class AIAnalyticsController extends Controller
{
    /**
     * Get all programs grouped by level
     */
    public function getPrograms()
    {
        $courses = Course::withCount('batches')->get()->map(function($c) {
            return [
                'id' => $c->id,
                'title' => $c->title,
                'code' => $c->course_code,
                'level' => $c->level,
                'department' => $c->department,
                'duration' => $c->duration,
                'max_students' => $c->max_students,
                'created_at' => $c->created_at ? $c->created_at->format('M j, Y') : null,
                'batches_count' => $c->batches_count,
            ];
        });
        return response()->json($courses); 
    }

    private function getCacheForCourse($courseId)
    {
        return \App\AI\Models\AnalyticsCache::where('scope_type', 'program')
            ->where('scope_id', $courseId)
            ->orderBy('generated_at', 'desc')
            ->first();
    }

    public function getOverview($courseId)
    {
        $cache = $this->getCacheForCourse($courseId);
        if (!$cache) return response()->json(null); // Triggers empty state

        return response()->json([
            'kpis' => $cache->kpis,
            'last_generated' => $cache->generated_at->format('M j, Y - g:i A'),
            'coverage_percent' => $cache->kpis['coverage_percent'] ?? 0,
            'missing_subjects' => $cache->kpis['missing_subjects'] ?? [],
            'outdated_subjects' => $cache->kpis['outdated_subjects'] ?? [],
            'low_demand_subjects' => $cache->kpis['low_demand_subjects'] ?? [],
            'learning_preferences_data' => $cache->kpis['learning_preferences_data'] ?? null,
        ]);
    }

    public function getStudentInterest($courseId)
    {
        $cache = $this->getCacheForCourse($courseId);
        if (!$cache) return response()->json([]);

        return response()->json($cache->student_demand_distribution);
    }

    public function getIndustryGap($courseId)
    {
        $cache = $this->getCacheForCourse($courseId);
        if (!$cache) return response()->json([]);

        return response()->json($cache->industry_demand_distribution);
    }

    public function getRecommendations($courseId)
    {
        $cache = $this->getCacheForCourse($courseId);
        if (!$cache || empty($cache->generated_recommendations)) {
            return response()->json([]);
        }

        return response()->json($cache->generated_recommendations);
    }
    
    public function getSkillGap($courseId)
    {
        $cache = $this->getCacheForCourse($courseId);
        if (!$cache) return response()->json([]);

        return response()->json([
            'missing_skills' => $cache->skill_gaps,
            'jaccard_similarity' => $cache->jaccard_similarity_results,
            'coverage_percent' => $cache->kpis['coverage_percent'] ?? 0,
            'missing_subjects' => $cache->kpis['missing_subjects'] ?? [],
            'outdated_subjects' => $cache->kpis['outdated_subjects'] ?? [],
            'low_demand_subjects' => $cache->kpis['low_demand_subjects'] ?? [],
            'learning_preferences_data' => $cache->kpis['learning_preferences_data'] ?? null,
        ]);
    }

    public function getEmergingTechnologies($courseId)
    {
        $cache = $this->getCacheForCourse($courseId);
        if (!$cache) return response()->json([]);

        return response()->json($cache->emerging_technologies);
    }

    /**
     * Fetch all survey responses.
     */
    public function getSurveys()
    {
        $studentSurveys = \App\AI\Models\StudentInterest::orderBy('created_at', 'desc')->get()->map(function($item) {
            $item->type = 'student';
            return $item;
        });
        
        $industrySurveys = \App\AI\Models\IndustryRequirement::orderBy('created_at', 'desc')->get()->map(function($item) {
            $item->type = 'industry';
            return $item;
        });
        
        $surveys = $studentSurveys->concat($industrySurveys)->sortByDesc('created_at')->values();
        
        return response()->json($surveys);
    }

    /**
     * Store a manual survey.
     */
    public function storeSurvey(Request $request)
    {
        $request->validate([
            'survey_type' => 'required|in:student,industry',
            'data' => 'required|array',
        ]);

        $data = $request->data;

        // Convert array values into comma-separated strings for database insertion
        $parsedData = [];
        foreach ($data as $key => $value) {
            if (is_array($value)) {
                $parsedData[$key] = implode(', ', $value);
            } else {
                $parsedData[$key] = $value;
            }
        }

        if ($request->survey_type === 'student') {
            // Note: Our current form doesn't capture all of these exactly, but maps to them
            \App\AI\Models\StudentInterest::create([
                'education_level' => $parsedData['education_level'] ?? 'Not Specified',
                'primary_field' => $parsedData['preferred_field'] ?? 'Various',
                'learning_preferences' => $parsedData['academic_practices'] ?? null,
                'emerging_fields' => $parsedData['emerging_fields'] ?? null,
                'new_program_suggestion' => $parsedData['new_program_recommendation'] ?? null,
            ]);
        } else {
            \App\AI\Models\IndustryRequirement::create([
                'company_name' => $parsedData['company_name'] ?? null,
                'industry_sector' => $parsedData['industry_sector'] ?? 'Unknown',
                'organization_size' => $parsedData['organization_size'] ?? null,
                'primary_academic_field' => $parsedData['preferred_field'] ?? 'Various', // Using preferred_field mapped from form
                'required_skills' => $parsedData['required_skills'] ?? null,
                'academic_practices' => $parsedData['academic_practices'] ?? null,
                'minimum_qualification' => $parsedData['min_qualification'] ?? null,
                'minimum_degree_result' => $parsedData['expected_gpa'] ?? null,
                'certification_importance' => isset($parsedData['certification_importance']) ? (int) $parsedData['certification_importance'] : null,
                'emerging_fields' => $parsedData['emerging_fields'] ?? null,
                'new_program_suggestion' => $parsedData['new_program_recommendation'] ?? null,
                'graduate_skill_gaps' => $parsedData['skill_shortages'] ?? null,
                'additional_recommendations' => $parsedData['additional_recommendations'] ?? null,
            ]);
        }

        return response()->json(['message' => 'Survey response successfully logged.']);
    }

    /**
     * Sync data from Google Sheets CSV.
     */
    public function syncGoogleSheet(Request $request, AnalyticsNLPService $nlpService, RecommendationEngineService $recommendationEngine)
    {
        $startTime = microtime(true);
        
        if (!$request->has('sheet_url') && $request->has('url')) {
            $request->merge(['sheet_url' => $request->input('url')]);
        }

        $request->validate([
            'type' => 'required|in:student,industry',
            'sheet_url' => 'required|url'
        ]);

        $type = $request->type;
        $url = $request->sheet_url;

        // 1. URL Rewriting
        // Convert /edit#gid=X or /edit?usp=sharing to /export?format=csv&gid=X
        if (str_contains($url, 'format=csv') || str_contains($url, 'output=csv')) {
            $csvUrl = $url;
        } elseif (preg_match('/\/d\/([a-zA-Z0-9-_]+)/', $url, $matches)) {
            $spreadsheetId = $matches[1];
            $gid = 0;
            if (preg_match('/gid=([0-9]+)/', $url, $gidMatches)) {
                $gid = $gidMatches[1];
            }
            $csvUrl = "https://docs.google.com/spreadsheets/d/{$spreadsheetId}/export?format=csv&gid={$gid}";
        } else {
            return response()->json(['error' => 'Invalid Google Sheets URL format.'], 400);
        }

        // 2. HTTP Fetch
        try {
            $response = Http::get($csvUrl);
            if (!$response->successful()) {
                return response()->json(['error' => 'Failed to download CSV from Google Sheets. Make sure the sheet is public.'], 400);
            }
            $csvData = $response->body();
        } catch (\Exception $e) {
            return response()->json(['error' => 'HTTP request failed: ' . $e->getMessage()], 500);
        }

        // 3. Parsing CSV
        $lines = explode("\n", $csvData);
        if (count($lines) < 2) {
            return response()->json(['error' => 'CSV file is empty or only contains headers.'], 400);
        }

        $headers = str_getcsv(array_shift($lines));
        $headers = array_map(function($h) {
            return trim(preg_replace('/\s+/', ' ', $h));
        }, $headers);

        // 4. Configurable Mapping Dictionary
        $studentHeaderMap = [
            'Timestamp' => 'survey_submitted_at',
            'Current Education Level' => 'education_level',
            'Province' => 'province',
            'Student District' => 'district',
            'Which academic field is your primary interest for university study?' => 'primary_field',
            'Which academic field is your Secondary interest for university study?' => 'secondary_field',
            'Which academic field is your Third interest for university study?' => 'third_field',
            'Specializations' => 'specializations',
            'Teaching Methods' => 'learning_preferences',
            'Theory vs Practical' => 'theory_practical_score',
            'Which university opportunities are most important to you?' => 'university_opportunities',
            'Which emerging fields do you think universities should introduce or expand?' => 'emerging_fields',
            'If you could introduce ONE new degree program or specialization, what would it be?' => 'new_program_suggestion',
        ];

        $industryHeaderMap = [
            'Timestamp' => 'survey_submitted_at',
            'Organization / Company Name' => 'company_name',
            'Industry Sector' => 'industry_sector',
            'Organization Size' => 'organization_size',
            'Primary academic field recruited' => 'primary_academic_field',
            'Secondary academic field recruited' => 'secondary_academic_field',
            'Third academic field recruited' => 'third_academic_field',
            'Required skills' => 'required_skills',
            'Academic practices required' => 'academic_practices',
            'Minimum qualification' => 'minimum_qualification',
            'Minimum degree result' => 'minimum_degree_result',
            'Certification importance (1-5)' => 'certification_importance',
            'Emerging fields to introduce' => 'emerging_fields',
            'New program suggestions' => 'new_program_suggestion',
            'Graduate skill gaps' => 'graduate_skill_gaps',
            'Additional recommendations' => 'additional_recommendations',
        ];

        $mapToUse = $type === 'student' ? $studentHeaderMap : $industryHeaderMap;
        $requiredColumns = $type === 'student' ? ['education_level', 'primary_field'] : ['industry_sector', 'primary_academic_field'];
        
        $mappedIndexes = [];
        
        // Find exact matches first, then keyword matches
        foreach ($headers as $index => $header) {
            $headerLower = strtolower(trim($header));
            $foundMatch = false;

            // Try exact match in map keys
            foreach ($mapToUse as $mapKey => $dbColumn) {
                if (strtolower($mapKey) === $headerLower) {
                    $mappedIndexes[$dbColumn] = $index;
                    $foundMatch = true;
                    break;
                }
            }

            // If no exact match, fallback to simple keyword matching
            if (!$foundMatch) {
                foreach ($mapToUse as $mapKey => $dbColumn) {
                    $cleanHeader = strtolower(preg_replace('/[^a-z0-9]/i', '', $headerLower));
                    if (str_contains($cleanHeader, 'company') && $dbColumn === 'company_name') { $mappedIndexes[$dbColumn] = $index; break; }
                    if (str_contains($cleanHeader, 'sector') && $dbColumn === 'industry_sector') { $mappedIndexes[$dbColumn] = $index; break; }
                    if (str_contains($cleanHeader, 'education') && $dbColumn === 'education_level') { $mappedIndexes[$dbColumn] = $index; break; }
                    if (str_contains($cleanHeader, 'province') && $dbColumn === 'province') { $mappedIndexes[$dbColumn] = $index; break; }
                }
            }
        }

        // 5. Add Validation for required columns
        $missingColumns = [];
        foreach ($requiredColumns as $reqCol) {
            if (!isset($mappedIndexes[$reqCol])) {
                $missingColumns[] = $reqCol;
            }
        }

        if (count($missingColumns) > 0) {
            return response()->json([
                'error' => 'Missing required columns in Google Sheet based on mapping.',
                'missing_columns' => $missingColumns
            ], 422);
        }

        // 6 & 7 & 8: Wrap Truncate and Bulk Insert in Transaction
        $rowsImported = 0;
        $rowsIgnored = 0;

        try {
            DB::connection('analytics')->transaction(function () use ($lines, $mappedIndexes, $type, &$rowsImported, &$rowsIgnored) {
                
                if ($type === 'student') {
                    StudentInterest::query()->delete();
                } else {
                    IndustryRequirement::query()->delete();
                }

                $insertData = [];
                foreach ($lines as $line) {
                    if (empty(trim($line))) continue;
                    
                    $row = str_getcsv($line);
                    
                    // Simple skip if row doesn't have enough columns
                    if (count($row) <= max(array_values($mappedIndexes))) {
                        $rowsIgnored++;
                        continue;
                    }

                    $record = [];
                    foreach ($mappedIndexes as $dbColumn => $index) {
                        $val = $row[$index] ?? null;
                        if ($dbColumn === 'survey_submitted_at' && $val) {
                            try {
                                $val = \Carbon\Carbon::parse($val)->toDateTimeString();
                            } catch (\Exception $e) {
                                $val = null;
                            }
                        }
                        $record[$dbColumn] = $val;
                    }
                    
                    $record['created_at'] = now();
                    $record['updated_at'] = now();

                    $insertData[] = $record;
                    $rowsImported++;
                }

                if (!empty($insertData)) {
                    if ($type === 'student') {
                        StudentInterest::insert($insertData);
                    } else {
                        IndustryRequirement::insert($insertData);
                    }
                }
            });
        } catch (\Exception $e) {
            return response()->json(['error' => 'Database transaction failed: ' . $e->getMessage()], 500);
        }

        // Trigger NLP Processing Pipeline Offline
        // Trigger NLP Processing Pipeline Offline for each program
        try {
            $courses = \App\Models\Course::all();
            foreach ($courses as $course) {
                $analytics = $nlpService->processAll($course);
                $recommendations = $recommendationEngine->generateRecommendations($analytics);

                $kpis = $analytics['kpis'] ?? [];
                $kpis['coverage_percent'] = $analytics['coverage_percent'] ?? 0;
                $kpis['missing_subjects'] = $analytics['missing_subjects'] ?? [];
                $kpis['outdated_subjects'] = $analytics['outdated_subjects'] ?? [];
                $kpis['low_demand_subjects'] = $analytics['low_demand_subjects'] ?? [];
                $kpis['learning_preferences_data'] = $analytics['learning_preferences_data'] ?? null;

                \App\AI\Models\AnalyticsCache::updateOrCreate(
                    ['scope_type' => 'program', 'scope_id' => $course->id],
                    [
                        'student_demand_distribution' => $analytics['student_demand_distribution'],
                        'industry_demand_distribution' => $analytics['industry_demand_distribution'],
                        'domain_frequency_counts' => $analytics['domain_frequency_counts'],
                        'emerging_technologies' => $analytics['emerging_technologies'] ?? [],
                        'skill_gaps' => $analytics['skill_gaps'] ?? [],
                        'jaccard_similarity_results' => $analytics['jaccard_similarity_results'] ?? [],
                        'kpis' => $kpis,
                        'generated_recommendations' => $recommendations,
                        'generated_at' => now(),
                    ]
                );
            }
        } catch (\Exception $e) {
            // Log but don't fail the entire import request
            \Log::error('NLP Pipeline failed during CSV Sync: ' . $e->getMessage());
        }

        $executionTime = round(microtime(true) - $startTime, 2);

        // 9. Detailed Response
        return response()->json([
            'message' => ucfirst($type) . ' Survey Imported Successfully',
            'type' => $type,
            'rows_imported' => $rowsImported,
            'rows_ignored' => $rowsIgnored,
            'execution_time_sec' => $executionTime,
            'status' => 'success'
        ]);
    }
}
