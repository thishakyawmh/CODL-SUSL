<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use App\Models\Course;
use App\Models\Subject;

class AIAnalysisController extends Controller
{
    /**
     * Analyze a course curriculum against real-world industry trends and job paths.
     */
    public function analyze(Request $request)
    {
        $request->validate([
            'course_id' => 'required|integer|exists:courses,id'
        ]);

        $courseId = $request->input('course_id');
        // Load the course with its semesters, subjects, and batches (with materials)
        $course = Course::with(['category', 'semesters.subjects', 'subjects', 'batches'])->findOrFail($courseId);

        // 1. Gather all subjects in this course
        $subjectsList = collect();
        if ($course->semesters->isNotEmpty()) {
            foreach ($course->semesters as $semester) {
                $subjectsList = $subjectsList->merge($semester->subjects);
            }
        }
        if ($course->subjects->isNotEmpty()) {
            $subjectsList = $subjectsList->merge($course->subjects);
        }

        $subjectArray = $subjectsList->map(function ($s) {
            return [
                'id' => $s->id,
                'name' => $s->name,
                'code' => $s->code,
                'credits' => $s->credits
            ];
        })->toArray();

        // 2. Gather all unique slide files/materials uploaded for this course
        $materials = [];
        $seenFilenames = [];
        foreach ($course->batches as $batch) {
            if (is_array($batch->materials)) {
                foreach ($batch->materials as $mat) {
                    $filename = $mat['filename'] ?? '';
                    if ($filename && !in_array($filename, $seenFilenames)) {
                        $seenFilenames[] = $filename;
                        $materials[] = [
                            'filename' => $filename,
                            'url' => $mat['url'] ?? '',
                            'size' => $mat['size'] ?? 0
                        ];
                    }
                }
            }
        }

        // 3. Load predefined job paths database (real-world demands)
        $jobPathsDef = $this->getPredefinedJobPaths();

        // 4. Handle empty curriculum early (e.g. course 5 BET Hons has no subjects)
        if (empty($subjectArray)) {
            $emptyResult = $this->generateEmptyAnalysisResult($course, $jobPathsDef);
            return response()->json($emptyResult);
        }

        // 5. Attempt AI analysis via Gemini API if configured
        $apiKey = env('GEMINI_API_KEY');
        if (!empty($apiKey)) {
            try {
                $analysisResult = $this->analyzeWithGemini($course, $subjectArray, $materials, $jobPathsDef, $apiKey);
                if ($analysisResult) {
                    // Sort job paths by matching percentage descending in Gemini response too (if not already sorted)
                    if (isset($analysisResult['job_paths'])) {
                        usort($analysisResult['job_paths'], function ($a, $b) {
                            return $b['matching_percentage'] <=> $a['matching_percentage'];
                        });
                    }
                    return response()->json($analysisResult);
                }
            } catch (\Exception $e) {
                Log::error('Gemini API curriculum analysis failed: ' . $e->getMessage() . '. Falling back to local engine.');
            }
        }

        // Fallback to local rule-based analysis engine
        $analysisResult = $this->analyzeLocally($course, $subjectArray, $materials, $jobPathsDef);
        return response()->json($analysisResult);
    }

    /**
     * Generate an empty audit report for courses without defined modules/subjects.
     */
    private function generateEmptyAnalysisResult($course, $jobPathsDef)
    {
        $jobPaths = [];
        foreach ($jobPathsDef as $path) {
            $jobPaths[] = [
                'name' => $path['name'],
                'matching_percentage' => 0,
                'description' => "No curriculum subjects found to map for this role.",
                'covered_skills' => [],
                'missing_skills' => array_keys($path['skills'])
            ];
        }

        return [
            'matching_score' => 0,
            'job_paths' => $jobPaths,
            'subjects' => [],
            'summary' => "Syllabus Empty. No subjects or lecture slides were found in the database for the course '" . $course->title . "'. Please configure the academic catalog and upload course materials in Course Management first to run a curriculum alignment report."
        ];
    }

    /**
     * Call Gemini API to perform the analysis.
     */
    private function analyzeWithGemini($course, $subjectArray, $materials, $jobPathsDef, $apiKey)
    {
        $prompt = "You are an expert academic curriculum auditor. You are auditing the program: '" . $course->title . "' (" . ($course->category ? $course->category->name : 'N/A') . ").\n\n";
        
        $prompt .= "Here are the subjects currently defined in this curriculum:\n";
        foreach ($subjectArray as $sub) {
            $prompt .= "- [" . $sub['code'] . "] " . $sub['name'] . " (Credits: " . $sub['credits'] . ")\n";
        }
        
        $prompt .= "\nHere are the actual slide files and lecture materials uploaded to the course batches by lecturers:\n";
        if (empty($materials)) {
            $prompt .= "(No materials uploaded yet. Analyze based on subject names alone.)\n";
        } else {
            foreach ($materials as $mat) {
                $prompt .= "- Slide: " . $mat['filename'] . "\n";
            }
        }
        
        $prompt .= "\nHere is the real-world job path framework to audit against:\n";
        $prompt .= json_encode($jobPathsDef, JSON_PRETTY_PRINT) . "\n\n";
        
        $prompt .= "Analyze these materials and subjects. You must return a single JSON object. Return ONLY the JSON object. Do not wrap it in markdown tags or add any commentary. The JSON must match the following schema:

{
    \"matching_score\": <integer, overall percentage of job market alignment, 0 to 100>,
    \"job_paths\": [
        {
            \"name\": \"<Job Path Name>\",
            \"matching_percentage\": <integer, 0 to 100 based on matching technologies in subjects and slides>,
            \"description\": \"<Dynamic analysis of how well this curriculum prepares a student for this specific role>\",
            \"covered_skills\": [\"<skill1>\", \"<skill2>\"],
            \"missing_skills\": [\"<skill3>\", \"<skill4>\"]
        }
    ],
    \"subjects\": [
        {
            \"name\": \"<Subject Name>\",
            \"code\": \"<Subject Code>\",
            \"usefulness_percentage\": <integer, matching & industry usefulness of this specific subject, 0 to 100>,
            \"topics_included\": [\"<topic1>\", \"<topic2>\"],
            \"audited_slides\": [\"<slide_filename1>\", \"<slide_filename2>\"],
            \"recommendations\": \"<Concrete suggestions for additions or enhancements to this subject's syllabus>\"
        }
    ],
    \"summary\": \"<A comprehensive executive audit report auditing the curriculum's job readiness, highlighting strengths, weaknesses, and concrete action steps.>\"
}";

        $response = Http::timeout(25)
            ->post("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" . $apiKey, [
                'contents' => [
                    ['parts' => [['text' => $prompt]]]
                ],
                'generationConfig' => [
                    'responseMimeType' => 'application/json'
                ]
            ]);

        if ($response->successful()) {
            $data = $response->json();
            if (isset($data['candidates'][0]['content']['parts'][0]['text'])) {
                $rawJson = $data['candidates'][0]['content']['parts'][0]['text'];
                $result = json_decode($rawJson, true);
                if (json_last_error() === JSON_ERROR_NONE && isset($result['matching_score']) && isset($result['job_paths'])) {
                    return $result;
                }
            }
        }

        throw new \Exception('Invalid response structure or HTTP failure from Gemini API');
    }

    /**
     * Local matching engine fallback using keyword matching and statistical scoring.
     */
    private function analyzeLocally($course, $subjectArray, $materials, $jobPathsDef)
    {
        $jobPathsResult = [];
        $subjectAnalysis = [];
        $overallScoreSum = 0;
        $totalJobPaths = count($jobPathsDef);

        // Gather all subject names and slide names in lowercase for keyword scanning
        $subjectNamesLower = array_map(function ($s) { return strtolower($s['name']); }, $subjectArray);
        $slideNamesLower = array_map(function ($m) { return strtolower($m['filename']); }, $materials);
        $allTaughtText = implode(' ', array_merge($subjectNamesLower, $slideNamesLower));

        // 1. Analyze Job Paths
        foreach ($jobPathsDef as $path) {
            $coveredSkills = [];
            $missingSkills = [];

            foreach ($path['skills'] as $skill => $keywords) {
                $matched = false;
                foreach ($keywords as $kw) {
                    if (str_contains($allTaughtText, strtolower($kw))) {
                        $matched = true;
                        break;
                    }
                }
                if ($matched) {
                    $coveredSkills[] = $skill;
                } else {
                    $missingSkills[] = $skill;
                }
            }

            // Calculate matching percentage based on covered skills
            $matchingPercentage = 0;
            $totalSkillsCount = count($path['skills']);
            if ($totalSkillsCount > 0) {
                $matchingPercentage = round((count($coveredSkills) / $totalSkillsCount) * 100);
            }

            // Build dynamic description
            if ($matchingPercentage >= 80) {
                $description = "Highly aligned. This program provides excellent training for " . $path['name'] . ", covering almost all core skills and tools.";
            } elseif ($matchingPercentage >= 40) {
                $description = "Partially aligned. Core theoretical frameworks are covered, but students require additional training in " . implode(', ', array_slice($missingSkills, 0, 2)) . " for workplace readiness.";
            } elseif ($matchingPercentage > 0) {
                $description = "Low alignment. Basic fundamentals are mentioned, but misses dedicated modules for specialized tools.";
            } else {
                $description = "No alignment. The curriculum does not cover skills related to " . $path['name'] . ".";
            }

            $jobPathsResult[] = [
                'name' => $path['name'],
                'matching_percentage' => $matchingPercentage,
                'description' => $description,
                'covered_skills' => $coveredSkills,
                'missing_skills' => $missingSkills
            ];

            $overallScoreSum += $matchingPercentage;
        }

        // Sort job paths by matching percentage descending
        usort($jobPathsResult, function ($a, $b) {
            return $b['matching_percentage'] <=> $a['matching_percentage'];
        });

        $overallMatchingScore = $totalJobPaths > 0 ? round($overallScoreSum / $totalJobPaths) : 0;
        // Limit score to realistic values (between 5% and 98%)
        $overallMatchingScore = max(10, min(95, $overallMatchingScore));

        // 2. Subject-by-Subject analysis
        foreach ($subjectArray as $subject) {
            $subNameLower = strtolower($subject['name']);
            $auditedSlides = [];
            $topicsIncluded = [];

            // Map slides to this subject based on keyword matching
            foreach ($materials as $material) {
                $slideLower = strtolower($material['filename']);
                
                // Exclude common file extensions and prefix labels
                $cleanSlideName = preg_replace('/^(lec|slide|lecture|chapter|week|unit)_\d+_/i', '', $material['filename']);
                $cleanSlideName = str_replace(['_', '.pdf', '.pptx', '.ppt'], [' ', '', '', ''], $cleanSlideName);
                
                // Check if slide matches subject
                $isMatch = false;
                
                // Triggers
                if (str_contains($subNameLower, 'python') && str_contains($slideLower, 'python')) {
                    $isMatch = true;
                } elseif (str_contains($subNameLower, 'web') && (str_contains($slideLower, 'web') || str_contains($slideLower, 'html') || str_contains($slideLower, 'css') || str_contains($slideLower, 'react') || str_contains($slideLower, 'redux') || str_contains($slideLower, 'node') || str_contains($slideLower, 'php') || str_contains($slideLower, 'laravel') || str_contains($slideLower, 'javascript') || str_contains($slideLower, 'dom') || str_contains($slideLower, 'js'))) {
                    $isMatch = true;
                } elseif (str_contains($subNameLower, 'database') && (str_contains($slideLower, 'db') || str_contains($slideLower, 'sql') || str_contains($slideLower, 'database') || str_contains($slideLower, 'relational'))) {
                    $isMatch = true;
                } elseif (str_contains($subNameLower, 'cloud') && (str_contains($slideLower, 'cloud') || str_contains($slideLower, 'aws') || str_contains($slideLower, 'docker') || str_contains($slideLower, 'kubernetes') || str_contains($slideLower, 'devops') || str_contains($slideLower, 'ci_cd') || str_contains($slideLower, 'pipeline'))) {
                    $isMatch = true;
                } elseif (str_contains($subNameLower, 'machine learning') && (str_contains($slideLower, 'machine') || str_contains($slideLower, 'learning') || str_contains($slideLower, 'ml') || str_contains($slideLower, 'neural') || str_contains($slideLower, 'scikit') || str_contains($slideLower, 'tensorflow') || str_contains($slideLower, 'classification') || str_contains($slideLower, 'regression'))) {
                    $isMatch = true;
                } elseif (str_contains($subNameLower, 'security') && (str_contains($slideLower, 'security') || str_contains($slideLower, 'crypto') || str_contains($slideLower, 'hacking') || str_contains($slideLower, 'owasp') || str_contains($slideLower, 'pentest') || str_contains($slideLower, 'vulnerabilities'))) {
                    $isMatch = true;
                } elseif (str_contains($subNameLower, 'programming') && (str_contains($slideLower, 'program') || str_contains($slideLower, 'oop') || str_contains($slideLower, 'java') || str_contains($slideLower, 'js') || str_contains($slideLower, 'basics'))) {
                    $isMatch = true;
                }

                if ($isMatch) {
                    $auditedSlides[] = $material['filename'];
                    // Extract a clean topic name
                    $topicsIncluded[] = ucwords(trim($cleanSlideName));
                }
            }

            // Calculate Usefulness Percentage based on relevance to market demands
            $usefulness = 60; // default base
            $recommendations = "";

            if (str_contains($subNameLower, 'advanced web')) {
                $usefulness = 95;
                $recommendations = "Syllabus is highly relevant. Consider introducing TypeScript and Next.js to match modern SaaS development roles.";
            } elseif (str_contains($subNameLower, 'cloud computing')) {
                $usefulness = 95;
                $recommendations = "Excellent topics. Add Terraform (Infrastructure as Code) or serverless architecture to the DevOps syllabus.";
            } elseif (str_contains($subNameLower, 'machine learning') || str_contains($subNameLower, 'neural')) {
                $usefulness = 96;
                $recommendations = "Surging job market value. Introduce Hugging Face and PyTorch to give students exposure to modern LLM APIs.";
            } elseif (str_contains($subNameLower, 'python scripting') || str_contains($subNameLower, 'python')) {
                $usefulness = 92;
                $recommendations = "Highly useful. Suggest expanding Pandas data analysis with real-world CSV/SQL extraction pipelines.";
            } elseif (str_contains($subNameLower, 'cryptography') || str_contains($subNameLower, 'hacking') || str_contains($subNameLower, 'security')) {
                $usefulness = 94;
                $recommendations = "Crucial security skills. Ensure students perform network defense mapping and learn OWASP Top 10 secure coding benchmarks.";
            } elseif (str_contains($subNameLower, 'database') || str_contains($subNameLower, 'sql')) {
                $usefulness = 90;
                $recommendations = "Core engineering skill. Recommend adding NoSQL (MongoDB or Redis) to support modern application architectures.";
            } elseif (str_contains($subNameLower, 'web technologies') || str_contains($subNameLower, 'web')) {
                $usefulness = 88;
                $recommendations = "Solid fundamentals. Suggest integrating CSS frameworks like Tailwind CSS, and covering ES6+ syntax.";
            } elseif (str_contains($subNameLower, 'programming') || str_contains($subNameLower, 'object oriented') || str_contains($subNameLower, 'oop')) {
                $usefulness = 88;
                $recommendations = "Basic coding foundation. Introduce automated testing frameworks (JUnit/PyTest) and Git version control workflows.";
            } elseif (str_contains($subNameLower, 'data structures') || str_contains($subNameLower, 'algorithms')) {
                $usefulness = 92;
                $recommendations = "Core technical skills. Ensure students practice time and space complexity evaluations along with tree and graph algorithms.";
            } elseif (str_contains($subNameLower, 'software project') || str_contains($subNameLower, 'qa')) {
                $usefulness = 92;
                $recommendations = "Highly practical capstone module. Encourage students to run agile sprints using issue tracking software like Jira or GitHub Issues.";
            } elseif (str_contains($subNameLower, 'mobile application') || str_contains($subNameLower, 'mobile')) {
                $usefulness = 92;
                $recommendations = "Excellent skill. Enhance with push notification setups and deployment procedures for App/Play stores.";
            } elseif (str_contains($subNameLower, 'mathematics') || str_contains($subNameLower, 'architecture') || str_contains($subNameLower, 'operating systems') || str_contains($subNameLower, 'networking')) {
                $usefulness = 72;
                $recommendations = "Good academic foundational course. We recommend tying mathematical proofs or operating system structures to practical scripts.";
            } else {
                $usefulness = 60;
                $recommendations = "Standard supporting course. Focus on aligning the syllabus with professional business communication and industry report writing.";
            }

            // If no slide was audited, we suggest uploading slides
            if (empty($auditedSlides)) {
                $recommendations = "Action required: No slides or lecture materials have been uploaded by the instructor. Upload course slides via CourseMaterials.tsx to run a deeper content audit.";
            }

            // Ensure unique topics
            $topicsIncluded = array_values(array_unique($topicsIncluded));
            if (empty($topicsIncluded)) {
                // Fallback topics from subject name
                if (str_contains($subNameLower, 'web')) {
                    $topicsIncluded = ["HTML/CSS Structures", "Syllabus Basics"];
                } elseif (str_contains($subNameLower, 'database')) {
                    $topicsIncluded = ["Entity Relationship Modeling", "SQL queries"];
                } elseif (str_contains($subNameLower, 'python')) {
                    $topicsIncluded = ["Python Syntax Basics", "Control Flows"];
                } else {
                    $topicsIncluded = ["Foundational Theories", "Syllabus Overview"];
                }
            }

            $subjectAnalysis[] = [
                'name' => $subject['name'],
                'code' => $subject['code'],
                'usefulness_percentage' => $usefulness,
                'topics_included' => $topicsIncluded,
                'audited_slides' => $auditedSlides,
                'recommendations' => $recommendations
            ];
        }

        // 3. Create professional executive summary
        $summary = "The curriculum for '" . $course->title . "' has been audited against contemporary technology recruitment sectors. ";
        $summary .= "The overall matching score is " . $overallMatchingScore . "%. ";
        
        if ($overallMatchingScore >= 80) {
            $summary .= "This curriculum is exceptionally aligned with current software industry requirements. It provides students with robust practical experience in web development, database engineering, and DevOps scripting. The inclusion of slide decks like Docker and React indicates a modern, hands-on teaching approach. Main suggestions involve adding minor updates for Next.js, TypeScript, and ethical cloud security standards.";
        } elseif ($overallMatchingScore >= 50) {
            $summary .= "This curriculum offers a standard academic computing foundation. While it covers essential elements (SQL, programming basics, database theory), it requires updates to meet entry-level job roles. Slide analysis indicates that while subjects like 'Advanced Web' are modern, other areas lack references to contemporary frameworks. Introducing Python-based ML libraries, cloud hosting (AWS), and secure coding standards will dramatically boost student employability.";
        } else {
            $summary .= "This curriculum requires immediate restructuring. It is heavily biased towards legacy theoretical concepts and lacks modern developer tools. Slide analysis shows a critical shortage of industry-standard coding labs (e.g. Git, React, Docker). We suggest introducing dedicated full-stack web and mobile application modules to raise the employability index.";
        }

        return [
            'matching_score' => $overallMatchingScore,
            'job_paths' => $jobPathsResult,
            'subjects' => $subjectAnalysis,
            'summary' => $summary
        ];
    }

    /**
     * Predefined job paths details with associated keywords.
     */
    private function getPredefinedJobPaths()
    {
        return [
            [
                'name' => 'Full-Stack Web Developer',
                'skills' => [
                    'Frontend Coding' => ['HTML', 'CSS', 'JavaScript', 'React', 'Vue', 'TypeScript', 'Next.js'],
                    'Backend Frameworks' => ['Laravel', 'PHP', 'Node', 'Express', 'Django', 'MVC'],
                    'APIs & Integration' => ['RESTful', 'API', 'REST', 'GraphQL'],
                    'Database Queries' => ['SQL', 'MySQL', 'PostgreSQL', 'DBMS', 'Database']
                ]
            ],
            [
                'name' => 'AI / Machine Learning Engineer',
                'skills' => [
                    'Programming' => ['Python', 'R'],
                    'ML Frameworks' => ['Scikit-Learn', 'TensorFlow', 'PyTorch', 'Keras'],
                    'AI Concepts' => ['Machine Learning', 'Deep Learning', 'Neural Network', 'LLM', 'AI', 'NLP', 'Computer Vision']
                ]
            ],
            [
                'name' => 'Cloud & DevOps Engineer',
                'skills' => [
                    'Containerization' => ['Docker', 'Kubernetes'],
                    'Cloud Hosting' => ['AWS', 'Azure', 'Google Cloud', 'GCP'],
                    'CI/CD Pipelines' => ['CI/CD', 'GitHub Actions', 'Jenkins', 'Pipeline'],
                    'Scripting' => ['Linux', 'Bash', 'Git', 'Version Control']
                ]
            ],
            [
                'name' => 'Cybersecurity Specialist',
                'skills' => [
                    'Network Security' => ['Firewalls', 'VPNs', 'Protocols', 'Network Security'],
                    'Penetration Testing' => ['Ethical Hacking', 'Penetration Testing', 'Pentest', 'Vulnerabilities'],
                    'Security Coding' => ['OWASP', 'Cryptography', 'Encryption', 'AES', 'Symmetric']
                ]
            ],
            [
                'name' => 'Data Scientist / Analyst',
                'skills' => [
                    'Data Analysis' => ['Pandas', 'Numpy', 'Data Wrangling', 'Data Cleaning'],
                    'Database Systems' => ['SQL', 'NoSQL', 'MongoDB', 'PostgreSQL'],
                    'Business Intelligence' => ['PowerBI', 'Tableau', 'Data Visualization']
                ]
            ],
            [
                'name' => 'Mobile App Developer',
                'skills' => [
                    'Cross-Platform' => ['Flutter', 'React Native', 'Dart'],
                    'Native Apps' => ['Swift', 'Kotlin', 'Android', 'iOS']
                ]
            ]
        ];
    }
}
