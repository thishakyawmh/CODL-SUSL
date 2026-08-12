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
        return response()->json([
            'programs' => $courses,
            'student_count' => \App\AI\Models\StudentInterest::count(),
            'industry_count' => \App\AI\Models\IndustryRequirement::count(),
        ]); 
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
            'coverage_percent' => isset($cache->kpis['coverage_percent']) ? $cache->kpis['coverage_percent'] : null,
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
            'coverage_percent' => isset($cache->kpis['coverage_percent']) ? $cache->kpis['coverage_percent'] : null,
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

    public function getGlobalOverview(AnalyticsNLPService $nlpService)
    {
        $analytics = $nlpService->processAll(null);
        $lastSync = \App\AI\Models\AnalyticsCache::orderBy('generated_at', 'desc')->first();
        $lastSyncTime = $lastSync ? $lastSync->generated_at->toIso8601String() : null;

        return response()->json([
            'emerging_technologies' => $analytics['emerging_technologies'] ?? [],
            'last_sync_at' => $lastSyncTime,
            'student_count' => \App\AI\Models\StudentInterest::count(),
            'industry_count' => \App\AI\Models\IndustryRequirement::count(),
            'education_levels' => \App\AI\Models\StudentInterest::select('education_level', \DB::raw('count(*) as count'))
                ->groupBy('education_level')
                ->get()
                ->map(function($item) {
                    return [
                        'name' => $item->education_level ?: 'Not Specified',
                        'value' => (int) $item->count
                    ];
                }),
            'districts' => \App\AI\Models\StudentInterest::select('district', \DB::raw('count(*) as count'))
                ->groupBy('district')
                ->get()
                ->map(function($item) {
                    return [
                        'name' => trim($item->district) ?: 'Not Specified',
                        'count' => (int) $item->count
                    ];
                })
        ]);
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
     * Get geography-based interest distribution for the interactive Sri Lanka map.
     * Returns weighted interest scores grouped by province → education_level.
     * Weights: primary × 1.0, secondary × 0.6, ternary × 0.3
     */
    public function getGeographyData()
    {
        $allRows = DB::connection('analytics')->table('student_interests')
            ->select('province', 'education_level', 'district',
                'primary_interest', 'secondary_interest', 'ternary_interest')
            ->whereNotNull('province')
            ->where('province', '!=', '')
            ->get();

        // Compute weighted interest scores per province+edu_level
        $byProvince = [];
        $allIsland = [];
        $districtCounts = [];
        $educationLevels = [];

        foreach ($allRows as $row) {
            $province = trim($row->province);
            $eduLevel = trim($row->education_level ?: 'Not Specified');
            $district = trim($row->district ?: '');

            // Track district counts for map coloring
            if ($district) {
                $districtCounts[$district] = ($districtCounts[$district] ?? 0) + 1;
            }

            // Track education level counts for pie chart
            $educationLevels[$eduLevel] = ($educationLevels[$eduLevel] ?? 0) + 1;

            $interests = [
                ['field' => $row->primary_interest,   'weight' => 1.0],
                ['field' => $row->secondary_interest,  'weight' => 0.6],
                ['field' => $row->ternary_interest,    'weight' => 0.3],
            ];

            foreach ($interests as $entry) {
                $field = trim($entry['field'] ?? '');
                if (!$field) continue;
                $w = $entry['weight'];

                // By province + edu level
                $byProvince[$province][$eduLevel][$field] = 
                    ($byProvince[$province][$eduLevel][$field] ?? 0) + $w;

                // All island
                $allIsland[$field] = ($allIsland[$field] ?? 0) + $w;
            }
        }

        // Sort and format province data
        $formattedProvince = [];
        foreach ($byProvince as $province => $eduLevels) {
            $formattedProvince[$province] = [];
            foreach ($eduLevels as $eduLevel => $fields) {
                arsort($fields);
                $top = array_slice($fields, 0, 5, true);
                $formattedProvince[$province][$eduLevel] = array_map(
                    fn($name, $score) => ['name' => $name, 'score' => round($score, 2)],
                    array_keys($top), array_values($top)
                );
            }
        }

        // Sort and format all-island data
        arsort($allIsland);
        $formattedAllIsland = array_map(
            fn($name, $score) => ['name' => $name, 'score' => round($score, 2)],
            array_keys($allIsland), array_values($allIsland)
        );

        // Format education levels for pie chart
        $formattedEducationLevels = [];
        foreach ($educationLevels as $name => $count) {
            $formattedEducationLevels[] = [
                'name' => $name,
                'value' => $count
            ];
        }

        // Get industry sector distribution
        $industrySectors = IndustryRequirement::select('industry_sector', \DB::raw('count(*) as count'))
            ->whereNotNull('industry_sector')
            ->where('industry_sector', '!=', '')
            ->groupBy('industry_sector')
            ->get()
            ->map(function($item) {
                return [
                    'name' => trim($item->industry_sector),
                    'value' => (int) $item->count
                ];
            })
            ->values()
            ->toArray();

        return response()->json([
            'by_province'     => $formattedProvince,
            'all_island'      => $formattedAllIsland,
            'district_counts' => $districtCounts,
            'education_levels' => $formattedEducationLevels,
            'industry_sectors' => $industrySectors,
        ]);
    }

    /**
     * Get top skills for a specific interest field, with optional province + education_level filters.
     * Skills are aggregated from primary/secondary/ternary_skills when the matching interest = the target field.
     */
    public function getGeographySkills(Request $request)
    {
        $field    = trim($request->query('field', ''));
        $province = trim($request->query('province', ''));
        $eduLevel = trim($request->query('education_level', ''));

        if (!$field) {
            return response()->json(['error' => 'field parameter is required'], 422);
        }

        $query = DB::connection('analytics')->table('student_interests')
            ->select('primary_interest', 'primary_skills',
                     'secondary_interest', 'secondary_skills',
                     'ternary_interest', 'ternary_skills');

        if ($province) {
            $query->where('province', $province);
        }
        if ($eduLevel) {
            $query->where('education_level', $eduLevel);
        }

        $rows = $query->get();

        $skillScores = [];

        foreach ($rows as $row) {
            // Accumulate skills when the matching interest equals the target field
            $pairs = [
                ['interest' => $row->primary_interest,   'skills' => $row->primary_skills,   'weight' => 1.0],
                ['interest' => $row->secondary_interest,  'skills' => $row->secondary_skills,  'weight' => 0.6],
                ['interest' => $row->ternary_interest,    'skills' => $row->ternary_skills,    'weight' => 0.3],
            ];

            foreach ($pairs as $pair) {
                if (trim($pair['interest'] ?? '') !== $field) continue;
                if (empty(trim($pair['skills'] ?? ''))) continue;

                // Skills stored as comma-separated values
                $skills = array_map('trim', explode(',', $pair['skills']));
                foreach ($skills as $skill) {
                    $skill = trim($skill);
                    if (!$skill) continue;
                    $skillScores[$skill] = ($skillScores[$skill] ?? 0) + $pair['weight'];
                }
            }
        }

        arsort($skillScores);
        $top = array_slice($skillScores, 0, 8, true);
        $total = array_sum($top) ?: 1;

        $result = array_map(function($name, $score) use ($total) {
            return [
                'name'       => $name,
                'score'      => round($score, 2),
                'percentage' => round(($score / $total) * 100, 1),
            ];
        }, array_keys($top), array_values($top));

        return response()->json([
            'field'  => $field,
            'skills' => $result,
        ]);
    }

    /**
     * Count university_opportunities values directly from student_interests.
     * Values are comma-separated in the column. No NLP — pure counting.
     */
    public function getUniversityOpportunities()
    {
        $rows = DB::connection('analytics')
            ->table('student_interests')
            ->whereNotNull('university_opportunities')
            ->where('university_opportunities', '!=', '')
            ->pluck('university_opportunities');

        $counts = [];
        foreach ($rows as $raw) {
            $items = array_map('trim', explode(',', $raw));
            foreach ($items as $item) {
                $item = trim($item);
                if (!$item) continue;
                $counts[$item] = ($counts[$item] ?? 0) + 1;
            }
        }

        arsort($counts);
        $total = array_sum($counts) ?: 1;

        $result = array_map(function ($name, $count) use ($total) {
            return [
                'name'       => $name,
                'count'      => $count,
                'percentage' => round(($count / $total) * 100, 1),
            ];
        }, array_keys($counts), array_values($counts));

        return response()->json(array_values($result));
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
        set_time_limit(300); // Allow up to 5 minutes for sync + AI pipeline
        $startTime = microtime(true);
        
        // If neither type nor sheet_url is provided, perform a dual sync using configured .env URLs
        if (!$request->has('type') && !$request->has('sheet_url') && !$request->has('url')) {
            $studentUrl = env('GOOGLE_SHEET_STUDENT_URL');
            $industryUrl = env('GOOGLE_SHEET_INDUSTRY_URL');

            if (!$studentUrl || !$industryUrl) {
                return response()->json(['error' => 'Google Sheets URLs are not fully configured in .env. Please set GOOGLE_SHEET_STUDENT_URL and GOOGLE_SHEET_INDUSTRY_URL.'], 422);
            }

            $studentResult = $this->executeSingleSync('student', $studentUrl);
            if (isset($studentResult['error'])) {
                return response()->json(['error' => 'Student Sync Failed: ' . $studentResult['error']], 500);
            }

            $industryResult = $this->executeSingleSync('industry', $industryUrl);
            if (isset($industryResult['error'])) {
                return response()->json(['error' => 'Industry Sync Failed: ' . $industryResult['error']], 500);
            }

            // Trigger Background NLP Processing Pipeline
            try {
                \App\Jobs\ProcessAnalyticsPipelineJob::dispatch();
            } catch (\Exception $e) {
                \Log::error('Failed to dispatch ProcessAnalyticsPipelineJob: ' . $e->getMessage());
            }

            return response()->json([
                'message' => 'Sync completed successfully for both Student and Industry sheets.',
                'student_imported' => $studentResult['imported'],
                'student_ignored' => $studentResult['ignored'],
                'industry_imported' => $industryResult['imported'],
                'industry_ignored' => $industryResult['ignored'],
                'execution_time_sec' => round(microtime(true) - $startTime, 2),
                'status' => 'success'
            ]);
        }

        // Legacy individual sheet sync path
        if (!$request->has('sheet_url') && $request->has('url')) {
            $request->merge(['sheet_url' => $request->input('url')]);
        }

        $request->validate([
            'type' => 'required|in:student,industry',
            'sheet_url' => 'required|url'
        ]);

        $singleResult = $this->executeSingleSync($request->type, $request->sheet_url);
        if (isset($singleResult['error'])) {
            return response()->json(['error' => $singleResult['error']], 500);
        }

        // Trigger Background NLP Processing Pipeline
        try {
            \App\Jobs\ProcessAnalyticsPipelineJob::dispatch();
        } catch (\Exception $e) {
            \Log::error('Failed to dispatch ProcessAnalyticsPipelineJob: ' . $e->getMessage());
        }

        return response()->json([
            'message' => ucfirst($request->type) . ' Survey Imported Successfully',
            'type' => $request->type,
            'rows_imported' => $singleResult['imported'],
            'rows_ignored' => $singleResult['ignored'],
            'execution_time_sec' => round(microtime(true) - $startTime, 2),
            'status' => 'success'
        ]);
    }

    private function executeSingleSync($type, $url)
    {
        // 1. URL Rewriting
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
            return ['error' => 'Invalid Google Sheets URL format.'];
        }

        // 2. HTTP Fetch
        try {
            $response = Http::get($csvUrl);
            if (!$response->successful()) {
                return ['error' => 'Failed to download CSV from Google Sheets. Make sure the sheet is public.'];
            }
            $csvData = $response->body();
        } catch (\Exception $e) {
            return ['error' => 'HTTP request failed: ' . $e->getMessage()];
        }

        // 3. Parsing CSV using native stream to handle multi-line fields correctly
        $tempStream = fopen('php://temp', 'r+');
        fwrite($tempStream, $csvData);
        rewind($tempStream);
        
        $allRows = [];
        while (($row = fgetcsv($tempStream, 0, ',', '"', '\\')) !== false) {
            if (empty($row) || (count($row) === 1 && $row[0] === null)) {
                continue;
            }
            $allRows[] = $row;
        }
        fclose($tempStream);

        if (count($allRows) < 2) {
            return ['error' => 'CSV file is empty or only contains headers.'];
        }

        $headers = array_shift($allRows);
        $headers = array_map(function($h) {
            return trim(preg_replace('/\s+/', ' ', $h));
        }, $headers);

        // 4. Configurable Mapping Dictionary
        $studentHeaderMap = [
            'Timestamp' => 'survey_submitted_at',
            'Email' => 'email',
            'WhatsApp' => 'whatsapp',
            'Education Level' => 'education_level',
            'Province' => 'province',
            'District' => 'district',
            'Primary Interest' => 'primary_interest',
            'Primary Skills' => 'primary_skills',
            'Primary Teaching Methods' => 'primary_learning_methods',
            'Primary Learning Balance' => 'primary_learning_balance',
            'Secondary Interest' => 'secondary_interest',
            'Secondary Skills' => 'secondary_skills',
            'Secondary Teaching Methods' => 'secondary_learning_methods',
            'Secondary Learning Balance' => 'secondary_learning_balance',
            'Ternary Interest' => 'ternary_interest',
            'Ternary Skills' => 'ternary_skills',
            'Ternary Teaching Methods' => 'ternary_learning_methods',
            'Ternary Learning Balance' => 'ternary_learning_balance',
            'University Opportunities' => 'university_opportunities',
            'New Program Suggestion' => 'new_program_suggestion',
        ];

        $industryHeaderMap = [
            'Timestamp' => 'survey_submitted_at',
            'Organization / Company Name' => 'company_name',
            'Industry Sector' => 'industry_sector',
            'Organization Size' => 'organization_size',
            'Primary academic field recruited' => 'primary_academic_field',
            'Primary Academic Domain of Interest' => 'primary_academic_field',
            'Secondary academic field recruited' => 'secondary_academic_field',
            'Sub disciplines' => 'secondary_academic_field',
            'Third academic field recruited' => 'third_academic_field',
            'Soft skills needed' => 'third_academic_field',
            'Required skills' => 'required_skills',
            'Tech stacks / Specialized Areas Needed' => 'required_skills',
            'Academic practices required' => 'academic_practices',
            'Training Practices Requested' => 'academic_practices',
            'Minimum qualification' => 'minimum_qualification',
            'Minimum education required' => 'minimum_qualification',
            'Minimum degree result' => 'minimum_degree_result',
            'Minimum expected GPA/result class' => 'minimum_degree_result',
            'Certification importance (1-5)' => 'certification_importance',
            'Importance value on professional credentials' => 'certification_importance',
            'Emerging fields to introduce' => 'emerging_fields',
            'New program suggestions' => 'new_program_suggestion',
            'Direct suggestions for new degree programs' => 'new_program_suggestion',
            'Graduate skill gaps' => 'graduate_skill_gaps',
            'Identified Capability deficits in recent graduates' => 'graduate_skill_gaps',
            'Additional recommendations' => 'additional_recommendations',
        ];

        $mapToUse = $type === 'student' ? $studentHeaderMap : $industryHeaderMap;
        $requiredColumns = $type === 'student' ? ['education_level', 'primary_interest'] : ['industry_sector', 'primary_academic_field'];
        
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
                    if (str_contains($cleanHeader, 'primaryacademic') && $dbColumn === 'primary_academic_field') { $mappedIndexes[$dbColumn] = $index; break; }
                    if (str_contains($cleanHeader, 'subdiscipline') && $dbColumn === 'secondary_academic_field') { $mappedIndexes[$dbColumn] = $index; break; }
                    if (str_contains($cleanHeader, 'softskill') && $dbColumn === 'third_academic_field') { $mappedIndexes[$dbColumn] = $index; break; }
                    if (str_contains($cleanHeader, 'techstack') && $dbColumn === 'required_skills') { $mappedIndexes[$dbColumn] = $index; break; }
                    if (str_contains($cleanHeader, 'trainingpractice') && $dbColumn === 'academic_practices') { $mappedIndexes[$dbColumn] = $index; break; }
                    if (str_contains($cleanHeader, 'mineducation') && $dbColumn === 'minimum_qualification') { $mappedIndexes[$dbColumn] = $index; break; }
                    if (str_contains($cleanHeader, 'mingpa') && $dbColumn === 'minimum_degree_result') { $mappedIndexes[$dbColumn] = $index; break; }
                    if (str_contains($cleanHeader, 'credentialimportance') && $dbColumn === 'certification_importance') { $mappedIndexes[$dbColumn] = $index; break; }
                    if (str_contains($cleanHeader, 'newprogram') && $dbColumn === 'new_program_suggestion') { $mappedIndexes[$dbColumn] = $index; break; }
                    if (str_contains($cleanHeader, 'capabilitydeficit') && $dbColumn === 'graduate_skill_gaps') { $mappedIndexes[$dbColumn] = $index; break; }
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
            return ['error' => 'Missing required columns in Google Sheet based on mapping: ' . implode(', ', $missingColumns)];
        }

        // 6: Wrap Upsert in Transaction
        $rowsImported = 0;
        $rowsIgnored = 0;

        try {
            DB::connection('analytics')->transaction(function () use ($allRows, $mappedIndexes, $type, $requiredColumns, &$rowsImported, &$rowsIgnored) {
                $processedIds = [];
                
                foreach ($allRows as $row) {
                    // Simple skip if row doesn't have enough columns
                    if (count($row) <= max(array_values($mappedIndexes))) {
                        $rowsIgnored++;
                        continue;
                    }

                    // Check if required columns are present and not empty
                    $hasRequired = true;
                    foreach ($requiredColumns as $reqCol) {
                        $colIdx = $mappedIndexes[$reqCol] ?? null;
                        if ($colIdx === null || !isset($row[$colIdx]) || trim($row[$colIdx]) === '') {
                            $hasRequired = false;
                            break;
                        }
                    }

                    if (!$hasRequired) {
                        $rowsIgnored++;
                        continue;
                    }

                    $record = [];
                    foreach ($mappedIndexes as $dbColumn => $index) {
                        $val = $row[$index] ?? null;
                        if ($val === '') {
                            $val = null;
                        }
                        if ($dbColumn === 'survey_submitted_at' && $val) {
                            try {
                                $val = \Carbon\Carbon::parse($val)->toDateTimeString();
                            } catch (\Exception $e) {
                                $val = null;
                            }
                        }

                        // Convert student learning balance strings to tinyint (1-5)
                        if (in_array($dbColumn, ['primary_learning_balance', 'secondary_learning_balance', 'ternary_learning_balance']) && $val) {
                            if (is_numeric($val)) {
                                $val = (int) $val;
                            } else {
                                $b = strtolower(trim($val));
                                if (str_contains($b, 'balanced')) {
                                    $val = 3;
                                } elseif (str_contains($b, 'mostly practical') || str_contains($b, 'practical oriented')) {
                                    $val = 4;
                                } elseif (str_contains($b, 'mostly theory') || str_contains($b, 'theory oriented')) {
                                    $val = 2;
                                } elseif (str_contains($b, 'practical')) {
                                    $val = 5;
                                } elseif (str_contains($b, 'theory')) {
                                    $val = 1;
                                } else {
                                    $val = 3;
                                }
                            }
                        }

                        // Convert industry certification importance strings/numbers to tinyint (1-5)
                        if ($dbColumn === 'certification_importance' && $val) {
                            if (is_numeric($val)) {
                                $val = (int) $val;
                            } else {
                                $b = strtolower(trim($val));
                                if (str_contains($b, 'very') || str_contains($b, 'critical') || str_contains($b, 'high')) {
                                    $val = 5;
                                } elseif (str_contains($b, 'important')) {
                                    $val = 4;
                                } elseif (str_contains($b, 'neutral') || str_contains($b, 'medium')) {
                                    $val = 3;
                                } elseif (str_contains($b, 'low') || str_contains($b, 'not')) {
                                    $val = 2;
                                } else {
                                    $val = 1;
                                }
                            }
                        }

                        $record[$dbColumn] = $val;
                    }
                    
                    // Perform validation on the parsed record
                    if ($type === 'student') {
                        $validator = \Illuminate\Support\Facades\Validator::make($record, [
                            'email' => 'nullable|email',
                            'education_level' => 'required|string',
                            'province' => 'required|string',
                            'district' => 'required|string',
                            'primary_interest' => 'required|string',
                            'primary_skills' => 'required|string',
                        ]);
                    } else {
                        $validator = \Illuminate\Support\Facades\Validator::make($record, [
                            'company_name' => 'required|string',
                            'industry_sector' => 'required|string',
                            'primary_academic_field' => 'required|string',
                            'required_skills' => 'required|string',
                        ]);
                    }

                    if ($validator->fails()) {
                        $rowsIgnored++;
                        continue;
                    }
                    
                    $record['created_at'] = now();
                    $record['updated_at'] = now();

                    if ($type === 'student') {
                        $matchAttributes = [
                            'survey_submitted_at' => $record['survey_submitted_at']
                        ];
                        if (!empty($record['email'])) {
                            $matchAttributes['email'] = $record['email'];
                        } elseif (!empty($record['whatsapp'])) {
                            $matchAttributes['whatsapp'] = $record['whatsapp'];
                        } else {
                            $matchAttributes['education_level'] = $record['education_level'];
                            $matchAttributes['province'] = $record['province'];
                            $matchAttributes['district'] = $record['district'];
                        }
                        $model = StudentInterest::updateOrCreate($matchAttributes, $record);
                        $processedIds[] = $model->id;
                    } else {
                        $matchAttributes = [
                            'survey_submitted_at' => $record['survey_submitted_at'],
                            'company_name' => $record['company_name']
                        ];
                        $model = IndustryRequirement::updateOrCreate($matchAttributes, $record);
                        $processedIds[] = $model->id;
                    }

                    $rowsImported++;
                }

                // Delete missing surveys (Mirror Sync) to reflect manually deleted rows from Google Sheet
                if ($type === 'student') {
                    StudentInterest::whereNotIn('id', $processedIds)->delete();
                } else {
                    IndustryRequirement::whereNotIn('id', $processedIds)->delete();
                }
            });
        } catch (\Exception $e) {
            return ['error' => 'Database transaction failed: ' . $e->getMessage()];
        }

        return [
            'imported' => $rowsImported,
            'ignored' => $rowsIgnored
        ];
    }

    public function getCommonOverview(AnalyticsNLPService $nlpService)
    {
        $surveys = StudentInterest::all();
        $totalSurveysCount = $surveys->count();

        if ($totalSurveysCount === 0) {
            return response()->json([
                'total_surveys' => 0,
                'provinces_data' => [],
                'overall_demand' => [],
                'high_demand_skills' => [],
                'opportunities' => [],
                'learning_methods' => [],
                'learning_balance' => []
            ]);
        }

        // 1. Student Interests by Province
        $provincesData = [];
        $groupedByProvince = $surveys->groupBy('province');
        foreach ($groupedByProvince as $provinceName => $provinceSurveys) {
            if (empty($provinceName)) continue;
            
            $fieldScores = [];
            foreach ($provinceSurveys as $survey) {
                if ($survey->primary_interest) {
                    $fieldScores[$survey->primary_interest] = ($fieldScores[$survey->primary_interest] ?? 0) + 1.0;
                }
                if ($survey->secondary_interest) {
                    $fieldScores[$survey->secondary_interest] = ($fieldScores[$survey->secondary_interest] ?? 0) + 0.6;
                }
                if ($survey->ternary_interest) {
                    $fieldScores[$survey->ternary_interest] = ($fieldScores[$survey->ternary_interest] ?? 0) + 0.3;
                }
            }
            
            $totalWeightedScore = array_sum($fieldScores);
            if ($totalWeightedScore === 0) continue;
            
            arsort($fieldScores);
            
            $topFields = [];
            $rank = 1;
            foreach (array_slice($fieldScores, 0, 3, true) as $field => $score) {
                $topFields[] = [
                    'province' => $provinceName,
                    'field' => $field,
                    'count' => round($score, 1),
                    'percentage' => round(($score / $totalWeightedScore) * 100, 1),
                    'rank' => $rank++
                ];
            }
            
            $provincesData[$provinceName] = $topFields;
        }

        // 2. Overall Student Demand by Academic Field
        $overallScores = [];
        foreach ($surveys as $survey) {
            if ($survey->primary_interest) {
                $overallScores[$survey->primary_interest] = ($overallScores[$survey->primary_interest] ?? 0) + 1.0;
            }
            if ($survey->secondary_interest) {
                $overallScores[$survey->secondary_interest] = ($overallScores[$survey->secondary_interest] ?? 0) + 0.6;
            }
            if ($survey->ternary_interest) {
                $overallScores[$survey->ternary_interest] = ($overallScores[$survey->ternary_interest] ?? 0) + 0.3;
            }
        }
        
        arsort($overallScores);
        $overallTotal = array_sum($overallScores) ?: 1;
        $topFields = array_slice($overallScores, 0, 6, true);
        $remaining = array_slice($overallScores, 6, null, true);
        
        $overallData = [];
        foreach ($topFields as $field => $score) {
            $overallData[] = [
                'name' => $field,
                'count' => round($score, 1),
                'value' => round(($score / $overallTotal) * 100, 1)
            ];
        }
        
        if (count($remaining) > 0) {
            $otherScore = array_sum($remaining);
            $overallData[] = [
                'name' => 'Other',
                'count' => round($otherScore, 1),
                'value' => round(($otherScore / $overallTotal) * 100, 1)
            ];
        }

        // 3. High-Demand Skills (Emerging Skills Demand)
        $skillScores = [];
        foreach ($surveys as $survey) {
            if ($survey->primary_skills) {
                $domains = $nlpService->extractDomains($survey->primary_skills);
                foreach ($domains as $d) {
                    $skillScores[$d] = ($skillScores[$d] ?? 0) + 1.0;
                }
            }
            if ($survey->secondary_skills) {
                $domains = $nlpService->extractDomains($survey->secondary_skills);
                foreach ($domains as $d) {
                    $skillScores[$d] = ($skillScores[$d] ?? 0) + 0.6;
                }
            }
            if ($survey->ternary_skills) {
                $domains = $nlpService->extractDomains($survey->ternary_skills);
                foreach ($domains as $d) {
                    $skillScores[$d] = ($skillScores[$d] ?? 0) + 0.3;
                }
            }
        }
        
        arsort($skillScores);
        $skillsTotal = array_sum($skillScores) ?: 1;
        
        $highDemandSkills = [];
        $rank = 1;
        foreach (array_slice($skillScores, 0, 10, true) as $skill => $score) {
            $highDemandSkills[] = [
                'name' => $skill,
                'count' => round($score, 1),
                'percentage' => round(($score / $skillsTotal) * 100, 1),
                'rank' => $rank++
            ];
        }

        // 4. University Opportunities Themes
        $oppList = [];
        foreach ($surveys as $survey) {
            if ($survey->university_opportunities) {
                $items = array_map('trim', explode(',', $survey->university_opportunities));
                foreach ($items as $item) {
                    if (!empty($item)) {
                        $oppList[] = $item;
                    }
                }
            }
        }
        
        $oppCounts = array_count_values($oppList);
        arsort($oppCounts);
        $oppTotal = array_sum($oppCounts) ?: 1;
        
        $opportunitiesData = [];
        foreach (array_slice($oppCounts, 0, 10, true) as $opp => $count) {
            $opportunitiesData[] = [
                'name' => $opp,
                'count' => $count,
                'percentage' => round(($count / $oppTotal) * 100, 1)
            ];
        }

        // 5. Learning Preferences
        // A. Preferred Learning Methods
        $methodList = [];
        foreach ($surveys as $survey) {
            $methodsText = implode(',', array_filter([$survey->primary_learning_methods, $survey->secondary_learning_methods, $survey->ternary_learning_methods]));
            if ($methodsText) {
                $methods = array_map('trim', explode(',', $methodsText));
                foreach ($methods as $m) {
                    if (!empty($m)) {
                        $methodList[] = $m;
                    }
                }
            }
        }
        
        $methodCounts = array_count_values($methodList);
        arsort($methodCounts);
        $methodTotal = array_sum($methodCounts) ?: 1;
        
        $learningMethods = [];
        foreach (array_slice($methodCounts, 0, 10, true) as $method => $count) {
            $learningMethods[] = [
                'name' => $method,
                'count' => $count,
                'percentage' => round(($count / $methodTotal) * 100, 1)
            ];
        }

        // B. Learning Balance distribution
        $balanceScores = [];
        foreach ($surveys as $survey) {
            if ($survey->primary_learning_balance !== null) {
                $balanceScores[] = (int) $survey->primary_learning_balance;
            }
            if ($survey->secondary_learning_balance !== null) {
                $balanceScores[] = (int) $survey->secondary_learning_balance;
            }
            if ($survey->ternary_learning_balance !== null) {
                $balanceScores[] = (int) $survey->ternary_learning_balance;
            }
        }
        
        $balanceCounts = [1 => 0, 2 => 0, 3 => 0, 4 => 0, 5 => 0];
        foreach ($balanceScores as $val) {
            if (isset($balanceCounts[$val])) {
                $balanceCounts[$val]++;
            }
        }
        
        $balanceTotal = array_sum($balanceCounts) ?: 1;
        $learningBalance = [];
        $labels = [
            1 => '1 (100% Theory)',
            2 => '2 (Mostly Theory)',
            3 => '3 (Balanced)',
            4 => '4 (Mostly Practical)',
            5 => '5 (100% Practical)'
        ];
        foreach ($balanceCounts as $val => $count) {
            $learningBalance[] = [
                'label' => $labels[$val],
                'count' => $count,
                'percentage' => round(($count / $balanceTotal) * 100, 1)
            ];
        }

        return response()->json([
            'total_surveys' => $totalSurveysCount,
            'provinces_data' => $provincesData,
            'overall_demand' => $overallData,
            'high_demand_skills' => $highDemandSkills,
            'opportunities' => $opportunitiesData,
            'learning_methods' => $learningMethods,
            'learning_balance' => $learningBalance
        ]);
    }

    public function getCommonDrilldown(Request $request, AnalyticsNLPService $nlpService)
    {
        $field = $request->input('field');
        if (empty($field)) {
            return response()->json(['error' => 'Field parameter is required.'], 400);
        }
        
        $surveys = StudentInterest::all();
        
        $skillScores = [];
        foreach ($surveys as $survey) {
            $interestWeight = 0.0;
            if ($survey->primary_interest === $field) {
                $interestWeight = 1.0;
            } elseif ($survey->secondary_interest === $field) {
                $interestWeight = 0.6;
            } elseif ($survey->ternary_interest === $field) {
                $interestWeight = 0.3;
            }
            
            if ($interestWeight === 0.0) continue;
            
            if ($survey->primary_skills) {
                $domains = $nlpService->extractDomains($survey->primary_skills);
                foreach ($domains as $d) {
                    $skillScores[$d] = ($skillScores[$d] ?? 0) + (1.0 * $interestWeight);
                }
            }
            if ($survey->secondary_skills) {
                $domains = $nlpService->extractDomains($survey->secondary_skills);
                foreach ($domains as $d) {
                    $skillScores[$d] = ($skillScores[$d] ?? 0) + (0.6 * $interestWeight);
                }
            }
            if ($survey->ternary_skills) {
                $domains = $nlpService->extractDomains($survey->ternary_skills);
                foreach ($domains as $d) {
                    $skillScores[$d] = ($skillScores[$d] ?? 0) + (0.3 * $interestWeight);
                }
            }
        }
        
        arsort($skillScores);
        $skillsTotal = array_sum($skillScores) ?: 1;
        
        $drilldownData = [];
        foreach (array_slice($skillScores, 0, 10, true) as $skill => $score) {
            $drilldownData[] = [
                'name' => $skill,
                'count' => round($score, 1),
                'value' => round(($score / $skillsTotal) * 100, 1)
            ];
        }
        
        return response()->json($drilldownData);
    }

    public function exportCSV($courseId)
    {
        $cache = $this->getCacheForCourse($courseId);
        if (!$cache) {
            return response()->json(['error' => 'No cached analytics found for this program.'], 404);
        }

        $course = Course::find($courseId);
        $courseTitle = $course ? str_replace(' ', '_', $course->title) : 'Course_' . $courseId;

        $headers = [
            "Content-type"        => "text/csv",
            "Content-Disposition" => "attachment; filename=AI_Analytics_{$courseTitle}.csv",
            "Pragma"              => "no-cache",
            "Cache-Control"       => "must-revalidate, post-check=0, pre-check=0",
            "Expires"             => "0"
        ];

        $callback = function() use ($cache) {
            $file = fopen('php://output', 'w');
            
            // Header information
            fputcsv($file, ['CODL-SUSL AI Analytics Export']);
            fputcsv($file, ['Generated At', $cache->generated_at ? $cache->generated_at->toDateTimeString() : '']);
            fputcsv($file, []);

            // KPIs
            fputcsv($file, ['KPI Key', 'KPI Value']);
            if (is_array($cache->kpis)) {
                foreach ($cache->kpis as $k => $v) {
                    if (is_array($v)) $v = implode(', ', $v);
                    fputcsv($file, [$k, $v]);
                }
            }
            fputcsv($file, []);

            // Emerging Tech
            fputcsv($file, ['Emerging Technologies']);
            if (is_array($cache->emerging_technologies)) {
                foreach ($cache->emerging_technologies as $tech) {
                    fputcsv($file, [$tech]);
                }
            }
            fputcsv($file, []);

            // Skill Gaps
            fputcsv($file, ['Skill Gaps']);
            if (is_array($cache->skill_gaps)) {
                foreach ($cache->skill_gaps as $gap) {
                    fputcsv($file, [$gap]);
                }
            }
            fputcsv($file, []);

            // Recommendations
            fputcsv($file, ['Recommendation Type', 'Recommendation Subject', 'Recommendation Text']);
            if (is_array($cache->generated_recommendations)) {
                foreach ($cache->generated_recommendations as $rec) {
                    fputcsv($file, [
                        $rec['recommendation_type'] ?? '',
                        $rec['recommendation_subject'] ?? '',
                        $rec['recommendation_text'] ?? ''
                    ]);
                }
            }

            fclose($file);
        };

        return response()->stream($callback, 200, $headers);
    }
}
