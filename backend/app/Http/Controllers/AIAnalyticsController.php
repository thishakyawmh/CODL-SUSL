<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\DB;
use App\Models\Course;
use App\Models\StudentInterest;
use App\Models\IndustryRequirement;

class AIAnalyticsController extends Controller
{
    /**
     * Get high level KPIs and distributions for the overview tab.
     */
    public function getOverview()
    {
        $coursesCount = Course::count();
        $studentSurveysCount = StudentInterest::count();
        $industrySurveysCount = IndustryRequirement::count();
        $surveysCount = $studentSurveysCount + $industrySurveysCount;
        $companiesCount = IndustryRequirement::distinct('company_name')->count();

        // Calculate student demand (top keywords in primary_field/emerging_fields)
        $studentSurveys = StudentInterest::all();
        $studentKeywords = [];
        foreach ($studentSurveys as $survey) {
            // Using primary_field as a proxy for skills/interest based on new schema
            $words = array_filter(explode(',', $survey->primary_field));
            foreach ($words as $word) {
                $word = trim($word);
                if (!empty($word)) {
                    $studentKeywords[$word] = ($studentKeywords[$word] ?? 0) + 1;
                }
            }
        }
        arsort($studentKeywords);
        $topStudentDemand = array_slice($studentKeywords, 0, 5, true);
        
        $studentDemandDistribution = [];
        $totalStudentKeywords = array_sum($studentKeywords) ?: 1;
        foreach ($topStudentDemand as $name => $count) {
            $studentDemandDistribution[] = [
                'name' => $name,
                'value' => round(($count / $totalStudentKeywords) * 100)
            ];
        }

        // Calculate industry demand
        $industrySurveys = IndustryRequirement::all();
        $industryKeywords = [];
        foreach ($industrySurveys as $survey) {
            $words = array_filter(explode(',', $survey->required_skills));
            foreach ($words as $word) {
                $word = trim($word);
                if (!empty($word)) {
                    $industryKeywords[$word] = ($industryKeywords[$word] ?? 0) + 1;
                }
            }
        }
        arsort($industryKeywords);
        $topIndustryDemand = array_slice($industryKeywords, 0, 5, true);

        $industryDemandDistribution = [];
        $totalIndustryKeywords = array_sum($industryKeywords) ?: 1;
        foreach ($topIndustryDemand as $name => $count) {
            $industryDemandDistribution[] = [
                'name' => $name,
                'value' => round(($count / $totalIndustryKeywords) * 100)
            ];
        }

        // Mock semantic match calculation based on available data presence
        $studentMatch = $coursesCount > 0 ? rand(60, 95) : 0;
        $industryMatch = $coursesCount > 0 ? rand(55, 90) : 0;
        $alignment = round(($studentMatch + $industryMatch) / 2);

        return response()->json([
            'kpis' => [
                'studentMatch' => $studentMatch,
                'industryMatch' => $industryMatch,
                'alignment' => $alignment,
                'courses' => $coursesCount,
                'surveys' => $surveysCount,
                'companies' => $companiesCount,
            ],
            'studentDemand' => count($studentDemandDistribution) > 0 ? $studentDemandDistribution : [['name' => 'Data needed', 'value' => 0]],
            'industryDemand' => count($industryDemandDistribution) > 0 ? $industryDemandDistribution : [['name' => 'Data needed', 'value' => 0]],
        ]);
    }

    /**
     * Get per-course breakdown against student interests.
     */
    public function getStudentInterest()
    {
        $courses = Course::all();
        $data = [];
        
        foreach ($courses as $course) {
            $match = rand(40, 95);
            $data[] = [
                'id' => $course->id,
                'name' => $course->title,
                'code' => $course->course_code ?? 'N/A',
                'match' => $match,
                'wellCovered' => ['Basic Concepts'], // MVP static data
                'missing' => $match < 70 ? ['Advanced Topics'] : [],
                'estimatedMatch' => min(100, $match + rand(5, 20)),
            ];
        }

        return response()->json($data);
    }

    /**
     * Get per-course breakdown against industry gaps.
     */
    public function getIndustryGap()
    {
        $courses = Course::all();
        $data = [];
        
        foreach ($courses as $course) {
            $coverage = rand(30, 90);
            $data[] = [
                'id' => $course->id,
                'name' => $course->title,
                'code' => $course->course_code ?? 'N/A',
                'coverage' => $coverage,
                'industryReqs' => ['Problem Solving'],
                'criticalGaps' => $coverage < 60 ? ['Modern Frameworks'] : [],
                'status' => $coverage >= 75 ? 'Optimal' : ($coverage >= 50 ? 'Review Needed' : 'Critical Update'),
            ];
        }

        return response()->json($data);
    }

    /**
     * Get AI recommendations.
     */
    public function getRecommendations()
    {
        $data = [
            [
                'id' => 1,
                'course' => 'System-wide Curriculum',
                'type' => 'critical',
                'title' => 'Integrate Cloud Computing',
                'description' => 'Multiple industry surveys indicate a strong demand for AWS and Azure skills which are currently missing across the board.',
                'impact' => '+15% Industry Match',
            ],
            [
                'id' => 2,
                'course' => 'Introduction to Programming',
                'type' => 'moderate',
                'title' => 'Update language focus',
                'description' => 'Students are heavily requesting Python and JavaScript over traditional legacy languages.',
                'impact' => '+10% Student Match',
            ]
        ];

        return response()->json($data);
    }

    /**
     * Fetch all survey responses.
     */
    public function getSurveys()
    {
        $studentSurveys = \App\Models\StudentInterest::orderBy('created_at', 'desc')->get()->map(function($item) {
            $item->type = 'student';
            return $item;
        });
        
        $industrySurveys = \App\Models\IndustryRequirement::orderBy('created_at', 'desc')->get()->map(function($item) {
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
            \App\Models\StudentInterest::create([
                'education_level' => $parsedData['education_level'] ?? 'Not Specified',
                'primary_field' => $parsedData['preferred_field'] ?? 'Various',
                'learning_preferences' => $parsedData['academic_practices'] ?? null,
                'emerging_fields' => $parsedData['emerging_fields'] ?? null,
                'new_program_suggestion' => $parsedData['new_program_recommendation'] ?? null,
            ]);
        } else {
            \App\Models\IndustryRequirement::create([
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
    public function syncGoogleSheet(Request $request)
    {
        $startTime = microtime(true);
        
        $request->validate([
            'type' => 'required|in:student,industry',
            'sheet_url' => 'required|url'
        ]);

        $type = $request->type;
        $url = $request->sheet_url;

        // 1. URL Rewriting
        // Convert /edit#gid=X or /edit?usp=sharing to /export?format=csv&gid=X
        if (preg_match('/\/d\/([a-zA-Z0-9-_]+)/', $url, $matches)) {
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
        $headers = array_map('trim', $headers);

        // 4. Configurable Mapping Dictionary
        $studentHeaderMap = [
            'Timestamp' => 'survey_submitted_at',
            'Current Education Level' => 'education_level',
            'Province' => 'province',
            'District' => 'district',
            'Which academic field(s) are you interested in studying at university?' => 'primary_field',
            'Secondary field of interest' => 'secondary_field',
            'Third field of interest' => 'third_field',
            'Specializations you want to pursue' => 'specializations',
            'Preferred learning methods' => 'learning_preferences',
            'Theory vs Practical (1-100)' => 'theory_practical_score',
            'Desired university opportunities' => 'university_opportunities',
            'Emerging fields to introduce' => 'emerging_fields',
            'New program suggestions' => 'new_program_suggestion',
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
                    StudentInterest::truncate();
                } else {
                    IndustryRequirement::truncate();
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
                        $record[$dbColumn] = $row[$index] ?? null;
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
