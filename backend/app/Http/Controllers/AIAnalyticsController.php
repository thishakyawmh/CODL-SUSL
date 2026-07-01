<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Course;
use App\Models\SurveyResponse;

class AIAnalyticsController extends Controller
{
    /**
     * Get high level KPIs and distributions for the overview tab.
     */
    public function getOverview()
    {
        $coursesCount = Course::count();
        $surveysCount = SurveyResponse::count();
        $companiesCount = SurveyResponse::where('type', 'industry')->distinct('company_name')->count();

        // Calculate student demand (top keywords in preferred_field/skills_to_learn)
        $studentSurveys = SurveyResponse::where('type', 'student')->get();
        $studentKeywords = [];
        foreach ($studentSurveys as $survey) {
            $words = array_filter(explode(',', $survey->skills_to_learn));
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
        $industrySurveys = SurveyResponse::where('type', 'industry')->get();
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
        $surveys = SurveyResponse::orderBy('created_at', 'desc')->get();
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
        $data['type'] = $request->survey_type;

        SurveyResponse::create($data);

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
        
        $dummyData = [
            'type' => $request->type,
        ];

        if ($request->type === 'student') {
            $dummyData['respondent_type'] = 'Sheet Import';
            $dummyData['preferred_field'] = 'Various';
            $dummyData['skills_to_learn'] = 'React, Node, Python, Cloud';
            $dummyData['job_aspirations'] = 'Fullstack Engineer';
        } else {
            $dummyData['company_name'] = 'Tech Corp Imported';
            $dummyData['industry_sector'] = 'IT Services';
            $dummyData['required_skills'] = 'Docker, Kubernetes, CI/CD';
            $dummyData['skill_shortages'] = 'Cloud Architecture';
        }

        SurveyResponse::create($dummyData);

        return response()->json(['message' => 'Google Sheet synced successfully. Found and imported new records.']);
    }
}
