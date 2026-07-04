<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
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
     * Mock syncing Google Sheets.
     */
    public function syncGoogleSheet(Request $request)
    {
        $request->validate([
            'type' => 'required|in:student,industry',
            'url' => 'required|url'
        ]);

        // Simulating the extraction of data from Google Sheets API
        // For MVP we just add a dummy record.

        if ($request->type === 'student') {
            \App\Models\StudentInterest::create([
                'education_level' => 'Undergraduate',
                'primary_field' => 'Software Engineering',
                'specializations' => 'Cloud Computing',
                'learning_preferences' => 'Practical Labs',
                'theory_practical_score' => 80,
                'emerging_fields' => 'AI, Cloud',
            ]);
        } else {
            \App\Models\IndustryRequirement::create([
                'company_name' => 'Tech Corp Imported',
                'industry_sector' => 'IT Services',
                'organization_size' => 'Medium',
                'primary_academic_field' => 'Software Engineering',
                'required_skills' => 'Docker, Kubernetes, CI/CD',
                'graduate_skill_gaps' => 'Cloud Architecture',
            ]);
        }

        return response()->json(['message' => 'Google Sheet synced successfully. Found and imported new records.']);
    }
}
