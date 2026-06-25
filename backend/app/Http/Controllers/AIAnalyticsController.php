<?php

namespace App\Http\Controllers;

use App\Models\Course;
use App\Models\StudentInterest;
use App\Models\IndustryRequirement;
use App\Models\RecommendationRule;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

class AIAnalyticsController extends Controller
{
    // Local Dictionary of Standard Skills & Synonyms
    private $dictionary = [
        'DevOps' => ['docker', 'kubernetes', 'ci/cd', 'jenkins', 'devops', 'terraform', 'ansible', 'container'],
        'Artificial Intelligence' => ['ai', 'machine learning', 'ml', 'deep learning', 'neural', 'pytorch', 'tensorflow', 'artificial intelligence'],
        'Cloud Computing' => ['cloud', 'aws', 'azure', 'gcp', 'serverless', 'amazon web services'],
        'Mobile Development' => ['android', 'ios', 'swift', 'kotlin', 'flutter', 'react native'],
        'Cyber Security' => ['security', 'cybersecurity', 'cryptography', 'ethical hacking', 'firewall'],
        'Data Science' => ['data science', 'data analytics', 'pandas', 'numpy', 'sql', 'power bi'],
        'Web Development' => ['react', 'node', 'javascript', 'typescript', 'laravel', 'html', 'css', 'frontend', 'backend']
    ];

    private $stopWords = ['and', 'the', 'want', 'learn', 'should', 'with', 'would', 'also', 'about', 'a', 'to', 'for', 'in', 'of', 'on', 'or', 'is', 'i'];

    /**
     * Parse survey text and map it to standardized skills in dictionary
     */
    private function extractSkills($text): array
    {
        if (empty($text)) return [];
        $text = strtolower(preg_replace('/[^a-zA-Z0-9\s]/', ' ', $text));
        $tokens = array_filter(explode(' ', $text));
        
        $matched = [];
        foreach ($this->dictionary as $skillDomain => $synonyms) {
            foreach ($synonyms as $synonym) {
                if (str_contains($text, $synonym)) {
                    $matched[] = $skillDomain;
                    break;
                }
            }
        }
        return array_unique($matched);
    }

    public function getOverview()
    {
        $courses = Course::with('subjects')->get();
        $studentInterests = StudentInterest::all();
        $industryRequirements = IndustryRequirement::all();

        // 1. Calculate overall counts
        $totalResponses = $studentInterests->count();
        $totalCompanies = $industryRequirements->count();
        $totalCourses = $courses->count();

        // 2. Extract demands
        $studentDemand = [];
        foreach ($studentInterests as $si) {
            $skills = $this->extractSkills($si->skills_to_learn . ' ' . $si->preferred_field);
            foreach ($skills as $s) {
                $studentDemand[$s] = ($studentDemand[$s] ?? 0) + 1;
            }
        }
        
        $industryDemand = [];
        foreach ($industryRequirements as $ir) {
            $skills = $this->extractSkills($ir->required_skills . ' ' . $ir->skill_shortages . ' ' . $ir->emerging_technologies);
            foreach ($skills as $s) {
                $industryDemand[$s] = ($industryDemand[$s] ?? 0) + 1;
            }
        }

        // Convert counts to percent
        $studentPercentages = [];
        foreach ($studentDemand as $skill => $count) {
            $studentPercentages[] = ['name' => $skill, 'value' => round(($count / max(1, $totalResponses)) * 100)];
        }
        
        $industryPercentages = [];
        foreach ($industryDemand as $skill => $count) {
            $industryPercentages[] = ['name' => $skill, 'value' => round(($count / max(1, $totalCompanies)) * 100)];
        }

        // Calculate alignments
        $overallStudentMatchSum = 0;
        $overallIndustryMatchSum = 0;
        
        foreach ($courses as $c) {
            $courseSkills = [];
            foreach ($c->subjects as $sub) {
                $courseSkills = array_merge($courseSkills, $this->extractSkills($sub->name));
            }
            $courseSkills = array_unique($courseSkills);

            // Jaccard similarity with top student skills (skills mentioned > 20%)
            $topStudentSkills = array_keys(array_filter($studentDemand, function($c) use ($totalResponses) { return ($c / max(1, $totalResponses)) >= 0.20; }));
            $topIndustrySkills = array_keys(array_filter($industryDemand, function($c) use ($totalCompanies) { return ($c / max(1, $totalCompanies)) >= 0.20; }));

            $overallStudentMatchSum += $this->calculateJaccard($courseSkills, $topStudentSkills);
            $overallIndustryMatchSum += $this->calculateJaccard($courseSkills, $topIndustrySkills);
        }

        $avgStudentMatch = round($overallStudentMatchSum / max(1, $totalCourses));
        $avgIndustryMatch = round($overallIndustryMatchSum / max(1, $totalCourses));
        $avgAlignment = round(($avgStudentMatch + $avgIndustryMatch) / 2);

        return response()->json([
            'kpis' => [
                'studentMatch' => $avgStudentMatch,
                'industryMatch' => $avgIndustryMatch,
                'alignment' => $avgAlignment,
                'courses' => $totalCourses,
                'surveys' => $totalResponses,
                'companies' => $totalCompanies
            ],
            'studentDemand' => $studentPercentages,
            'industryDemand' => $industryPercentages,
        ]);
    }

    private function calculateJaccard(array $setA, array $setB): float
    {
        if (empty($setA) || empty($setB)) return 0;
        $intersection = count(array_intersect($setA, $setB));
        $union = count(array_unique(array_merge($setA, $setB)));
        return ($intersection / $union) * 100;
    }

    public function getStudentInterest()
    {
        $courses = Course::with('subjects')->get();
        $studentInterests = StudentInterest::all();
        $totalResponses = max(1, $studentInterests->count());

        // Extract skills list
        $studentDemand = [];
        foreach ($studentInterests as $si) {
            $skills = $this->extractSkills($si->skills_to_learn . ' ' . $si->preferred_field);
            foreach ($skills as $s) {
                $studentDemand[$s] = ($studentDemand[$s] ?? 0) + 1;
            }
        }
        $topStudentSkills = array_keys(array_filter($studentDemand, function($c) use ($totalResponses) { return ($c / $totalResponses) >= 0.20; }));

        $data = [];
        foreach ($courses as $c) {
            $courseSkills = [];
            foreach ($c->subjects as $sub) {
                $courseSkills = array_merge($courseSkills, $this->extractSkills($sub->name));
            }
            $courseSkills = array_unique($courseSkills);

            $match = round($this->calculateJaccard($courseSkills, $topStudentSkills));
            $wellCovered = array_intersect($courseSkills, $topStudentSkills);
            $missing = array_diff($topStudentSkills, $courseSkills);

            // Estimate Improvement: if missing subjects are added
            $simulatedSkills = array_unique(array_merge($courseSkills, $topStudentSkills));
            $estimatedMatch = round($this->calculateJaccard($simulatedSkills, $topStudentSkills));

            $data[] = [
                'id' => $c->id,
                'name' => $c->title,
                'code' => $c->code,
                'match' => $match,
                'wellCovered' => array_values($wellCovered),
                'missing' => array_values($missing),
                'estimatedMatch' => $estimatedMatch
            ];
        }

        return response()->json($data);
    }

    public function getIndustryGap()
    {
        $courses = Course::with('subjects')->get();
        $industryRequirements = IndustryRequirement::all();
        $totalCompanies = max(1, $industryRequirements->count());

        $industryDemand = [];
        foreach ($industryRequirements as $ir) {
            $skills = $this->extractSkills($ir->required_skills . ' ' . $ir->skill_shortages);
            foreach ($skills as $s) {
                $industryDemand[$s] = ($industryDemand[$s] ?? 0) + 1;
            }
        }
        $topIndustrySkills = array_keys(array_filter($industryDemand, function($c) use ($totalCompanies) { return ($c / $totalCompanies) >= 0.20; }));

        $data = [];
        foreach ($courses as $c) {
            $courseSkills = [];
            foreach ($c->subjects as $sub) {
                $courseSkills = array_merge($courseSkills, $this->extractSkills($sub->name));
            }
            $courseSkills = array_unique($courseSkills);

            $match = round($this->calculateJaccard($courseSkills, $topIndustrySkills));
            $wellCovered = array_intersect($courseSkills, $topIndustrySkills);
            $missing = array_diff($topIndustrySkills, $courseSkills);

            $data[] = [
                'id' => $c->id,
                'name' => $c->title,
                'code' => $c->code,
                'match' => $match,
                'wellCovered' => array_values($wellCovered),
                'missing' => array_values($missing)
            ];
        }

        return response()->json([
            'courses' => $data,
            'criticalShortages' => $topIndustrySkills
        ]);
    }

    public function getRecommendations()
    {
        $courses = Course::with('subjects')->get();
        $rules = RecommendationRule::all();
        $studentInterests = StudentInterest::all();
        $industryRequirements = IndustryRequirement::all();

        $totalSurveys = $studentInterests->count() + $industryRequirements->count();
        if ($totalSurveys === 0) return response()->json([]);

        // Build combined survey texts
        $surveyTexts = [];
        foreach ($studentInterests as $si) {
            $surveyTexts[] = $si->skills_to_learn . ' ' . $si->preferred_field . ' ' . $si->career_interests;
        }
        foreach ($industryRequirements as $ir) {
            $surveyTexts[] = $ir->required_skills . ' ' . $ir->skill_shortages . ' ' . $ir->emerging_technologies;
        }

        $recommendations = [];

        foreach ($rules as $rule) {
            // 1. Scan trigger regex
            $triggerCount = 0;
            foreach ($surveyTexts as $text) {
                if (preg_match($rule->trigger_skill_pattern, $text)) {
                    $triggerCount++;
                }
            }
            $matchPercent = round(($triggerCount / max(1, $totalSurveys)) * 100);

            // 2. Evaluate if surveys match exceeds rule threshold
            if ($matchPercent >= $rule->threshold_percent) {
                // 3. Find matching courses in main MySQL DB
                $targetCourses = [];
                foreach ($courses as $c) {
                    if (preg_match($rule->target_course_pattern, $c->title) || preg_match($rule->target_course_pattern, $c->code)) {
                        // 4. Verify if course lacks the subject
                        $hasSubject = false;
                        foreach ($c->subjects as $sub) {
                            if (str_contains(strtolower($sub->name), strtolower($rule->recommendation_subject))) {
                                $hasSubject = true;
                                break;
                            }
                        }

                        if (!$hasSubject) {
                            $targetCourses[] = [
                                'id' => $c->id,
                                'title' => $c->title,
                                'code' => $c->code
                            ];
                        }
                    }
                }

                if (!empty($targetCourses)) {
                    $recommendations[] = [
                        'rule_id' => $rule->id,
                        'name' => $rule->rule_name,
                        'recommendation_subject' => $rule->recommendation_subject,
                        'recommendation_text' => $rule->recommendation_text,
                        'trigger_pattern' => $rule->trigger_skill_pattern,
                        'match_percent' => $matchPercent,
                        'courses_lacking' => $targetCourses,
                        'explanation' => "This recommendation was generated because {$matchPercent}% of surveys match the trigger pattern '{$rule->trigger_skill_pattern}' (exceeding the institutional trigger limit of {$rule->threshold_percent}%). The following courses do not offer any curriculum covering '{$rule->recommendation_subject}'."
                    ];
                }
            }
        }

        return response()->json($recommendations);
    }

    public function getSurveys()
    {
        return response()->json([
            'students' => StudentInterest::latest()->get(),
            'companies' => IndustryRequirement::latest()->get()
        ]);
    }

    public function storeSurvey(Request $request)
    {
        $validated = $request->validate([
            'survey_type' => 'required|in:student,industry',
            'data' => 'required|array'
        ]);

        if ($validated['survey_type'] === 'student') {
            $survey = StudentInterest::create($validated['data']);
        } else {
            $survey = IndustryRequirement::create($validated['data']);
        }

        return response()->json([
            'message' => 'Survey submitted successfully.',
            'survey' => $survey
        ], 201);
    }

    public function syncSheet(Request $request)
    {
        $validated = $request->validate([
            'type' => 'required|in:student,industry',
            'url' => 'required|url'
        ]);

        $url = $validated['url'];
        // Rewrite edit url to /export?format=csv
        if (str_contains($url, '/edit')) {
            $url = preg_replace('/\/edit.*/', '/export?format=csv', $url);
        } else if (!str_contains($url, 'format=csv')) {
            $url .= (str_contains($url, '?') ? '&' : '?') . 'format=csv';
        }

        try {
            $response = Http::get($url);
            if (!$response->successful()) {
                return response()->json(['message' => 'Failed to retrieve data from Google Sheet link. Ensure it is shared as public.'], 400);
            }

            $csvData = $response->body();
            $lines = explode("\n", $csvData);
            if (count($lines) < 2) {
                return response()->json(['message' => 'CSV file contains no responses.'], 400);
            }

            $headers = str_getcsv($lines[0]);
            $importedCount = 0;

            if ($validated['type'] === 'student') {
                StudentInterest::truncate();
                // Map columns based on headers keywords
                for ($i = 1; $i < count($lines); $i++) {
                    if (empty(trim($lines[$i]))) continue;
                    $row = str_getcsv($lines[$i]);
                    if (count($row) < count($headers)) continue;

                    // Match keywords in headers to map properties
                    $type = 'prospective_student';
                    $field = 'General';
                    $career = 'Developer';
                    $skills = '';
                    $aspirations = 'Tech Firm';
                    $comments = '';

                    foreach ($headers as $index => $header) {
                        $hl = strtolower($header);
                        $val = $row[$index] ?? '';
                        if (str_contains($hl, 'type') || str_contains($hl, 'who')) $type = $val;
                        elseif (str_contains($hl, 'field') || str_contains($hl, 'major')) $field = $val;
                        elseif (str_contains($hl, 'career') || str_contains($hl, 'role')) $career = $val;
                        elseif (str_contains($hl, 'skill') || str_contains($hl, 'tech') || str_contains($hl, 'learn')) $skills = $val;
                        elseif (str_contains($hl, 'aspiration') || str_contains($hl, 'job') || str_contains($hl, 'work')) $aspirations = $val;
                        elseif (str_contains($hl, 'comment') || str_contains($hl, 'note')) $comments = $val;
                    }

                    StudentInterest::create([
                        'respondent_type' => $type ?: 'prospective_student',
                        'preferred_field' => $field ?: 'General',
                        'career_interests' => $career ?: 'Developer',
                        'skills_to_learn' => $skills ?: 'Coding',
                        'job_aspirations' => $aspirations ?: 'Tech Firm',
                        'comments' => $comments
                    ]);
                    $importedCount++;
                }
            } else {
                IndustryRequirement::truncate();
                for ($i = 1; $i < count($lines); $i++) {
                    if (empty(trim($lines[$i]))) continue;
                    $row = str_getcsv($lines[$i]);
                    if (count($row) < count($headers)) continue;

                    $cname = 'Company';
                    $sector = 'IT';
                    $roles = 'Developer';
                    $skills = 'PHP';
                    $emerging = 'AI';
                    $competencies = 'Problem Solving';
                    $shortages = 'DevOps';

                    foreach ($headers as $index => $header) {
                        $hl = strtolower($header);
                        $val = $row[$index] ?? '';
                        if (str_contains($hl, 'name') || str_contains($hl, 'company')) $cname = $val;
                        elseif (str_contains($hl, 'sector') || str_contains($hl, 'industry')) $sector = $val;
                        elseif (str_contains($hl, 'role') || str_contains($hl, 'job')) $roles = $val;
                        elseif (str_contains($hl, 'skill') || str_contains($hl, 'require')) $skills = $val;
                        elseif (str_contains($hl, 'emerging') || str_contains($hl, 'future')) $emerging = $val;
                        elseif (str_contains($hl, 'competency') || str_contains($hl, 'expect')) $competencies = $val;
                        elseif (str_contains($hl, 'shortage') || str_contains($hl, 'lack')) $shortages = $val;
                    }

                    IndustryRequirement::create([
                        'company_name' => $cname ?: 'Company',
                        'industry_sector' => $sector ?: 'IT',
                        'demanded_roles' => $roles ?: 'Developer',
                        'required_skills' => $skills ?: 'PHP',
                        'emerging_technologies' => $emerging ?: 'AI',
                        'expected_competencies' => $competencies ?: 'Problem Solving',
                        'skill_shortages' => $shortages ?: 'DevOps'
                    ]);
                    $importedCount++;
                }
            }

            return response()->json([
                'message' => "Successfully synchronized {$importedCount} entries from Google Sheets.",
                'synced_count' => $importedCount
            ]);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Sync failed: ' . $e->getMessage()], 500);
        }
    }
}