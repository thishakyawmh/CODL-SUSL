<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Course;
use App\Models\Subject;
use App\Models\Skill;
use App\Models\IndustrySurvey;
use App\Models\StudentSurvey;
use App\Models\AiInsight;
use Illuminate\Support\Facades\DB;

class CurriculumAlignmentController extends Controller
{
     
    public function extractSkills(Request $request)
    {
        $request->validate([
            'course_id' => 'required|exists:courses,id'
        ]);

        $courseId = $request->course_id;
        $course = Course::with('subjects')->find($courseId);
        

        $subjects = Subject::where('course_id', $courseId)->get();
        

        $mappings = [
            'programming' => ['skill' => 'Programming', 'category' => 'Software Development'],
            'python' => ['skill' => 'Programming', 'category' => 'Software Development'],
            'java' => ['skill' => 'Programming', 'category' => 'Software Development'],
            'c++' => ['skill' => 'Programming', 'category' => 'Software Development'],
            'structure' => ['skill' => 'Programming', 'category' => 'Software Development'],
            
            'database' => ['skill' => 'Databases', 'category' => 'Information Systems'],
            'sql' => ['skill' => 'Databases', 'category' => 'Information Systems'],
            'data management' => ['skill' => 'Databases', 'category' => 'Information Systems'],
            
            'artificial intelligence' => ['skill' => 'AI', 'category' => 'Intelligent Systems'],
            'ai' => ['skill' => 'AI', 'category' => 'Intelligent Systems'],
            'neural network' => ['skill' => 'AI', 'category' => 'Intelligent Systems'],
            
            'machine learning' => ['skill' => 'Machine Learning', 'category' => 'Intelligent Systems'],
            'deep learning' => ['skill' => 'Machine Learning', 'category' => 'Intelligent Systems'],
            
            'cyber' => ['skill' => 'Cyber Security', 'category' => 'Security'],
            'security' => ['skill' => 'Cyber Security', 'category' => 'Security'],
            'cryptography' => ['skill' => 'Cyber Security', 'category' => 'Security'],
            
            'cloud' => ['skill' => 'Cloud Computing', 'category' => 'Infrastructure'],
            'aws' => ['skill' => 'Cloud Computing', 'category' => 'Infrastructure'],
            'devops' => ['skill' => 'Cloud Computing', 'category' => 'Infrastructure'],
            
            'robot' => ['skill' => 'Robotics', 'category' => 'Intelligent Systems'],
            'automation' => ['skill' => 'Robotics', 'category' => 'Intelligent Systems'],
            
            'data science' => ['skill' => 'Data Science', 'category' => 'Data Analytics'],
            'statistics' => ['skill' => 'Data Science', 'category' => 'Data Analytics'],
            'analytics' => ['skill' => 'Data Science', 'category' => 'Data Analytics'],
            
            'web' => ['skill' => 'Web Development', 'category' => 'Software Development'],
            'frontend' => ['skill' => 'Web Development', 'category' => 'Software Development'],
            'backend' => ['skill' => 'Web Development', 'category' => 'Software Development'],
            'internet' => ['skill' => 'Web Development', 'category' => 'Software Development'],
            
            'software engineering' => ['skill' => 'Software Engineering', 'category' => 'Software Development'],
            'design patterns' => ['skill' => 'Software Engineering', 'category' => 'Software Development'],
            
            'network' => ['skill' => 'Networking', 'category' => 'Infrastructure'],
            'routing' => ['skill' => 'Networking', 'category' => 'Infrastructure'],
            
            'hardware' => ['skill' => 'Computer Hardware', 'category' => 'Infrastructure'],
            'operating system' => ['skill' => 'Operating Systems', 'category' => 'Infrastructure'],
            'linux' => ['skill' => 'Operating Systems', 'category' => 'Infrastructure'],
        ];


        Skill::where('course_id', $courseId)->delete();

        $extracted = [];
        $now = now();

        foreach ($subjects as $subject) {
            $nameLower = strtolower($subject->name);
            $codeLower = strtolower($subject->code);
            $matched = false;

            foreach ($mappings as $keyword => $info) {
                if (str_contains($nameLower, $keyword) || str_contains($codeLower, $keyword)) {

                    $existsKey = $subject->id . '-' . $info['skill'];
                    if (!isset($extracted[$existsKey])) {
                        Skill::create([
                            'course_id' => $courseId,
                            'semester_id' => $subject->semester_id,
                            'subject_id' => $subject->id,
                            'skill' => $info['skill'],
                            'category' => $info['category']
                        ]);
                        $extracted[$existsKey] = true;
                        $matched = true;
                    }
                }
            }


            if (!$matched) {
                $cleanedName = preg_replace('/(fundamentals|introduction to|advanced|principles of|systems|applications|methods|and)\s+/i', '', $subject->name);
                $cleanedName = trim(ucwords($cleanedName));
                if (strlen($cleanedName) > 2) {
                    Skill::create([
                        'course_id' => $courseId,
                        'semester_id' => $subject->semester_id,
                        'subject_id' => $subject->id,
                        'skill' => $cleanedName,
                        'category' => 'Core Subjects'
                    ]);
                }
            }
        }

        return response()->json([
            'message' => 'Skills successfully extracted from course modules.',
            'skills' => Skill::where('course_id', $courseId)->with('subject')->get()
        ]);
    }

     
    public function getSkills(Request $request)
    {
        $query = Skill::with(['course', 'semester', 'subject']);

        if ($request->has('course_id')) {
            $query->where('course_id', $request->course_id);
        }

        if ($request->has('category') && $request->category !== 'all') {
            $query->where('category', $request->category);
        }

        if ($request->has('search') && $request->search !== '') {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('skill', 'like', "%{$search}%")
                  ->orWhere('category', 'like', "%{$search}%");
            });
        }

        $skills = $query->get();


        $categoriesCount = Skill::groupBy('category')
            ->select('category', DB::raw('count(*) as total'))
            ->get();

        return response()->json([
            'skills' => $skills,
            'analytics' => $categoriesCount
        ]);
    }

     
    public function updateSkillCategory(Request $request, $id)
    {
        $request->validate([
            'category' => 'required|string'
        ]);

        $skill = Skill::findOrFail($id);
        $skill->update([
            'category' => $request->category
        ]);

        return response()->json([
            'message' => 'Skill category updated successfully.',
            'skill' => $skill
        ]);
    }

     
    public function submitIndustrySurvey(Request $request)
    {
        $request->validate([
            'company_name' => 'required|string|max:255',
            'industry_sector' => 'required|string',
            'job_roles' => 'required|array',
            'required_skills' => 'required|array',
            'demand_level' => 'required|in:High,Medium,Low',
        ]);

        $survey = IndustrySurvey::create([
            'company_name' => $request->company_name,
            'industry_sector' => $request->industry_sector,
            'job_roles' => $request->job_roles,
            'required_skills' => $request->required_skills,
            'demand_level' => $request->demand_level
        ]);

        return response()->json([
            'message' => 'Industry survey submitted successfully.',
            'survey' => $survey
        ], 201);
    }

     
    public function getIndustrySurveyData(Request $request)
    {
        $surveys = IndustrySurvey::all();


        $skillsFreq = [];
        foreach ($surveys as $survey) {
            $skills = $survey->required_skills ?? [];
            foreach ($skills as $skill) {
                $skillsFreq[$skill] = ($skillsFreq[$skill] ?? 0) + 1;
            }
        }
        arsort($skillsFreq);

        $topSkills = [];
        foreach ($skillsFreq as $skill => $count) {
            $topSkills[] = ['skill' => $skill, 'count' => $count];
        }


        $sectorsCount = IndustrySurvey::groupBy('industry_sector')
            ->select('industry_sector as sector', DB::raw('count(*) as count'))
            ->get();


        $demandCount = IndustrySurvey::groupBy('demand_level')
            ->select('demand_level as level', DB::raw('count(*) as count'))
            ->get();

        return response()->json([
            'total_surveys' => $surveys->count(),
            'top_skills' => array_slice($topSkills, 0, 10),
            'sector_distribution' => $sectorsCount,
            'demand_distribution' => $demandCount,
            'surveys' => $surveys
        ]);
    }

     
    public function submitStudentSurvey(Request $request)
    {
        $request->validate([
            'interest_field' => 'required|string',
            'name' => 'nullable|string|max:255',
            'email' => 'nullable|email|max:255',
            'career_path' => 'nullable|string|max:255'
        ]);

        $survey = StudentSurvey::create($request->all());

        return response()->json([
            'message' => 'Student interest survey submitted successfully.',
            'survey' => $survey
        ], 201);
    }

     
    public function getStudentSurveyData(Request $request)
    {
        $surveys = StudentSurvey::all();


        $interestDist = StudentSurvey::groupBy('interest_field')
            ->select('interest_field as field', DB::raw('count(*) as count'))
            ->orderBy('count', 'desc')
            ->get();


        $careerDist = StudentSurvey::whereNotNull('career_path')
            ->groupBy('career_path')
            ->select('career_path as path', DB::raw('count(*) as count'))
            ->orderBy('count', 'desc')
            ->limit(8)
            ->get();


        $predictions = [];
        foreach ($interestDist as $item) {
            $baseline = 10; 
            $growth = (($item->count - $baseline) / ($baseline ?: 1)) * 100;
            $predictions[] = [
                'field' => $item->field,
                'current_interest' => $item->count,
                'predicted_increase_percent' => round($growth, 1)
            ];
        }

        return response()->json([
            'total_students' => $surveys->count(),
            'interest_distribution' => $interestDist,
            'career_paths' => $careerDist,
            'enrollment_predictions' => $predictions
        ]);
    }

     
    public function getAiInsights(Request $request, $courseId)
    {
        $course = Course::with('subjects')->findOrFail($courseId);


        $insight = AiInsight::where('course_id', $courseId)->first();


        if (!$insight) {
            return $this->recalculateAndStoreInsights($courseId);
        }

        return response()->json($insight);
    }

     
    public function generateAiRecommendations(Request $request, $courseId)
    {
        return $this->recalculateAndStoreInsights($courseId);
    }

     
    private function recalculateAndStoreInsights($courseId)
    {
        $course = Course::findOrFail($courseId);


        $curriculumSkills = Skill::where('course_id', $courseId)
            ->pluck('skill')
            ->unique()
            ->map(function($s) { return trim(strtolower($s)); })
            ->toArray();


        if (empty($curriculumSkills)) {

            $req = new Request(['course_id' => $courseId]);
            $this->extractSkills($req);
            $curriculumSkills = Skill::where('course_id', $courseId)
                ->pluck('skill')
                ->unique()
                ->map(function($s) { return trim(strtolower($s)); })
                ->toArray();
        }


        $industrySkillsRaw = [];
        $industrySurveys = IndustrySurvey::all();
        foreach ($industrySurveys as $survey) {
            $reqSkills = $survey->required_skills ?? [];
            foreach ($reqSkills as $s) {
                $industrySkillsRaw[] = trim(strtolower($s));
            }
        }
        $industrySkills = array_values(array_unique($industrySkillsRaw));


        if (empty($industrySkills)) {
            $industrySkills = ['ai', 'cyber security', 'cloud computing', 'robotics', 'data science', 'programming', 'databases', 'networking'];
        }


        $studentSurveys = StudentSurvey::all();
        $studentSkillsRaw = [];
        foreach ($studentSurveys as $survey) {
            $field = trim(strtolower($survey->interest_field));
            if ($field === 'artificial intelligence') $studentSkillsRaw[] = 'ai';
            else $studentSkillsRaw[] = $field;
        }
        $studentSkills = array_values(array_unique($studentSkillsRaw));

        if (empty($studentSkills)) {
            $studentSkills = ['ai', 'cyber security', 'data science', 'robotics', 'software engineering', 'cloud computing', 'networking'];
        }


        $coveredSkills = [];
        $missingSkills = [];


        $matchedIndustry = [];
        foreach ($industrySkills as $is) {

            $matched = false;
            foreach ($curriculumSkills as $cs) {
                if ($cs === $is || str_contains($cs, $is) || str_contains($is, $cs)) {
                    $matched = true;
                    break;
                }
            }
            if ($matched) {
                $matchedIndustry[] = $is;
                $coveredSkills[] = ucwords($is);
            } else {
                $missingSkills[] = ucwords($is);
            }
        }


        $matchedStudent = [];
        foreach ($studentSkills as $ss) {
            $matched = false;
            foreach ($curriculumSkills as $cs) {
                if ($cs === $ss || str_contains($cs, $ss) || str_contains($ss, $cs)) {
                    $matched = true;
                    break;
                }
            }
            if ($matched) {
                $matchedStudent[] = $ss;
                $coveredSkills[] = ucwords($ss);
            } else {
                $missingSkills[] = ucwords($ss);
            }
        }

        $coveredSkills = array_values(array_unique($coveredSkills));
        $missingSkills = array_values(array_unique($missingSkills));



        $totalIndustryCount = count($industrySkills);
        $matchedIndustryCount = count($matchedIndustry);
        $industryCoverage = $totalIndustryCount > 0 ? ($matchedIndustryCount / $totalIndustryCount) * 100 : 0;


        $totalStudentCount = count($studentSkills);
        $matchedStudentCount = count($matchedStudent);
        $studentCoverage = $totalStudentCount > 0 ? ($matchedStudentCount / $totalStudentCount) * 100 : 0;


        $overallMatchScore = ($industryCoverage + $studentCoverage) / 2;


        $recommendations = [];
        $index = 1;

        if (in_array('Cyber Security', $missingSkills)) {
            $recommendations[] = [
                'id' => $index++,
                'title' => 'Introduce Cyber Security Modules',
                'description' => 'Cyber Security shows high industry demand (Commercial Bank, ADL) and student interest. Introduce modules like "Cryptography and Network Security" or "Ethical Hacking".',
                'type' => 'Curriculum Amendment',
                'impact' => 'High',
                'priority' => 1
            ];
        }

        if (in_array('Robotics', $missingSkills)) {
            $recommendations[] = [
                'id' => $index++,
                'title' => 'Launch a Robotics Diploma',
                'description' => 'Robotics is an emerging field with substantial student interest (MAS Holdings, CodeGen). Launch a dedicated diploma or specialization pathway.',
                'type' => 'New Program',
                'impact' => 'High',
                'priority' => 2
            ];
        }

        if (in_array('Cloud Computing', $missingSkills)) {
            $recommendations[] = [
                'id' => $index++,
                'title' => 'Develop Cloud Computing Certification Pathway',
                'description' => 'High demand from tech firms (Virtusa, WSO2) for cloud architecture. Introduce certification prep electives for AWS or Microsoft Azure.',
                'type' => 'Certification Pathway',
                'impact' => 'Medium',
                'priority' => 3
            ];
        }

        if (in_array('Data Science', $missingSkills)) {
            $recommendations[] = [
                'id' => $index++,
                'title' => 'Introduce Data Science Specialization Tracks',
                'description' => 'Leverage existing database curriculum to build advanced tracks in "Data Mining", "Data Science Foundations", and "Big Data Analytics".',
                'type' => 'Specialization Track',
                'impact' => 'High',
                'priority' => 4
            ];
        }


        $recommendations[] = [
            'id' => $index++,
            'title' => 'Revise Existing Curriculum for Emerging Technologies',
            'description' => 'Update standard database and programming subjects to integrate modern frameworks and emerging AI concepts.',
            'type' => 'Minor Curriculum Review',
            'impact' => 'Medium',
            'priority' => 5
        ];


        $insight = AiInsight::updateOrCreate(
            ['course_id' => $courseId],
            [
                'overall_match_score' => round($overallMatchScore, 1),
                'industry_coverage' => round($industryCoverage, 1),
                'student_coverage' => round($studentCoverage, 1),
                'missing_skills' => $missingSkills,
                'covered_skills' => $coveredSkills,
                'recommendations' => $recommendations
            ]
        );

        return response()->json($insight);
    }
}
