<?php

namespace App\AI\Services;

use App\AI\Models\StudentInterest;
use App\AI\Models\IndustryRequirement;
use App\AI\Models\DomainClassification;
use Illuminate\Support\Facades\Log;

class AnalyticsNLPService
{
    protected $synonyms;
    protected static $geminiCache = [];

    public function __construct()
    {

        $this->synonyms = config('analytics.synonyms', []);
    }

     
    public function processAll(\App\Models\Course $course = null): array
    {

        $studentSurveys = StudentInterest::cursor();
        $industrySurveys = IndustryRequirement::cursor();

        $studentFrequencies = [];
        $industryFrequencies = [];
        $emergingTechnologiesCounts = [];
        $skillGapsCounts = [];
        $studentPrefsCounts = [];
        $industryPracticesCounts = [];


        $theoryPracticalSum = 0.0;
        $theoryPracticalWeightSum = 0.0;


        $certImportanceSum = 0.0;
        $certImportanceWeightSum = 0.0;


        $parseBalance = function ($balance) {
            if (is_numeric($balance)) {
                return (float) $balance;
            }
            $b = strtolower(trim($balance));
            if (empty($b)) return 3.0;
            if (str_contains($b, 'balanced')) return 3.0;
            if (str_contains($b, 'practical oriented') || str_contains($b, 'mostly practical')) return 4.0;
            if (str_contains($b, 'theory oriented') || str_contains($b, 'mostly theory')) return 2.0;
            if (str_contains($b, 'practical')) return 5.0;
            if (str_contains($b, 'theory')) return 1.0;
            return 3.0;
        };


        $minStudentThreshold = config('analytics.thresholds.min_student_responses', 10);
        $minIndustryThreshold = config('analytics.thresholds.min_industry_responses', 5);
        $minRelevanceScore = config('analytics.thresholds.min_relevance_score', 0.35);

        $evidenceStatus = 'sufficient';
        $confidence = 'High';
        $studentCount = 0;
        $industryCount = 0;
        $totalRelevant = 0;

        $relevantStudentSurveys = [];
        $relevantIndustrySurveys = [];
        $studentAudit = [];
        $industryAudit = [];

        $curriculumSubjects = [];
        $curriculumDomains = [];
        $curriculumAvailable = false;


        $studentDistribution = [];
        $industryDistribution = [];
        $jaccardResults = ['intersection' => [], 'union' => [], 'overall_score' => null];
        $coveragePercent = null;
        $missingSubjects = [];
        $curriculumAnomalies = [];
        $studentTheoryPercent = null;
        $studentPracticalPercent = null;
        $studentPrefsFormatted = [];
        $industryPracticesFormatted = [];
        $certImportancePercent = null;
        $avgStudentRelevance = 0.0;
        $avgIndustryRelevance = 0.0;
        $studentAudit = [];
        $industryAudit = [];
        $domainMatrix = [];

        if ($course) {

            $course->loadMissing('semesters.subjects', 'category');
            
            foreach ($course->semesters as $semester) {
                foreach ($semester->subjects as $subject) {
                    $curriculumSubjects[] = [
                        'id' => $subject->id,
                        'code' => $subject->code,
                        'name' => $subject->name,
                        'credits' => $subject->credits
                    ];
                    $subDomains = $this->extractDomains($subject->name);
                    $curriculumDomains = array_merge($curriculumDomains, $subDomains);
                }
            }
            $curriculumDomains = $this->deduplicateDomains($curriculumDomains);
            $curriculumAvailable = !empty($curriculumSubjects);





            $profile = $this->buildProgramProfile($course, $curriculumSubjects);
            $relatedSectors        = $profile['related_sectors'];
            $relatedInterests      = array_merge($profile['core_domains'], $profile['adjacent_domains'], $profile['emerging_domains']);
            $relatedSubDisciplines = $profile['related_disciplines'];


            if (!$curriculumAvailable) {
                $evidenceStatus = 'insufficient';
                $confidence = 'Insufficient evidence';
                return [
                    'student_demand_distribution' => [['name' => 'Insufficient data', 'value' => 0]],
                    'industry_demand_distribution' => [['name' => 'Insufficient data', 'value' => 0]],
                    'domain_frequency_counts' => ['student' => [], 'industry' => []],
                    'emerging_technologies' => [],
                    'skill_gaps' => [],
                    'jaccard_similarity_results' => ['intersection' => [], 'union' => [], 'overall_score' => null],
                    'coverage_percent' => null,
                    'missing_subjects' => [],
                    'outdated_subjects' => [],
                    'low_demand_subjects' => [],
                    'learning_preferences_data' => [
                        'student_theory_percent' => null,
                        'student_practical_percent' => null,
                        'student_methods' => [],
                        'industry_practices' => [],
                        'certification_importance' => null
                    ],
                    'kpis' => [
                        'studentMatch' => null,
                        'industryMatch' => null,
                        'alignment' => null,
                        'surveys' => 0,
                        'companies' => 0,
                        'courses' => \App\Models\Course::count(),
                        'evidence_status' => 'insufficient',
                        'confidence' => 'Insufficient evidence',
                        'student_count' => 0,
                        'industry_count' => 0,
                        'avg_student_relevance' => 0,
                        'avg_industry_relevance' => 0,
                        'curriculum_status' => 'insufficient',
                    ],
                    'explainability' => ['student_surveys' => [], 'industry_surveys' => []]
                ];
            }


            $relevantStudentSurveys = [];
            $studentAudit = [];
            foreach ($studentSurveys as $survey) {
                $eval = $this->evaluateStudentRelevance($survey, $profile);
                $studentAudit[] = [
                    'record_id' => $survey->id,
                    'primary_interest' => $survey->primary_interest,
                    'secondary_interest' => $survey->secondary_interest,
                    'ternary_interest' => $survey->ternary_interest,
                    'primary_skills' => $survey->primary_skills,
                    'secondary_skills' => $survey->secondary_skills,
                    'ternary_skills' => $survey->ternary_skills,
                    'relevance_score' => $eval['score'],
                    'accepted' => $eval['accepted'],
                    'reason' => $eval['reason'],
                    'weight' => $eval['weight']
                ];

                if ($eval['accepted']) {
                    $relevantStudentSurveys[] = [
                        'survey' => $survey,
                        'relevance_score' => $eval['score'],
                        'skills' => $eval['skills'],
                        'methods' => $eval['methods'],
                        'balance' => $eval['balance'],
                    ];
                }
            }


            $relevantIndustrySurveys = [];
            $industryAudit = [];
            foreach ($industrySurveys as $survey) {
                $eval = $this->evaluateIndustryRelevance($survey, $profile);
                $industryAudit[] = [
                    'record_id' => $survey->id,
                    'company_name' => $survey->company_name,
                    'sector' => $survey->industry_sector,
                    'discipline' => $survey->primary_academic_field,
                    'skills' => $survey->required_skills,
                    'relevance_score' => $eval['score'],
                    'accepted' => $eval['accepted'],
                    'reason' => $eval['reason'],
                ];

                if ($eval['accepted']) {
                    $relevantIndustrySurveys[] = [
                        'survey' => $survey,
                        'relevance_score' => $eval['score'],
                    ];
                }
            }

            $studentCount = count($relevantStudentSurveys);
            $industryCount = count($relevantIndustrySurveys);
            $totalRelevant = $studentCount + $industryCount;

            $avgStudentRelevance = $studentCount > 0 ? array_sum(array_column($relevantStudentSurveys, 'relevance_score')) / $studentCount : 0.0;
            $avgIndustryRelevance = $industryCount > 0 ? array_sum(array_column($relevantIndustrySurveys, 'relevance_score')) / $industryCount : 0.0;


            if ($totalRelevant === 0) {
                $evidenceStatus = 'insufficient';
                $confidence = 'Insufficient evidence';
            } else {

                $avgRelevance = ($avgStudentRelevance + $avgIndustryRelevance) / 2.0;
                if ($studentCount < $minStudentThreshold || $industryCount < $minIndustryThreshold) {
                    $evidenceStatus = 'limited';
                    $confidence = 'Medium';
                } else {
                    $evidenceStatus = 'sufficient';
                    $confidence = ($avgRelevance >= 0.70) ? 'High' : (($avgRelevance >= 0.50) ? 'Medium' : 'Low');
                }
            }


            if ($evidenceStatus === 'insufficient') {
                return [
                    'student_demand_distribution' => [['name' => 'Insufficient data', 'value' => 0]],
                    'industry_demand_distribution' => [['name' => 'Insufficient data', 'value' => 0]],
                    'domain_frequency_counts' => ['student' => [], 'industry' => []],
                    'emerging_technologies' => [],
                    'skill_gaps' => [],
                    'jaccard_similarity_results' => ['intersection' => [], 'union' => [], 'overall_score' => null],
                    'coverage_percent' => null,
                    'missing_subjects' => [],
                    'outdated_subjects' => [],
                    'low_demand_subjects' => [],
                    'learning_preferences_data' => [
                        'student_theory_percent' => null,
                        'student_practical_percent' => null,
                        'student_methods' => [],
                        'industry_practices' => [],
                        'certification_importance' => null
                    ],
                    'kpis' => [
                        'studentMatch' => null,
                        'industryMatch' => null,
                        'alignment' => null,
                        'surveys' => 0,
                        'companies' => 0,
                        'courses' => \App\Models\Course::count(),
                        'evidence_status' => $evidenceStatus,
                        'confidence' => $confidence,
                        'student_count' => 0,
                        'industry_count' => 0,
                        'avg_student_relevance' => 0,
                        'avg_industry_relevance' => 0,
                        'curriculum_status' => 'sufficient',
                    ],
                    'explainability' => ['student_surveys' => [], 'industry_surveys' => []]
                ];
            }


            $studentDomainCounts = [];
            $studentDomainSkillLinks = [];
            foreach ($relevantStudentSurveys as $item) {
                $survey = $item['survey'];
                $weight = $item['relevance_score'];
                $skills = $item['skills'];
                $methods = $item['methods'];
                $balance = $item['balance'];

                $domains = $this->extractDomains($skills ?? '');
                $domains = $this->deduplicateDomains($domains);

                foreach ($domains as $d) {
                    $studentFrequencies[$d] = ($studentFrequencies[$d] ?? 0.0) + $weight;
                    $studentDomainCounts[$d] = ($studentDomainCounts[$d] ?? 0) + 1;
                    if ($skills) {
                        $parts = array_map('trim', explode(',', $skills));
                        foreach ($parts as $p) {
                            if ($p) $studentDomainSkillLinks[$d][] = $p;
                        }
                    }
                }

                if ($survey->new_program_suggestion) {
                    $emergingTechnologiesCounts[$survey->new_program_suggestion] = ($emergingTechnologiesCounts[$survey->new_program_suggestion] ?? 0.0) + $weight;
                }

                if ($balance) {
                    $score = $parseBalance($balance);
                    $theoryPracticalSum += $score * $weight;
                    $theoryPracticalWeightSum += $weight;
                }

                if ($methods) {
                    $prefs = array_map('trim', explode(',', $methods));
                    foreach ($prefs as $p) {
                        if ($p) {
                            $studentPrefsCounts[$p] = ($studentPrefsCounts[$p] ?? 0.0) + $weight;
                        }
                    }
                }
            }


            $industryDomainCounts = [];
            $industryDomainSkillLinks = [];
            foreach ($relevantIndustrySurveys as $item) {
                $survey = $item['survey'];
                $weight = $item['relevance_score'];

                $domains = $this->extractDomains($survey->required_skills ?? '');
                $domains = $this->deduplicateDomains($domains);

                foreach ($domains as $d) {
                    $industryFrequencies[$d] = ($industryFrequencies[$d] ?? 0.0) + $weight;
                    $industryDomainCounts[$d] = ($industryDomainCounts[$d] ?? 0) + 1;
                    if ($survey->required_skills) {
                        $parts = array_map('trim', explode(',', $survey->required_skills));
                        foreach ($parts as $p) {
                            if ($p) $industryDomainSkillLinks[$d][] = $p;
                        }
                    }
                }

                if ($survey->emerging_fields) {
                    $emergingTechnologiesCounts[$survey->emerging_fields] = ($emergingTechnologiesCounts[$survey->emerging_fields] ?? 0.0) + $weight;
                }

                if ($survey->graduate_skill_gaps) {
                    $gaps = $this->extractDomains($survey->graduate_skill_gaps);
                    foreach ($gaps as $g) {
                        $skillGapsCounts[$g] = ($skillGapsCounts[$g] ?? 0.0) + $weight;
                    }
                }

                if ($survey->academic_practices) {
                    $practices = array_map('trim', explode(',', $survey->academic_practices));
                    foreach ($practices as $p) {
                        if ($p) {
                            $industryPracticesCounts[$p] = ($industryPracticesCounts[$p] ?? 0.0) + $weight;
                        }
                    }
                }

                if (isset($survey->certification_importance)) {
                    $certImportanceSum += (float) $survey->certification_importance * $weight;
                    $certImportanceWeightSum += $weight;
                }
            }

        } else {

            foreach ($studentSurveys as $survey) {
                $text = implode(' ', [$survey->primary_interest, $survey->primary_skills, $survey->secondary_interest, $survey->secondary_skills, $survey->ternary_interest, $survey->ternary_skills]);
                $domains = $this->extractDomains($text);
                $domains = $this->deduplicateDomains($domains);
                foreach ($domains as $d) {
                    $studentFrequencies[$d] = ($studentFrequencies[$d] ?? 0.0) + 1.0;
                }
                
                if ($survey->new_program_suggestion) {
                    $emergingTechnologiesCounts[$survey->new_program_suggestion] = ($emergingTechnologiesCounts[$survey->new_program_suggestion] ?? 0.0) + 1.0;
                }

                if ($survey->primary_learning_balance) {
                    $score = $parseBalance($survey->primary_learning_balance);
                    $theoryPracticalSum += $score;
                    $theoryPracticalWeightSum += 1.0;
                }

                $prefsText = implode(',', array_filter([$survey->primary_learning_methods, $survey->secondary_learning_methods, $survey->ternary_learning_methods]));
                if ($prefsText) {
                    $prefs = array_map('trim', explode(',', $prefsText));
                    foreach ($prefs as $p) {
                        if ($p) {
                            $studentPrefsCounts[$p] = ($studentPrefsCounts[$p] ?? 0.0) + 1.0;
                        }
                    }
                }
            }

            foreach ($industrySurveys as $survey) {
                $text = $survey->required_skills . ' ' . $survey->graduate_skill_gaps . ' ' . $survey->emerging_fields;
                $domains = $this->extractDomains($text);
                $domains = $this->deduplicateDomains($domains);
                foreach ($domains as $d) {
                    $industryFrequencies[$d] = ($industryFrequencies[$d] ?? 0.0) + 1.0;
                }

                if ($survey->emerging_fields) {
                    $emergingTechnologiesCounts[$survey->emerging_fields] = ($emergingTechnologiesCounts[$survey->emerging_fields] ?? 0.0) + 1.0;
                }
                if ($survey->graduate_skill_gaps) {
                    $gaps = $this->extractDomains($survey->graduate_skill_gaps);
                    foreach ($gaps as $g) {
                        $skillGapsCounts[$g] = ($skillGapsCounts[$g] ?? 0.0) + 1.0;
                    }
                }
                if ($survey->academic_practices) {
                    $practices = array_map('trim', explode(',', $survey->academic_practices));
                    foreach ($practices as $p) {
                        if ($p) {
                            $industryPracticesCounts[$p] = ($industryPracticesCounts[$p] ?? 0.0) + 1.0;
                        }
                    }
                }
                if (isset($survey->certification_importance)) {
                    $certImportanceSum += (float) $survey->certification_importance;
                    $certImportanceWeightSum += 1.0;
                }
            }
        }


        arsort($studentFrequencies);
        arsort($industryFrequencies);
        arsort($emergingTechnologiesCounts);
        arsort($skillGapsCounts);
        arsort($studentPrefsCounts);
        arsort($industryPracticesCounts);


        $jaccardResults = $this->calculateWeightedJaccard($studentFrequencies, $industryFrequencies);


        $studentDistribution = $this->formatDistribution($studentFrequencies);
        $industryDistribution = $this->formatDistribution($industryFrequencies);


        $avgTheoryPractical = $theoryPracticalWeightSum > 0 ? $theoryPracticalSum / $theoryPracticalWeightSum : 3.0;
        $studentPracticalPercent = (int) round(($avgTheoryPractical / 5) * 100);
        $studentTheoryPercent = 100 - $studentPracticalPercent;


        $studentPrefsFormatted = [];
        $totalPrefs = array_sum($studentPrefsCounts) ?: 1;
        foreach (array_slice($studentPrefsCounts, 0, 5, true) as $name => $count) {

            $industryAlignmentText = "Direct Student Request";
            $alignmentLevel = 'Low';
            if ($course) {
                if (str_contains(strtolower($name), 'project') || str_contains(strtolower($name), 'practical')) {
                    $industryAlignmentText = "Industry reported high demand for hands-on application and skill gaps in implementation.";
                    $alignmentLevel = 'High';
                } elseif (str_contains(strtolower($name), 'theory') || str_contains(strtolower($name), 'classroom')) {
                    $industryAlignmentText = "Aligns with industry expectations for foundational conceptual knowledge.";
                    $alignmentLevel = 'Medium';
                }
            }
            $studentPrefsFormatted[] = [
                'name' => $name,
                'value' => (int) round(($count / $totalPrefs) * 100),
                'industry_evidence' => $industryAlignmentText,
                'alignment_level' => $alignmentLevel,
                'confidence' => $confidence ?? 'High'
            ];
        }

        $industryPracticesFormatted = [];
        $totalPractices = array_sum($industryPracticesCounts) ?: 1;
        foreach (array_slice($industryPracticesCounts, 0, 5, true) as $name => $count) {
            $industryPracticesFormatted[] = ['name' => $name, 'value' => (int) round(($count / $totalPractices) * 100)];
        }

        $avgCertImportance = $certImportanceWeightSum > 0 ? $certImportanceSum / $certImportanceWeightSum : 3.0;
        $certImportancePercent = (int) round(($avgCertImportance / 5) * 100);

        $coveragePercent = 0;
        $missingSubjects = [];
        $curriculumAnomalies = [];
        $curriculumEnhancements = [];
        $domainMatrix = [];


        $avgStudentRelevance = $studentCount > 0 ? array_sum(array_column($relevantStudentSurveys, 'relevance_score')) / $studentCount : 0.0;
        $avgIndustryRelevance = $industryCount > 0 ? array_sum(array_column($relevantIndustrySurveys, 'relevance_score')) / $industryCount : 0.0;
        $confidence = $this->calculateConfidence($studentCount, $industryCount, $avgStudentRelevance, $avgIndustryRelevance, $curriculumAvailable);

        if ($course && $curriculumAvailable) {
            $allFrequencies = array_unique(array_merge(array_keys($industryFrequencies), array_keys($studentFrequencies)));




            $targetDomains = [];
            foreach ($allFrequencies as $domain) {
                if (in_array($domain, $profile['excluded_domains'])) continue;
                $isCore    = in_array($domain, $profile['core_domains']);
                $isAdjacent = in_array($domain, $profile['adjacent_domains']);
                if ($isCore || $isAdjacent) {
                    $raw_ind_pct  = $industryCount > 0 ? ($industryDomainCounts[$domain] ?? 0) / $industryCount : 0.0;
                    $raw_stud_pct = $studentCount  > 0 ? ($studentDomainCounts[$domain]  ?? 0) / $studentCount  : 0.0;
                    $combined_score = ($raw_ind_pct * 0.70) + ($raw_stud_pct * 0.30);
                    if ($combined_score >= 0.05) {
                        $targetDomains[] = $domain;
                    }
                }
            }

            if (count($targetDomains) > 0) {
                $coveredCount = 0;
                foreach ($targetDomains as $td) {
                    $cov = $this->getCurriculumCoverageStatus($td, $curriculumSubjects);
                    if ($cov['status'] === 'Directly Covered' || $cov['status'] === 'Covered by Equivalent Subject' || $cov['status'] === 'Embedded Coverage') {
                        $coveredCount++;
                    }
                }
                $coveragePercent = (int) round(($coveredCount / count($targetDomains)) * 100);
            } else {
                $coveragePercent = count($curriculumSubjects) > 0 ? 100 : null;
            }

            $allDomainsList = array_keys($this->synonyms);
            foreach ($allDomainsList as $domain) {

                if (in_array($domain, $profile['excluded_domains'])) {
                    continue;
                }


                $isCore     = in_array($domain, $profile['core_domains']);
                $isAdjacent = in_array($domain, $profile['adjacent_domains']) && !$isCore;
                $isEmerging = in_array($domain, $profile['emerging_domains']) && !$isCore && !$isAdjacent;


                $raw_ind_pct = $industryCount > 0 ? ($industryDomainCounts[$domain] ?? 0) / $industryCount : 0.0;
                $raw_stud_pct = $studentCount > 0 ? ($studentDomainCounts[$domain] ?? 0) / $studentCount : 0.0;
                $combined_score = ($raw_ind_pct * 0.70) + ($raw_stud_pct * 0.30);


                $coverage = $this->getCurriculumCoverageStatus($domain, $curriculumSubjects);
                

                $relevanceLevel = 'OUT-OF-SCOPE';
                if ($isCore) $relevanceLevel = 'CORE';
                elseif ($isAdjacent) $relevanceLevel = 'ADJACENT';
                elseif ($isEmerging) $relevanceLevel = 'EMERGING';


                $classification = 'IGNORE';
                $indCountMatch = $industryDomainCounts[$domain] ?? 0;
                $studCountMatch = $studentDomainCounts[$domain] ?? 0;
                $totalEvidenceCount = $indCountMatch + $studCountMatch;

                if ($coverage['status'] === 'Directly Covered' || $coverage['status'] === 'Covered by Equivalent Subject' || $coverage['status'] === 'Embedded Coverage') {
                    $classification = 'Already Covered';
                } else {
                    if ($relevanceLevel === 'CORE') {

                        if ($combined_score >= 0.15 && $totalEvidenceCount >= 3) {
                            $classification = 'Core Curriculum Gap';
                        } elseif ($combined_score >= 0.08 && $totalEvidenceCount >= 2) {
                            $classification = 'Curriculum Enhancement';
                        } else {
                            $classification = 'Insufficient Evidence';
                        }
                    } elseif ($relevanceLevel === 'ADJACENT') {

                        if ($combined_score >= 0.08 && $totalEvidenceCount >= 2) {
                            $classification = 'Curriculum Enhancement';
                        } else {
                            $classification = 'Insufficient Evidence';
                        }
                    } elseif ($relevanceLevel === 'EMERGING') {

                        if ($combined_score >= 0.05 && $totalEvidenceCount >= 2) {
                            $classification = 'Emerging / Industry Technology Trend';
                        } else {
                            $classification = 'Insufficient Evidence';
                        }
                    }
                }


                $sources = [];
                if ($raw_ind_pct > 0) $sources[] = 'Industry Survey';
                if ($raw_stud_pct > 0) $sources[] = 'Student Interest Survey';

                $suppSkills = $this->getSubSkillsForDomains([$domain]);
                $suppSkills = array_slice($suppSkills, 0, 5);


                $pctText = round($combined_score * 100) . '%';
                
                if ($classification === 'Already Covered') {
                    $reason = "{$domain} is already covered in the curriculum by subject " . ($coverage['subject'] ?? '') . ".";
                } elseif ($classification === 'Core Curriculum Gap') {
                    $reason = "{$domain} was identified as a core curriculum gap because {$pctText} of relevant survey responses requested related skills and the current curriculum has no verified coverage.";
                } elseif ($classification === 'Curriculum Enhancement') {
                    if ($coverage['status'] === 'Embedded Coverage') {
                        $reason = "{$domain} has partial/embedded coverage across curriculum subjects (" . $coverage['subject'] . "). A dedicated module enhancement is recommended based on " . $totalEvidenceCount . " relevant survey responses.";
                    } else {


                        $reason = "{$domain} was identified as a curriculum enhancement ({$pctText} combined demand from " . $totalEvidenceCount . " relevant responses). The current curriculum does not have a dedicated subject for this area.";
                    }
                } elseif ($classification === 'Insufficient Evidence') {
                    $reason = "Relevance is matched, but response-count evidence is insufficient to recommend a gap.";
                } else {
                    if ($relevanceLevel === 'OUT-OF-SCOPE') {
                        $reason = "{$domain} is out of scope for this program.";
                    } else {
                        $reason = "{$domain} is an emerging industry trend matching {$pctText} of responses.";
                    }
                }

                $finding = [
                    'name' => $domain,
                    'industry_pct' => round($raw_ind_pct * 100),
                    'student_pct' => round($raw_stud_pct * 100),
                    'combined_pct' => round($combined_score * 100),
                    'skills' => $suppSkills,
                    'count' => $totalEvidenceCount,
                    'confidence' => $confidence,
                    'classification' => $classification,
                    'curriculum_coverage_status' => $coverage['status'],
                    'evidence_confidence' => $confidence,
                    'evidence_sources' => $sources,
                    'total_industry_responses' => $industryCount,
                    'relevant_industry_responses' => $indCountMatch,
                    'total_student_responses' => $studentCount,
                    'relevant_student_responses' => $studCountMatch,
                    'explanation' => $reason,
                    'matched_sectors' => $relatedSectors,
                    'matched_sub_disciplines' => $relatedSubDisciplines,
                    'matched_curriculum_subjects' => array_column($curriculumSubjects, 'name'),
                    'supporting_skills' => $suppSkills,
                    'relevance_level' => $relevanceLevel,
                ];

                $domainMatrix[] = $finding;


                if ($classification === 'Core Curriculum Gap' || $classification === 'Curriculum Enhancement') {
                    $missingSubjects[] = $finding;
                }
            }

            usort($missingSubjects, fn($a, $b) => $b['combined_pct'] <=> $a['combined_pct']);


            $legacyKeywords = config('analytics.legacy_keywords', ['visual basic', 'flash', 'silverlight', 'cobol', 'dreamweaver', 'pascal', 'fortran']);
            foreach ($curriculumSubjects as $subject) {
                $subLower = strtolower($subject['name']);
                

                $isLegacy = false;
                $legacyTechName = '';
                foreach ($legacyKeywords as $kw) {
                    if (str_contains($subLower, $kw)) {
                        $isLegacy = true;
                        $legacyTechName = ucwords($kw);
                        break;
                    }
                }


                $subDomains = $this->extractDomains($subject['name']);
                $raw_ind_pct = 0.0;
                $raw_stud_pct = 0.0;
                if (!empty($subDomains)) {
                    $indSum = 0.0;
                    $studSum = 0.0;
                    foreach ($subDomains as $sd) {
                        $indSum += $industryCount > 0 ? ($industryDomainCounts[$sd] ?? 0) / $industryCount : 0.0;
                        $studSum += $studentCount > 0 ? ($studentDomainCounts[$sd] ?? 0) / $studentCount : 0.0;
                    }
                    $raw_ind_pct = $indSum / count($subDomains);
                    $raw_stud_pct = $studSum / count($subDomains);
                }
                $combined_score = ($raw_ind_pct * 0.70) + ($raw_stud_pct * 0.30);

                if ($isLegacy) {
                    $curriculumEnhancements[] = [
                        'anomaly_type' => 'Curriculum Modernization',
                        'affected_subject' => $subject['code'] . ': ' . $subject['name'],
                        'industry_evidence' => round($raw_ind_pct * 100),
                        'student_evidence' => round($raw_stud_pct * 100),
                        'combined_evidence' => round($combined_score * 100),
                        'supporting_evidence' => [$legacyTechName],
                        'confidence' => $confidence,
                        'explanation' => "Subject contains deprecated or legacy technology ({$legacyTechName}). Modern replacement is recommended."
                    ];
                }


                if (!empty($subDomains) && $combined_score < 0.05 && count($curriculumSubjects) > 3) {
                    $curriculumAnomalies[] = [
                        'anomaly_type' => 'Low Observed Demand',
                        'affected_subject' => $subject['code'] . ': ' . $subject['name'],
                        'industry_evidence' => round($raw_ind_pct * 100),
                        'student_evidence' => round($raw_stud_pct * 100),
                        'combined_evidence' => round($combined_score * 100),
                        'supporting_evidence' => $subDomains,
                        'confidence' => $confidence,
                        'explanation' => "Subject has very low observed relevance (" . round($combined_score * 100) . "% combined score) in both student interests and industry requirements."
                    ];
                }


                // Only flag as gap if this subject's domain has HIGH demand but the syllabus
                // treatment may be narrow. Use clean domain names as evidence, not raw survey strings.
                if ($combined_score >= 0.25 && !empty($subDomains)) {
                    $demandedDomains = [];
                    foreach ($subDomains as $sd) {
                        if (isset($industryDomainCounts[$sd]) && $industryDomainCounts[$sd] > 0) {
                            $demandedDomains[] = $sd;
                        }
                    }
                    if (count($demandedDomains) > 0) {
                        $correctSubSkills = $this->getSubSkillsForDomains($demandedDomains);
                        $curriculumEnhancements[] = [
                            'anomaly_type'        => 'Skill Coverage Gap',
                            'affected_subject'    => $subject['code'] . ': ' . $subject['name'],
                            'industry_evidence'   => round($raw_ind_pct * 100),
                            'student_evidence'    => round($raw_stud_pct * 100),
                            'combined_evidence'   => round($combined_score * 100),
                            'supporting_evidence' => array_slice($correctSubSkills, 0, 5),
                            'confidence'          => $confidence,
                            'explanation'         => "High industry demand for knowledge areas (" . implode(', ', array_slice($demandedDomains, 0, 3)) . "). Realign syllabus to ensure coverage of modern sub-skills such as " . implode(', ', array_slice($correctSubSkills, 0, 4)) . ".",
                        ];
                    }
                }
            }
        }


        $studentMatchScore = null;
        $industryMatchScore = null;
        if ($course && $curriculumAvailable) {
            $studentMatchScore = (int) round($this->calculateCosineSimilarity($curriculumDomains, $studentFrequencies));
            $industryMatchScore = (int) round($this->calculateCosineSimilarity($curriculumDomains, $industryFrequencies));
        }

        $academicEntryRequirements = $course ? $this->computeAcademicEntryRequirements($relevantIndustrySurveys) : null;

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
            
            // --- NEW AI DRIVEN INSIGHTS WIDGETS ---
            'career_readiness' => $this->calculateCareerReadiness($curriculumDomains, $course),
            'emerging_tech_alerts' => $this->calculateEmergingTechAlerts($relevantIndustrySurveys, $curriculumSubjects, $curriculumDomains),

            'coverage_percent' => $coveragePercent,
            'missing_subjects' => $missingSubjects,
            'outdated_subjects' => $curriculumAnomalies,
            'curriculum_enhancements' => $curriculumEnhancements,
            'low_demand_subjects' => [],
            

            'learning_preferences_data' => [
                'student_theory_percent' => $studentTheoryPercent,
                'student_practical_percent' => $studentPracticalPercent,
                'student_methods' => $studentPrefsFormatted,
                'industry_practices' => $industryPracticesFormatted,
                'certification_importance' => $certImportancePercent
            ],

            'kpis' => [
                'studentMatch' => $studentMatchScore,
                'industryMatch' => $industryMatchScore,
                'alignment' => $coveragePercent,
                'surveys' => $totalRelevant,
                'companies' => count($relevantIndustrySurveys) > 0 ? count(array_unique(array_filter(array_column(array_column($relevantIndustrySurveys, 'survey'), 'company_name')))) : 0,
                'courses' => \App\Models\Course::count(),
                'evidence_status' => $evidenceStatus,
                'confidence' => $confidence,
                'student_count' => $studentCount,
                'industry_count' => $industryCount,
                'avg_student_relevance' => round($avgStudentRelevance, 2),
                'avg_industry_relevance' => round($avgIndustryRelevance, 2),
                'curriculum_status' => ($course && !$curriculumAvailable) ? 'insufficient' : 'sufficient',
            ],
            'explainability' => [
                'student_surveys' => $studentAudit,
                'industry_surveys' => $industryAudit,
                'domain_matrix' => $domainMatrix,
            ],
            'academic_entry_requirements' => $academicEntryRequirements
        ];
    }


    /**
     * Compute education and result-class distributions from the already-accepted industry records.
     *
     * @param  array  $relevantIndustrySurveys
     * @return array
     */
    private function computeAcademicEntryRequirements(array $relevantIndustrySurveys): array
    {
        $accepted = count($relevantIndustrySurveys);

        if ($accepted === 0) {
            return [
                'accepted_industry_count'     => 0,
                'education_requirement_count' => 0,
                'result_requirement_count'    => 0,
                'education_distribution'      => [],
                'result_distribution'         => [],
                'cross_analysis'              => [],
                'evidence_confidence'         => 'insufficient',
                'summary'                     => 'No sufficient program-specific industry evidence.',
            ];
        }

        $eduCounts = [];
        $resultCounts = [];
        $crossCounts = [];

        $eduSpecifiedCount = 0;
        $resultSpecifiedCount = 0;

        foreach ($relevantIndustrySurveys as $item) {
            $survey = $item['survey'];

            $eduLabel = $this->normalizeMinimumQualification($survey->minimum_qualification ?? '');
            $resultLabel = $this->normalizeMinimumResult($survey->minimum_degree_result ?? '');

            $eduCounts[$eduLabel] = ($eduCounts[$eduLabel] ?? 0) + 1;
            if ($eduLabel !== 'Not Specified') {
                $eduSpecifiedCount++;
            }

            $resultCounts[$resultLabel] = ($resultCounts[$resultLabel] ?? 0) + 1;
            if ($resultLabel !== 'Not Specified') {
                $resultSpecifiedCount++;
            }

            if (!isset($crossCounts[$eduLabel])) {
                $crossCounts[$eduLabel] = [];
            }
            $crossCounts[$eduLabel][$resultLabel] = ($crossCounts[$eduLabel][$resultLabel] ?? 0) + 1;
        }

        arsort($eduCounts);
        $educationDistribution = [];
        foreach ($eduCounts as $label => $count) {
            $educationDistribution[] = [
                'label'      => $label,
                'count'      => $count,
                'percentage' => round(($count / $accepted) * 100, 1),
            ];
        }

        arsort($resultCounts);
        $resultDistribution = [];
        foreach ($resultCounts as $label => $count) {
            $resultDistribution[] = [
                'label'      => $label,
                'count'      => $count,
                'percentage' => round(($count / $accepted) * 100, 1),
            ];
        }

        $crossAnalysis = [];
        foreach ($crossCounts as $eduLabel => $resultMap) {
            $eduTotal = $eduCounts[$eduLabel];
            arsort($resultMap);
            $crossAnalysis[$eduLabel] = [];
            foreach ($resultMap as $resultLabel => $cnt) {
                $crossAnalysis[$eduLabel][] = [
                    'label'      => $resultLabel,
                    'count'      => $cnt,
                    'percentage' => round(($cnt / $eduTotal) * 100, 1),
                ];
            }
        }

        $minThreshold = config('analytics.thresholds.min_industry_responses', 5);
        $evidenceConfidence = $accepted >= $minThreshold ? 'sufficient' : 'limited';

        $summary = $this->buildAcademicEntrySummary(
            $accepted,
            $eduSpecifiedCount,
            $resultSpecifiedCount,
            $educationDistribution,
            $resultDistribution,
            $evidenceConfidence
        );

        return [
            'accepted_industry_count'     => $accepted,
            'education_requirement_count' => $eduSpecifiedCount,
            'result_requirement_count'    => $resultSpecifiedCount,
            'education_distribution'      => $educationDistribution,
            'result_distribution'         => $resultDistribution,
            'cross_analysis'              => $crossAnalysis,
            'evidence_confidence'         => $evidenceConfidence,
            'summary'                     => $summary,
        ];
    }

    private function normalizeMinimumQualification(string $raw): string
    {
        $raw = trim($raw);
        if ($raw === '' || strtolower($raw) === 'n/a' || strtolower($raw) === 'none') {
            return 'Not Specified';
        }

        $lower = strtolower($raw);

        if (str_contains($lower, 'phd') || str_contains($lower, 'doctor') || str_contains($lower, 'doctoral')) {
            return 'Doctoral Degree';
        }
        if (str_contains($lower, 'master') || str_contains($lower, "master's") || $lower === 'msc' || $lower === 'mba') {
            return "Master's Degree";
        }
        if (str_contains($lower, 'higher national diploma') || $lower === 'hnd') {
            return 'Higher National Diploma';
        }
        if (
            str_contains($lower, 'bachelor') ||
            str_contains($lower, "bachelor's") ||
            str_contains($lower, 'bsc') ||
            str_contains($lower, 'b.sc') ||
            str_contains($lower, 'ba ') ||
            $lower === 'degree' ||
            str_contains($lower, 'undergraduate')
        ) {
            return "Bachelor's Degree";
        }
        if (str_contains($lower, 'diploma')) {
            return 'Diploma';
        }
        if (str_contains($lower, 'certificate') || str_contains($lower, 'cert')) {
            return 'Certificate';
        }

        return 'Other';
    }

    private function normalizeMinimumResult(string $raw): string
    {
        $raw = trim($raw);
        if ($raw === '' || strtolower($raw) === 'n/a' || strtolower($raw) === 'none') {
            return 'Not Specified';
        }

        $lower = strtolower($raw);

        if (preg_match('/gpa\s*[:\-]?\s*3\.5/i', $raw) || preg_match('/3\.5\+/i', $raw)) {
            return 'GPA 3.5+';
        }
        if (preg_match('/gpa\s*[:\-]?\s*3\.[0-4]/i', $raw) || preg_match('/3\.0\+/i', $raw) || preg_match('/gpa\s*[:\-]?\s*3\.0/i', $raw)) {
            return 'GPA 3.0+';
        }
        if (preg_match('/gpa\s*[:\-]?\s*[0-9]/i', $raw)) {
            return 'GPA (Other)';
        }

        if (str_contains($lower, 'first class') || str_contains($lower, '1st class') || $lower === 'first') {
            return 'First Class';
        }
        if (str_contains($lower, 'upper second') || str_contains($lower, '2:1') || str_contains($lower, '2.1')) {
            return 'Upper Second Class (2:1)';
        }
        if (str_contains($lower, 'lower second') || str_contains($lower, '2:2') || str_contains($lower, '2.2')) {
            return 'Lower Second Class (2:2)';
        }
        if (str_contains($lower, 'pass') || str_contains($lower, 'third class') || str_contains($lower, '3rd class')) {
            return 'Pass Class';
        }
        if (str_contains($lower, 'distinction')) {
            return 'Distinction';
        }
        if (str_contains($lower, 'merit')) {
            return 'Merit';
        }

        return 'Other';
    }

    private function buildAcademicEntrySummary(
        int $accepted,
        int $eduSpecifiedCount,
        int $resultSpecifiedCount,
        array $educationDistribution,
        array $resultDistribution,
        string $evidenceConfidence
    ): string {
        if ($accepted === 0) {
            return 'No sufficient program-specific industry evidence.';
        }

        $limitedNote = $evidenceConfidence === 'limited'
            ? ' Note: evidence is limited due to the small number of accepted responses.'
            : '';

        $topEdu = !empty($educationDistribution) ? $educationDistribution[0] : null;
        $topResult = !empty($resultDistribution) ? $resultDistribution[0] : null;

        $parts = [];

        if ($topEdu && $topEdu['label'] !== 'Not Specified') {
            $parts[] = "Among the {$accepted} industry responses considered relevant to this program, "
                . "{$topEdu['label']} was the most frequently reported minimum qualification "
                . "({$topEdu['percentage']}% of accepted responses; {$eduSpecifiedCount} of {$accepted} responses specified a qualification).";
        } else {
            $parts[] = "Among the {$accepted} relevant industry responses, "
                . "minimum academic qualification data is largely unspecified ({$eduSpecifiedCount} responses provided a value).";
        }

        if ($topResult && $topResult['label'] !== 'Not Specified') {
            $second = isset($resultDistribution[1]) && $resultDistribution[1]['label'] !== 'Not Specified'
                ? " {$resultDistribution[1]['label']} was also observed at {$resultDistribution[1]['percentage']}%."
                : '';
            $parts[] = "The most frequently reported minimum result expectation was "
                . "{$topResult['label']}, appearing in {$topResult['percentage']}% of accepted responses"
                . " ({$resultSpecifiedCount} of {$accepted} responses specified a result expectation).{$second}";
        } else {
            $parts[] = "Minimum result/GPA expectation data is largely unspecified across these {$accepted} responses ({$resultSpecifiedCount} responses provided a value).";
        }

        if (count($educationDistribution) > 1) {
            $labels = array_slice(array_column($educationDistribution, 'label'), 1, 3);
            $parts[] = 'Other education levels reported include: ' . implode(', ', $labels) . '.';
        }

        $parts[] = 'Requirements therefore reflect the observed distribution within the accepted program-relevant industry responses and should not be treated as universal minimum thresholds.' . $limitedNote;

        return implode(' ', $parts);
    }

     
    public function normalizeText(string $text): string
    {
        $text = strtolower($text);

        $text = preg_replace('/[^a-z0-9\s]/', ' ', $text);

        return preg_replace('/\s+/', ' ', $text);
    }

     
    protected function tokenize(string $text): array
    {
        return array_filter(explode(' ', $text));
    }

     
    protected function removeStopWords(array $tokens): array
    {
        $stopWords = ['and', 'the', 'want', 'learn', 'should', 'with', 'would', 'also', 'about', 'to', 'in', 'of', 'for', 'a', 'an'];
        return array_diff($tokens, $stopWords);
    }

    public function preClassifySurveys(): void
    {
        $apiKey = config('services.gemini.key');
        if (!$apiKey) {
            return;
        }

        Log::info("Pre-classifying survey texts via Gemini API...");

        $texts = [];

        foreach (\App\AI\Models\StudentInterest::cursor() as $survey) {
            $t = trim(implode(' ', array_filter([
                $survey->primary_skills,
                $survey->secondary_skills,
                $survey->ternary_skills,
                $survey->new_program_suggestion
            ])));
            if ($t) $texts[] = $t;
            if ($survey->primary_skills) $texts[] = trim($survey->primary_skills);
            if ($survey->secondary_skills) $texts[] = trim($survey->secondary_skills);
            if ($survey->ternary_skills) $texts[] = trim($survey->ternary_skills);
        }


        foreach (\App\AI\Models\IndustryRequirement::cursor() as $survey) {
            $t = trim(implode(' ', array_filter([
                $survey->required_skills,
                $survey->emerging_fields,
                $survey->new_program_suggestion,
                $survey->graduate_skill_gaps
            ])));
            if ($t) $texts[] = $t;
            if ($survey->required_skills) $texts[] = trim($survey->required_skills);
            if ($survey->graduate_skill_gaps) $texts[] = trim($survey->graduate_skill_gaps);
        }

        $uniqueTexts = array_values(array_unique(array_filter($texts)));
        Log::info("Found " . count($uniqueTexts) . " unique survey texts to pre-classify.");

        if (empty($uniqueTexts)) {
            return;
        }

        // ── Level 1: Warm in-memory cache from DB so we never re-send already-known texts ──
        $alreadyCachedHashes = DomainClassification::whereIn(
            'text_hash',
            array_map(fn($t) => md5(trim($t)), $uniqueTexts)
        )->get(['text_hash', 'domains']);

        foreach ($alreadyCachedHashes as $row) {
            self::$geminiCache[$row->text_hash] = $row->domains ?? [];
        }
        Log::info("Loaded " . $alreadyCachedHashes->count() . " entries from persistent DB cache.");

        // ── Only send texts NOT already in DB or memory cache to Gemini ──
        $textsToClassify = array_values(array_filter($uniqueTexts, function ($t) {
            return !isset(self::$geminiCache[md5(trim($t))]);
        }));
        Log::info(count($textsToClassify) . " texts need Gemini classification (" . (count($uniqueTexts) - count($textsToClassify)) . " served from cache).");

        if (empty($textsToClassify)) {
            Log::info("All texts already cached — no Gemini API calls needed.");
            return;
        }

        $domainsList = array_keys($this->synonyms);
        $chunks = array_chunk($textsToClassify, 30);

        foreach ($chunks as $chunkIndex => $chunk) {
            Log::info("Sending batch " . ($chunkIndex + 1) . " of " . count($chunks) . " to Gemini...");
            
            try {
                $payload = [];
                foreach ($chunk as $idx => $txt) {
                    $payload[] = ['id' => $idx, 'text' => $txt];
                }

                $prompt = "You are an expert curriculum alignment classifier. Your task is to analyze the following list of survey responses and map each response to one or more academic/industry domains from this allowed list:\n"
                    . json_encode($domainsList) . "\n\n"
                    . "Here are the survey responses to classify:\n"
                    . json_encode($payload) . "\n\n"
                    . "Response format requirement: Return a raw JSON array containing objects with keys 'text' (exact match to input text) and 'domains' (array of strings from the allowed list). Do not write any conversational intro/outro text, code blocks, or markdown. Output only the raw valid JSON array.";

                $response = \Illuminate\Support\Facades\Http::post(
                    "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=" . $apiKey,
                    [
                        'contents' => [[
                            'parts' => [[
                                'text' => $prompt
                            ]]
                        ]],
                        'generationConfig' => [
                            'responseMimeType' => 'application/json'
                        ]
                    ]
                );

                if ($response->successful()) {
                    $responseText = $response->json('candidates.0.content.parts.0.text');
                    $results = json_decode(trim($responseText), true);
                    if (is_array($results)) {
                        $dbRows = [];
                        foreach ($results as $res) {
                            if (isset($res['text']) && isset($res['domains'])) {
                                $cacheKey = md5(trim($res['text']));
                                $domains  = array_values(array_unique(array_filter($res['domains'])));

                                // ── Store in memory cache (existing behaviour) ──
                                self::$geminiCache[$cacheKey] = $domains;

                                // ── Persist to DB (new: survives across requests) ──
                                $dbRows[] = [
                                    'text_hash'   => $cacheKey,
                                    'text_sample' => mb_substr(trim($res['text']), 0, 500),
                                    'domains'     => json_encode($domains),
                                    'hit_count'   => 0,
                                    'created_at'  => now(),
                                    'updated_at'  => now(),
                                ];
                            }
                        }
                        if (!empty($dbRows)) {
                            // upsert so duplicate runs never error — just update domains
                            DomainClassification::upsert(
                                $dbRows,
                                ['text_hash'],          // unique key
                                ['domains', 'updated_at'] // columns to update on conflict
                            );
                        }
                    }
                } else {
                    Log::error("Gemini batch call failed with status: " . $response->status() . " Body: " . $response->body());
                }
            } catch (\Exception $e) {
                Log::error("Error in Gemini batch pre-classification: " . $e->getMessage());
            }

            if (count($chunks) > 1 && $chunkIndex < count($chunks) - 1) {
                sleep(4);
            }
        }

        Log::info("Pre-classification completed. Memory cache: " . count(self::$geminiCache) . " entries.");
    }

    public function extractDomains(string $text): array
    {
        if (empty(trim($text))) {
            return [];
        }

        $cacheKey = md5(trim($text));
        $domains  = [];
        $apiKey   = config('services.gemini.key');

        if ($apiKey) {
            // ── Layer 1: In-memory cache (fastest, per-request) ──
            if (isset(self::$geminiCache[$cacheKey])) {
                $domains = self::$geminiCache[$cacheKey];

            // ── Layer 2: Persistent DB cache (survives across requests) ──
            } else {
                try {
                    $cached = DomainClassification::find($cacheKey);
                    if ($cached) {
                        $domains = $cached->domains ?? [];
                        // Warm memory cache so subsequent calls in this request are instant
                        self::$geminiCache[$cacheKey] = $domains;
                        // Increment hit counter (fire-and-forget, non-blocking)
                        $cached->increment('hit_count');
                    } else {
                        // ── Layer 3: Local regex fallback ──
                        $domains = $this->extractDomainsLocalRegex($text);
                    }
                } catch (\Exception $e) {
                    // DB unavailable — fall back gracefully, never crash
                    Log::warning('DomainClassification DB lookup failed, using local regex: ' . $e->getMessage());
                    $domains = $this->extractDomainsLocalRegex($text);
                }
            }
        } else {
            // No API key configured — always use local regex
            $domains = $this->extractDomainsLocalRegex($text);
        }

        $validatedDomains = [];
        foreach ($domains as $domain) {
            if ($this->validateDomainContext($domain, $text)) {
                $validatedDomains[] = $domain;
            }
        }
        return array_values(array_unique($validatedDomains));
    }

    public function extractDomainsLocalRegex(string $text): array
    {
        $normalized = $this->normalizeText($text);
        
        $matchedDomains = [];

        foreach ($this->synonyms as $domain => $keywords) {
            foreach ($keywords as $keyword) {
                $normalizedKeyword = $this->normalizeText($keyword);
                if (empty($normalizedKeyword)) {
                    continue;
                }

                $pattern = '/\b' . preg_quote($normalizedKeyword, '/') . '\b/i';
                if (preg_match($pattern, $normalized)) {
                    $matchedDomains[] = $domain;
                }
            }
        }

        return array_values(array_unique($matchedDomains));
    }

     
    protected function deduplicateDomains(array $domains): array
    {
        return array_values(array_unique($domains));
    }

     
    protected function countFrequency(array $domains): array
    {
        $frequencies = array_count_values($domains);
        arsort($frequencies);
        return $frequencies;
    }

     
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

     
    protected function formatDistribution(array $frequencies): array
    {
        $total = array_sum($frequencies) ?: 1;
        $distribution = [];
        

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

     
    public function classifyCourseField(\App\Models\Course $course): string
    {
        $text = strtolower($course->title . ' ' . $course->department);
        
        $fields = [
            'Computing & Information Technology' => ['computing', 'information technology', 'software', 'computer', 'it', 'programming', 'network', 'system'],
            'Accounting & Finance' => ['accounting', 'finance', 'audit', 'taxation', 'banking'],
            'Business & Management' => ['business', 'management', 'mba', 'administration', 'hr', 'human resource', 'entrepreneurship'],
            'Hospitality & Tourism' => ['hospitality', 'tourism', 'hotel', 'travel', 'event management'],
            'Marketing' => ['marketing', 'digital marketing', 'advertising', 'sales'],
            'Economics' => ['economics', 'macroeconomics', 'microeconomics'],
            'Psychology' => ['psychology', 'counseling', 'behavior'],
            'Media & Communication' => ['media', 'communication', 'journalism', 'public relations'],
            'Environmental Studies' => ['environmental', 'ecology', 'forestry'],
            'Architecture' => ['architecture', 'design', 'building'],
            'Mathematics & Statistics' => ['mathematics', 'statistics', 'math', 'actuarial'],
            'Education' => ['education', 'teaching', 'pedagogy'],
            'Arts & Humanities' => ['arts', 'humanities', 'english', 'history', 'philosophy'],
            'Social Science' => ['social science', 'sociology', 'anthropology'],
            'Engineering & Technology' => ['engineering', 'mechanical', 'civil', 'electrical', 'electronic'],
            'Medicine & Health Sciences' => ['medicine', 'health', 'nursing', 'medical', 'dental', 'pharmacy'],
            'Agriculture' => ['agriculture', 'farming', 'crop', 'horticulture'],
            'Law' => ['law', 'legal', 'jurisprudence'],
            'Science' => ['science', 'chemistry', 'physics', 'biology', 'zoology', 'botany']
        ];

        foreach ($fields as $fieldName => $keywords) {
            foreach ($keywords as $kw) {
                $pattern = '/\b' . preg_quote($kw, '/') . '\b/i';
                if (preg_match($pattern, $text)) {
                    return $fieldName;
                }
            }
        }

        return $course->department;
    }

     
    public function classifyCourseFields(\App\Models\Course $course): array
    {
        $course->loadMissing('semesters.subjects', 'category');
        $textParts = [$course->title, $course->department];
        if ($course->category) {
            $textParts[] = $course->category->name;
        }
        foreach ($course->semesters as $semester) {
            foreach ($semester->subjects as $subject) {
                $textParts[] = $subject->name;
            }
        }
        $fullText = strtolower(implode(' ', $textParts));

        $fields = [
            'Computing & Information Technology' => ['computing', 'information technology', 'software', 'computer', 'it', 'programming', 'network', 'system', 'database', 'developer'],
            'Accounting & Finance' => ['accounting', 'finance', 'audit', 'taxation', 'banking', 'accountant'],
            'Business & Management' => ['business', 'management', 'mba', 'administration', 'hr', 'human resource', 'entrepreneurship'],
            'Hospitality & Tourism' => ['hospitality', 'tourism', 'hotel', 'travel', 'event management'],
            'Marketing' => ['marketing', 'digital marketing', 'advertising', 'sales'],
            'Economics' => ['economics', 'macroeconomics', 'microeconomics'],
            'Psychology' => ['psychology', 'counseling', 'behavior'],
            'Media & Communication' => ['media', 'communication', 'journalism', 'public relations'],
            'Environmental Studies' => ['environmental', 'ecology', 'forestry'],
            'Architecture' => ['architecture', 'design', 'building'],
            'Mathematics & Statistics' => ['mathematics', 'statistics', 'math', 'actuarial'],
            'Education' => ['education', 'teaching', 'pedagogy'],
            'Arts & Humanities' => ['arts', 'humanities', 'english', 'history', 'philosophy', 'language', 'literature', 'creative writing'],
            'Social Science' => ['social science', 'sociology', 'anthropology'],
            'Engineering & Technology' => ['engineering', 'mechanical', 'civil', 'electrical', 'electronic', 'mechatronics'],
            'Medicine & Health Sciences' => ['medicine', 'health', 'nursing', 'medical', 'dental', 'pharmacy'],
            'Agriculture' => ['agriculture', 'farming', 'crop', 'horticulture'],
            'Law' => ['law', 'legal', 'jurisprudence'],
            'Science' => ['science', 'chemistry', 'physics', 'biology', 'zoology', 'botany']
        ];        $matchedFields = [];
        foreach ($fields as $fieldName => $keywords) {
            foreach ($keywords as $kw) {
                $pattern = '/\b' . preg_quote($kw, '/') . '\b/i';
                if (preg_match($pattern, $fullText)) {
                    $matchedFields[] = $fieldName;
                    break;
                }
            }
        }

        if (empty($matchedFields)) {
            $matchedFields[] = $course->department;
        }

        return array_unique($matchedFields);
    }

     
    protected function calculateCosineSimilarity(array $curriculumDomains, array $frequencies): float
    {
        if (empty($curriculumDomains) || empty($frequencies)) {
            return 0.0;
        }

        $dotProduct = 0.0;
        $normA = count($curriculumDomains); 
        $normB = 0.0;

        foreach ($frequencies as $domain => $count) {
            $normB += $count * $count;
            if (in_array($domain, $curriculumDomains)) {
                $dotProduct += 1.0 * $count;
            }
        }

        if ($normA === 0 || $normB === 0.0) {
            return 0.0;
        }

        return ($dotProduct / (sqrt($normA) * sqrt($normB))) * 100;
    }

     
    protected function calculateWeightedJaccard(array $setA, array $setB): array
    {
        $keysA = array_keys($setA);
        $keysB = array_keys($setB);
        $intersection = array_intersect($keysA, $keysB);
        $union = array_unique(array_merge($keysA, $keysB));

        $allKeys = array_unique(array_merge($keysA, $keysB));
        if (empty($allKeys)) {
            return [
                'intersection' => [],
                'union' => [],
                'overall_score' => 0
            ];
        }

        $sumMin = 0.0;
        $sumMax = 0.0;

        foreach ($allKeys as $key) {
            $valA = $setA[$key] ?? 0.0;
            $valB = $setB[$key] ?? 0.0;
            $sumMin += min($valA, $valB);
            $sumMax += max($valA, $valB);
        }

        $score = $sumMax > 0 ? ($sumMin / $sumMax) * 100 : 0.0;

        return [
            'intersection' => array_values($intersection),
            'union' => array_values($union),
            'overall_score' => (int) round($score)
        ];
    }

    public function isITCourse(\App\Models\Course $course): bool
    {
        $dept = strtolower($course->department);
        $title = strtolower($course->title);
        
        if (str_contains($dept, 'computing')) {
            return true;
        }
        
        $itKeywords = ['information technology', 'software engineering', 'computer network', 'python', 'web design', 'web development', 'cyber security', 'data science', 'artificial intelligence', 'devops', 'mobile development'];
        foreach ($itKeywords as $kw) {
            if (str_contains($title, $kw)) {
                return true;
            }
        }
        
        return false;
    }

    private function hasKeywords(string $text, array $keywords): bool
    {
        foreach ($keywords as $kw) {
            if (str_contains($text, $kw)) {
                return true;
            }
        }
        return false;
    }

    public function getRelatedSectorsForCourse(\App\Models\Course $course): array
    {
        $title = strtolower($course->title);
        $dept = strtolower($course->department);
        $cat = $course->category ? strtolower($course->category->name) : '';
        $fullText = "$title $dept $cat";

        $sectors = [];

        if ($this->hasKeywords($fullText, ['computer', 'software', 'network', 'programming', 'it', 'information technology', 'computing', 'devops', 'python', 'web design', 'web development', 'cyber security', 'data science', 'artificial intelligence', 'mobile development'])) {
            $sectors[] = 'Information Technology';
            $sectors[] = 'Telecommunications';
        }

        if ($this->hasKeywords($fullText, ['business', 'management', 'administration', 'mba', 'hr', 'human resource', 'entrepreneurship'])) {
            $sectors[] = 'Finance & Banking';
            $sectors[] = 'Management Consulting';
            if ($this->hasKeywords($fullText, ['e-business', 'digital'])) {
                $sectors[] = 'Information Technology';
            }
        }

        if ($this->hasKeywords($fullText, ['accounting', 'finance', 'banking', 'audit', 'taxation'])) {
            $sectors[] = 'Finance & Banking';
            $sectors[] = 'Professional Services';
        }

        if ($this->hasKeywords($fullText, ['graphic', 'design', 'art', 'fine arts', 'illustration', 'multimedia'])) {
            $sectors[] = 'Creative Arts & Design';
            $sectors[] = 'Marketing & Advertising';
        }

        if ($this->hasKeywords($fullText, ['english', 'language', 'spoken', 'translation', 'literature', 'communication', 'media', 'journalism'])) {
            $sectors[] = 'Education';
            $sectors[] = 'Media & Entertainment';
        }

        if ($this->hasKeywords($fullText, ['agriculture', 'agri', 'farming', 'crop', 'animal', 'forestry', 'environmental'])) {
            $sectors[] = 'Agriculture & Forestry';
            $sectors[] = 'Environmental Services';
        }

        if ($this->hasKeywords($fullText, ['hospitality', 'tourism', 'hotel', 'travel', 'event'])) {
            $sectors[] = 'Tourism & Hospitality';
        }

        if (empty($sectors)) {
            $sectors = ['Professional Services'];
        }

        return array_values(array_unique($sectors));
    }

    public function getRelatedInterestsForCourse(\App\Models\Course $course): array
    {
        $title = strtolower($course->title);
        $dept = strtolower($course->department);
        $cat = $course->category ? strtolower($course->category->name) : '';
        $fullText = "$title $dept $cat";

        $interests = [];

        if ($this->hasKeywords($fullText, ['computer', 'software', 'network', 'programming', 'it', 'information technology', 'computing', 'devops', 'python', 'web design', 'web development', 'cyber security', 'data science', 'artificial intelligence', 'mobile development'])) {
            $interests = array_merge($interests, ['Computing & Information Technology', 'Cloud Computing', 'Data Science', 'Artificial Intelligence', 'Web Development', 'Cyber Security', 'DevOps', 'Mobile Development', 'UI/UX Design']);
        }

        if ($this->hasKeywords($fullText, ['business', 'management', 'administration', 'mba', 'hr', 'human resource', 'entrepreneurship'])) {
            $interests[] = 'Business & Management';
            $interests[] = 'Marketing';
            $interests[] = 'Economics';
            $interests[] = 'Entrepreneurship';
            if ($this->hasKeywords($fullText, ['e-business', 'digital'])) {
                $interests[] = 'UI/UX Design';
                $interests[] = 'Web Development';
            }
        }

        if ($this->hasKeywords($fullText, ['accounting', 'finance', 'banking', 'audit', 'taxation'])) {
            $interests[] = 'Accounting & Finance';
            $interests[] = 'Business & Management';
            $interests[] = 'Economics';
        }

        if ($this->hasKeywords($fullText, ['graphic', 'design', 'art', 'fine arts', 'illustration', 'multimedia'])) {
            $interests[] = 'Arts & Humanities';
            $interests[] = 'UI/UX Design';
            $interests[] = 'Media & Communication';
        }

        if ($this->hasKeywords($fullText, ['english', 'language', 'spoken', 'translation', 'literature', 'communication', 'media', 'journalism'])) {
            $interests[] = 'Arts & Humanities';
            $interests[] = 'Media & Communication';
            $interests[] = 'Education';
        }

        if ($this->hasKeywords($fullText, ['agriculture', 'agri', 'farming', 'crop', 'animal', 'forestry', 'environmental'])) {
            $interests[] = 'Agriculture';
            $interests[] = 'Environmental Studies';
            $interests[] = 'Science';
        }

        if ($this->hasKeywords($fullText, ['hospitality', 'tourism', 'hotel', 'travel', 'event'])) {
            $interests[] = 'Hospitality & Tourism';
            $interests[] = 'Business & Management';
        }

        if (empty($interests)) {
            $interests = ['Business & Management', 'Arts & Humanities'];
        }

        return array_values(array_unique($interests));
    }

    public function getRelatedSubDisciplinesForCourse(\App\Models\Course $course): array
    {
        $title = strtolower($course->title);
        $dept = strtolower($course->department);
        $cat = $course->category ? strtolower($course->category->name) : '';
        $fullText = "$title $dept $cat";

        $fields = [];

        if ($this->hasKeywords($fullText, ['computer', 'software', 'network', 'programming', 'it', 'information technology', 'computing', 'devops', 'python', 'web design', 'web development', 'cyber security', 'data science', 'artificial intelligence', 'mobile development'])) {
            $fields = array_merge($fields, ['Cloud Computing', 'Web Development', 'Data Science', 'Cyber Security', 'Mobile Development', 'DevOps', 'Artificial Intelligence']);
        }

        if ($this->hasKeywords($fullText, ['business', 'management', 'administration', 'mba', 'hr', 'human resource', 'entrepreneurship'])) {
            $fields[] = 'Business & Management';
            $fields[] = 'Marketing';
            if ($this->hasKeywords($fullText, ['e-business', 'digital'])) {
                $fields[] = 'Web Development';
            }
        }

        if ($this->hasKeywords($fullText, ['accounting', 'finance', 'banking', 'audit', 'taxation'])) {
            $fields[] = 'Accounting & Finance';
        }

        if ($this->hasKeywords($fullText, ['graphic', 'design', 'art', 'fine arts', 'illustration', 'multimedia'])) {
            $fields[] = 'UI/UX Design';
            $fields[] = 'Arts & Humanities';
        }

        if ($this->hasKeywords($fullText, ['english', 'language', 'spoken', 'translation', 'literature', 'communication', 'media', 'journalism'])) {
            $fields[] = 'Arts & Humanities';
            $fields[] = 'Media & Communication';
        }

        if ($this->hasKeywords($fullText, ['agriculture', 'agri', 'farming', 'crop', 'animal', 'forestry', 'environmental'])) {
            $fields[] = 'Agriculture';
            $fields[] = 'Environmental Studies';
        }

        if ($this->hasKeywords($fullText, ['hospitality', 'tourism', 'hotel', 'travel', 'event'])) {
            $fields[] = 'Hospitality & Tourism';
        }

        if (empty($fields)) {
            $fields = ['Business & Management'];
        }

        return array_values(array_unique($fields));
    }

    public function areSkillsRelatedToCurriculum(string $skillsText, array $curriculumSubjects, ?\App\Models\Course $course = null): bool
    {
        $skillsText = strtolower($skillsText);
        $skills = array_filter(array_map('trim', preg_split('/[\s,;]+/', $skillsText)));
        if (empty($skills)) {
            return false;
        }


        $subjectToSkillsMap = [
            'management' => ['management', 'leadership', 'strategy', 'hr', 'human resource', 'organization', 'behavior'],
            'marketing' => ['marketing', 'sales', 'seo', 'sem', 'branding', 'social media', 'advertising', 'consumer'],
            'accounting' => ['accounting', 'finance', 'audit', 'tax', 'bookkeeping', 'excel', 'ledger'],
            'finance' => ['finance', 'banking', 'investment', 'excel'],
            'economics' => ['economics', 'microeconomics', 'macroeconomics'],
            'information systems' => ['mis', 'database', 'sql', 'system', 'systems'],
            'e-commerce' => ['ecommerce', 'e-commerce', 'web', 'marketing', 'online', 'shopify'],
            'e-business' => ['ebusiness', 'e-business', 'strategy', 'web', 'digital'],
            'business' => ['business', 'management', 'entrepreneurship', 'strategy'],
            'web development' => ['html', 'css', 'javascript', 'js', 'react', 'php', 'web', 'frontend', 'backend', 'fullstack'],
            'web design' => ['html', 'css', 'javascript', 'js', 'photoshop', 'figma', 'design', 'web'],
            'graphic design' => ['photoshop', 'illustrator', 'indesign', 'figma', 'graphic', 'design', 'coreldraw', 'ui/ux'],
            'software engineering' => ['programming', 'software', 'java', 'python', 'c++', 'c#', 'c', 'oop', 'git', 'coding'],
            'computer networks' => ['networking', 'networks', 'cisco', 'ccna', 'tcp', 'ip', 'dns', 'router'],
            'python programming' => ['python', 'programming', 'coding', 'scripting'],
            'english' => ['english', 'speaking', 'writing', 'reading', 'communication', 'literature', 'grammar'],
            'communication' => ['communication', 'presentation', 'english', 'writing'],
            'agriculture' => ['agriculture', 'agri', 'farming', 'crop', 'soil', 'pest'],
            'agribusiness' => ['agribusiness', 'agriculture', 'farming', 'management', 'business'],
            'hospitality' => ['hospitality', 'hotel', 'tourism', 'event', 'service'],
            'tourism' => ['tourism', 'travel', 'hotel', 'hospitality', 'event'],
        ];


        if (empty($curriculumSubjects)) {
            $profileText = strtolower($course->title . ' ' . $course->department);
            foreach ($skills as $skill) {
                if (empty($skill) || strlen($skill) < 2) continue;
                if (str_contains($profileText, $skill)) {
                    return true;
                }
                foreach ($subjectToSkillsMap as $key => $associatedSkills) {
                    if (str_contains($profileText, $key) && in_array($skill, $associatedSkills)) {
                        return true;
                    }
                }
            }
            return false;
        }

        foreach ($curriculumSubjects as $subject) {
            $subjectName = strtolower($subject['name']);
            foreach ($skills as $skill) {
                if (empty($skill) || strlen($skill) < 2) continue;
                if (str_contains($subjectName, $skill) || str_contains($skill, $subjectName)) {
                    return true;
                }
                foreach ($subjectToSkillsMap as $key => $associatedSkills) {
                    if (str_contains($subjectName, $key) && in_array($skill, $associatedSkills)) {
                        return true;
                    }
                }
            }
        }

        return false;
    }

    private function getCurriculumCoverageStatus(string $domain, array $curriculumSubjects): array
    {
        $domainLower = strtolower($domain);
        $synonyms = $this->synonyms[$domain] ?? [];
        
        $directMatch = false;
        $equivalentMatch = false;
        $matchedSubject = null;

        foreach ($curriculumSubjects as $subject) {
            $subNameLower = strtolower($subject['name']);
            
            // ── Layer 1: Smart Local/Gemini Domain Extraction on Subject Name ──
            $subDomains = $this->extractDomains($subject['name']);
            if (in_array($domain, $subDomains)) {
                $directMatch = true;
                $matchedSubject = $subject['code'] . ': ' . $subject['name'];
                break;
            }

            // ── Layer 2: String boundary fallback ──
            if (str_contains($subNameLower, $domainLower)) {
                $directMatch = true;
                $matchedSubject = $subject['code'] . ': ' . $subject['name'];
                break;
            }

            // ── Layer 3: Synonym string fallback ──
            foreach ($synonyms as $syn) {
                if (empty($syn) || strlen($syn) < 3) continue;
                if (str_contains($subNameLower, strtolower($syn))) {
                    $equivalentMatch = true;
                    $matchedSubject = $subject['code'] . ': ' . $subject['name'];
                    break;
                }
            }
        }

        if ($directMatch) {
            return ['status' => 'Directly Covered', 'subject' => $matchedSubject];
        }
        if ($equivalentMatch) {
            return ['status' => 'Covered by Equivalent Subject', 'subject' => $matchedSubject];
        }


        $subNames = array_map(fn($s) => strtolower($s['name']), $curriculumSubjects);
        
        if ($domain === 'Data Science' || $domain === 'Data Analytics') {
            $hasStats = false;
            $hasMIS = false;
            $hasResearch = false;
            foreach ($subNames as $name) {
                if (str_contains($name, 'statistics')) $hasStats = true;
                if (str_contains($name, 'information system') || str_contains($name, 'mis')) $hasMIS = true;
                if (str_contains($name, 'research method')) $hasResearch = true;
            }
            if ($hasStats && ($hasMIS || $hasResearch)) {
                return ['status' => 'Embedded Coverage', 'subject' => 'Multiple Subjects (Statistics/MIS/Research)'];
            }
        }

        if ($domain === 'Web Development') {
            $hasEcom = false;
            $hasMIS = false;
            foreach ($subNames as $name) {
                if (str_contains($name, 'e-commerce') || str_contains($name, 'e-business')) $hasEcom = true;
                if (str_contains($name, 'information system') || str_contains($name, 'mis')) $hasMIS = true;
            }
            if ($hasEcom && $hasMIS) {
                return ['status' => 'Embedded Coverage', 'subject' => 'Multiple Subjects (E-Commerce/MIS)'];
            }
        }

        if ($domain === 'Law') {
            $hasLaw = false;
            $hasEthics = false;
            foreach ($subNames as $name) {
                if (str_contains($name, 'law') || str_contains($name, 'legal')) $hasLaw = true;
                if (str_contains($name, 'ethics')) $hasEthics = true;
            }
            if ($hasLaw || $hasEthics) {
                return ['status' => 'Embedded Coverage', 'subject' => 'Multiple Subjects (Law/Ethics)'];
            }
        }

        return ['status' => 'Not Covered', 'subject' => null];
    }

    private function getAcademicallyRelevantDomains(array $relatedInterests): array
    {
        $relevant = $relatedInterests;


        if (in_array('Computing & Information Technology', $relatedInterests)) {
            $relevant = array_merge($relevant, [
                'Computing & Information Technology', 'Cloud Computing', 'Data Science', 
                'Artificial Intelligence', 'Web Development', 'Cyber Security', 
                'DevOps', 'Mobile Development', 'UI/UX Design'
            ]);
        }
        
        if (in_array('Web Development', $relatedInterests)) {
            $relevant = array_merge($relevant, ['Web Development', 'UI/UX Design', 'Cloud Computing']);
        }
        
        if (in_array('UI/UX Design', $relatedInterests)) {
            $relevant = array_merge($relevant, ['UI/UX Design', 'Web Development']);
        }
        
        if (in_array('Data Science', $relatedInterests)) {
            $relevant = array_merge($relevant, ['Data Science', 'Mathematics & Statistics', 'Business & Management']);
        }

        return array_values(array_unique($relevant));
    }

    private function validateDomainContext(string $domain, string $text): bool
    {
        $textLower = strtolower($text);
        
        $genericMap = [
            'Law' => [
                'generic' => ['ethics'],
                'context' => ['law', 'legal', 'jurisprudence', 'court', 'rights', 'statute', 'regulation']
            ],
            'Cyber Security' => [
                'generic' => ['security'],
                'context' => ['cyber', 'network', 'information', 'hacking', 'penetration', 'firewall', 'cryptography', 'threat']
            ],
            'Data Science' => [
                'generic' => ['data'],
                'context' => ['science', 'analytics', 'analysis', 'big data', 'pandas', 'numpy', 'r programming', 'power bi', 'visualization']
            ],
            'Business & Management' => [
                'generic' => ['management'],
                'context' => ['business', 'hr', 'human resource', 'strategy', 'administration', 'entrepreneurship', 'leadership']
            ],
            'Computing & Information Technology' => [
                'generic' => ['technology', 'computer'],
                'context' => ['computing', 'information', 'software', 'programming', 'network', 'system', 'database', 'developer', 'it', 'code']
            ],
            'Marketing' => [
                'generic' => ['digital'],
                'context' => ['marketing', 'advertising', 'sales', 'e-commerce', 'e-business', 'retail', 'brand', 'branding']
            ],
            'Media & Communication' => [
                'generic' => ['communication'],
                'context' => ['media', 'journalism', 'public relations', 'broadcasting', 'video', 'news']
            ],
            'Arts & Humanities' => [
                'generic' => ['research'],
                'context' => ['arts', 'humanities', 'english', 'history', 'philosophy', 'literature', 'creative']
            ]
        ];

        if (!isset($genericMap[$domain])) {
            return true;
        }

        $rules = $genericMap[$domain];
        

        $hasGeneric = false;
        foreach ($rules['generic'] as $gen) {
            if (preg_match('/\b' . preg_quote($gen, '/') . '\b/i', $textLower)) {
                $hasGeneric = true;
                break;
            }
        }


        if ($hasGeneric) {

            $synonyms = $this->synonyms[$domain] ?? [];
            foreach ($synonyms as $syn) {
                $isGenSyn = in_array(strtolower($syn), $rules['generic']);
                if (!$isGenSyn && preg_match('/\b' . preg_quote(strtolower($syn), '/') . '\b/i', $textLower)) {
                    return true; 
                }
            }
            

            foreach ($rules['context'] as $ctx) {
                if (preg_match('/\b' . preg_quote($ctx, '/') . '\b/i', $textLower)) {
                    return true;
                }
            }
            
            return false;
        }

        return true;
    }

     
    private function evaluateStudentRelevance($survey, array $profile): array
    {
        $reasons = [];
        $matchedInterestLevel = null;
        $interestWeight = 0.0;

        $excludedDomains   = $profile['excluded_domains'];
        $coreDomains       = $profile['core_domains'];
        $acceptedDomains   = array_merge($coreDomains, $profile['adjacent_domains'], $profile['emerging_domains']);
        $curriculumSubjects = $profile['curriculum_subjects'];

        $primaryInterest   = $survey->primary_interest   ?? '';
        $secondaryInterest = $survey->secondary_interest ?? '';
        $ternaryInterest   = $survey->ternary_interest   ?? '';


        if ($primaryInterest && in_array($primaryInterest, $excludedDomains)) {
            return [
                'accepted' => false,
                'reason'   => 'primary interest "' . $primaryInterest . '" is excluded for this program type (' . $profile['program_type'] . ')',
                'weight'   => 0.0, 'skills' => '', 'methods' => '', 'balance' => '', 'score' => 0.0
            ];
        }


        if ($primaryInterest && in_array($primaryInterest, $acceptedDomains)) {
            $matchedInterestLevel = 'primary';

            $interestWeight = in_array($primaryInterest, $coreDomains) ? 1.0 : 0.70;
            $reasons[] = in_array($primaryInterest, $coreDomains) ? 'Core Primary Interest' : 'Adjacent Primary Interest';
        } elseif ($secondaryInterest && in_array($secondaryInterest, $acceptedDomains) && !in_array($secondaryInterest, $excludedDomains)) {
            $matchedInterestLevel = 'secondary';
            $interestWeight = in_array($secondaryInterest, $coreDomains) ? 0.6 : 0.4;
            $reasons[] = 'Secondary Program Interest';
        } elseif ($ternaryInterest && in_array($ternaryInterest, $acceptedDomains) && !in_array($ternaryInterest, $excludedDomains)) {
            $matchedInterestLevel = 'ternary';
            $interestWeight = 0.3;
            $reasons[] = 'Ternary Program Interest';
        }

        if (!$matchedInterestLevel) {
            return [
                'accepted' => false,
                'reason'   => 'no program-compatible interest found (primary: "' . $primaryInterest . '")',
                'weight'   => 0.0, 'skills' => '', 'methods' => '', 'balance' => '', 'score' => 0.0
            ];
        }


        $skills  = '';
        $methods = '';
        $balance = '';
        if ($matchedInterestLevel === 'primary') {
            $skills  = $survey->primary_skills;
            $methods = $survey->primary_learning_methods;
            $balance = $survey->primary_learning_balance;
        } elseif ($matchedInterestLevel === 'secondary') {
            $skills  = $survey->secondary_skills;
            $methods = $survey->secondary_learning_methods;
            $balance = $survey->secondary_learning_balance;
        } else {
            $skills  = $survey->ternary_skills;
            $methods = $survey->ternary_learning_methods;
            $balance = $survey->ternary_learning_balance;
        }

        if ($this->containsOnlyGenericTokens($skills ?? '')) {
            return [
                'accepted' => false,
                'reason'   => 'skills at matched interest level contain only generic tokens',
                'weight'   => 0.0, 'skills' => $skills, 'methods' => $methods, 'balance' => $balance, 'score' => 0.0
            ];
        }

        $skillsMatch = $this->areSkillsRelatedToCurriculum($skills ?? '', $curriculumSubjects);
        if ($skillsMatch) {
            $reasons[] = 'Curriculum Skill Match';
        }

        $relevanceScore    = ($interestWeight * 0.70) + ($skillsMatch ? 0.30 : 0.0);
        $minRelevanceScore = config('analytics.thresholds.min_relevance_score', 0.35);

        if ($relevanceScore < $minRelevanceScore) {
            return [
                'accepted' => false,
                'reason'   => 'insufficient relevance score: ' . round($relevanceScore, 2) . ' < threshold ' . $minRelevanceScore,
                'weight'   => 0.0, 'skills' => $skills, 'methods' => $methods, 'balance' => $balance, 'score' => $relevanceScore
            ];
        }

        return [
            'accepted' => true,
            'reason'   => implode(' + ', $reasons),
            'weight'   => $interestWeight,
            'skills'   => $skills,
            'methods'  => $methods,
            'balance'  => $balance,
            'score'    => $relevanceScore
        ];
    }

     
    private function evaluateIndustryRelevance($survey, array $profile): array
    {
        $reasons = [];


        if (!in_array($survey->industry_sector, $profile['related_sectors'])) {
            return [
                'accepted' => false,
                'reason'   => 'Stage 1 FAIL: sector "' . ($survey->industry_sector ?? '') . '" not in [' . implode(', ', $profile['related_sectors']) . ']',
                'score'    => 0.0,
            ];
        }
        $sectorScore = 0.25;
        $reasons[]   = 'Sector Match';


        $surveyFields = array_filter([
            $survey->primary_academic_field,
            $survey->secondary_academic_field,
            $survey->third_academic_field,
        ]);
        $allProgramDomains = array_merge($profile['core_domains'], $profile['adjacent_domains'], $profile['emerging_domains']);
        $matchedFields = array_intersect($surveyFields, $allProgramDomains);

        if (empty($matchedFields)) {
            return [
                'accepted' => false,
                'reason'   => 'Stage 2 FAIL: academic fields [' . implode(', ', $surveyFields) . '] not in program domains',
                'score'    => $sectorScore,
            ];
        }
        $fieldScore = in_array($survey->primary_academic_field ?? '', $profile['core_domains']) ? 0.25 : 0.15;
        $reasons[] = 'Discipline Match';





        $surveyFullText = trim(implode(' ', array_filter([
            $survey->required_skills,
            $survey->emerging_fields,
            $survey->graduate_skill_gaps,
        ])));
        $detectedDomains = !empty($surveyFullText) ? $this->extractDomainsLocalRegex($surveyFullText) : [];

        if (!empty($detectedDomains) && !empty($profile['excluded_domains'])) {
            $nonExcludedDomains = array_diff($detectedDomains, $profile['excluded_domains']);
            if (empty($nonExcludedDomains)) {

                return [
                    'accepted' => false,
                    'reason'   => 'Stage 3 FAIL: all detected domains [' . implode(', ', $detectedDomains) . '] are excluded for ' . $profile['program_type'],
                    'score'    => $sectorScore + $fieldScore,
                ];
            }

            $coreOrAdjacentDomains = array_merge($profile['core_domains'], $profile['adjacent_domains']);
            $relevantDomains = array_intersect($detectedDomains, $coreOrAdjacentDomains);
            if (empty($relevantDomains)) {
                return [
                    'accepted' => false,
                    'reason'   => 'Stage 3 FAIL: no detected domain in [' . implode(', ', $detectedDomains) . '] falls within core/adjacent program domains',
                    'score'    => $sectorScore + $fieldScore,
                ];
            }
        }
        $reasons[] = 'Domain Boundary OK';


        $skills = $survey->required_skills ?? '';
        if ($this->containsOnlyGenericTokens($skills)) {
            return [
                'accepted' => false,
                'reason'   => 'Stage 4 FAIL: required_skills contain only generic tokens',
                'score'    => $sectorScore + $fieldScore,
            ];
        }


        $skillsScore = 0.0;
        if ($this->areSkillsRelatedToCurriculum($skills, $profile['curriculum_subjects'])) {
            $skillsScore = 0.35;
            $reasons[]   = 'Curriculum Skill Match';
        }

        $emergingScore = 0.0;
        $emergingText  = trim(implode(' ', array_filter([
            $survey->emerging_fields,
            $survey->new_program_suggestion,
            $survey->graduate_skill_gaps,
        ])));
        if ($emergingText && $this->areSkillsRelatedToCurriculum($emergingText, $profile['curriculum_subjects'])) {
            $emergingScore = 0.15;
            $reasons[]     = 'Adjacent Domain Match';
        }

        $relevanceScore    = $sectorScore + $fieldScore + $skillsScore + $emergingScore;
        $minRelevanceScore = config('analytics.thresholds.min_relevance_score', 0.35);

        if ($relevanceScore < $minRelevanceScore) {
            return [
                'accepted' => false,
                'reason'   => 'Stage 5 FAIL: score ' . round($relevanceScore, 2) . ' < threshold ' . $minRelevanceScore,
                'score'    => $relevanceScore,
            ];
        }

        return [
            'accepted' => true,
            'reason'   => implode(' + ', $reasons),
            'score'    => $relevanceScore,
        ];
    }

    private function containsOnlyGenericTokens(string $skillsText): bool
    {
        $skillsText = strtolower($skillsText);
        $tokens = array_filter(array_map('trim', preg_split('/[\s,;]+/', $skillsText)));
        if (empty($tokens)) {
            return false;
        }

        $genericWords = [
            'ethics', 'data', 'security', 'management', 'technology', 'communication',
            'research', 'strategy', 'digital', 'computer', 'ml', 'ai', 'it', 'ict',
            'skills', 'knowledge', 'system', 'systems', 'analysis', 'development',
            'technical', 'programming', 'software', 'hardware', 'network', 'networks',
        ];
        
        foreach ($tokens as $tok) {
            if (!in_array($tok, $genericWords)) {
                return false;
            }
        }

        return true;
    }

     
    private function buildProgramProfile(\App\Models\Course $course, array $curriculumSubjects): array
    {
        $titleText = strtolower(trim(implode(' ', array_filter([
            $course->title,
            $course->department,
            $course->category ? $course->category->name : '',
        ]))));

        $programType      = $this->detectProgramType($titleText);
        $boundaries       = $this->getDomainBoundaries($programType);
        $relatedSectors   = $this->getSectorsForProgramType($programType);
        $relatedDisciplines = array_values(array_unique(array_merge(
            $boundaries['core_domains'],
            $boundaries['adjacent_domains']
        )));

        return [
            'title'               => $course->title,
            'code'                => $course->code,
            'level'               => $course->level,
            'department'          => $course->department,
            'category'            => $course->category ? $course->category->name : '',
            'program_type'        => $programType,
            'curriculum_subjects' => $curriculumSubjects,
            'core_domains'        => $boundaries['core_domains'],
            'adjacent_domains'    => $boundaries['adjacent_domains'],
            'emerging_domains'    => $boundaries['emerging_domains'],
            'excluded_domains'    => $boundaries['excluded_domains'],
            'related_sectors'     => $relatedSectors,
            'related_disciplines' => $relatedDisciplines,
        ];
    }

     
    private function detectProgramType(string $titleText): string
    {

        if (preg_match('/\b(e-?business|e-?commerce|digital\s+business)\b/i', $titleText)
            && preg_match('/\b(business|bba|management|administration)\b/i', $titleText)) {
            return 'e_business';
        }

        if (preg_match('/\b(web\s+design|web\s+development|frontend|front.?end\s+dev)\b/i', $titleText)) {
            return 'web_design_development';
        }

        if (preg_match('/\b(graphic\s+design|fine\s+arts?|illustration|multimedia\s+design|visual\s+arts?)\b/i', $titleText)) {
            return 'graphic_design';
        }

        if (preg_match('/\b(software\s+engineering|software\s+development)\b/i', $titleText)) {
            return 'software_engineering';
        }

        if (preg_match('/\b(cyber\s+security|cybersecurity|information\s+security)\b/i', $titleText)) {
            return 'cyber_security';
        }

        if (preg_match('/\b(data\s+science|machine\s+learning|artificial\s+intelligence)\b/i', $titleText)) {
            return 'data_science_ai';
        }

        if (preg_match('/\b(devops|cloud\s+computing|cloud\s+infrastructure)\b/i', $titleText)) {
            return 'devops_cloud';
        }

        if (preg_match('/\b(mobile\s+(development|application|computing)|android\s+dev|ios\s+dev)\b/i', $titleText)) {
            return 'mobile_development';
        }

        if (preg_match('/\b(python\s+programming|python\s+development)\b/i', $titleText)) {
            return 'python_programming';
        }

        if (preg_match('/\b(information\s+technology|computing|computer\s+science)\b/i', $titleText)
            && !preg_match('/\b(accounting|business|marketing|management|english)\b/i', $titleText)) {
            return 'information_technology';
        }

        if (preg_match('/\b(computer\s+network|networking|telecommunication)\b/i', $titleText)) {
            return 'networking';
        }

        if (preg_match('/\b(accounting|accountancy|finance|financial|audit|taxation|banking)\b/i', $titleText)) {
            return 'accounting_finance';
        }

        if (preg_match('/\b(agribusiness|agri.?management|agricultural\s+(business|management))\b/i', $titleText)) {
            return 'agribusiness';
        }

        if (preg_match('/\b(agriculture|agricultural|farming|horticulture|animal\s+science|crop\s+science)\b/i', $titleText)) {
            return 'agriculture';
        }

        if (preg_match('/\b(law|legal\s+studies|jurisprudence)\b/i', $titleText)) {
            return 'law';
        }

        if (preg_match('/\b(marketing|digital\s+marketing|advertising)\b/i', $titleText)) {
            return 'marketing';
        }

        if (preg_match('/\b(business|bba|mba|management|administration|human\s+resource|entrepreneurship)\b/i', $titleText)) {
            return 'business_management';
        }

        if (preg_match('/\b(english|spoken\s+english|language|linguistics|literature|translation|esl)\b/i', $titleText)) {
            return 'languages_arts';
        }

        if (preg_match('/\b(media|journalism|communication|broadcasting|public\s+relations)\b/i', $titleText)) {
            return 'media_communication';
        }

        if (preg_match('/\b(hospitality|tourism|hotel|travel\s+management|event\s+management)\b/i', $titleText)) {
            return 'hospitality_tourism';
        }

        if (preg_match('/\b(economics|macroeconomics|microeconomics)\b/i', $titleText)) {
            return 'economics';
        }

        if (preg_match('/\b(education|teaching|pedagogy|teacher\s+training)\b/i', $titleText)) {
            return 'education';
        }

        if (preg_match('/\b(psychology|counseling|counselling|behavioral\s+science)\b/i', $titleText)) {
            return 'psychology';
        }

        return 'general'; 
    }

     
    private function getDomainBoundaries(string $programType): array
    {
        $map = [
            'web_design_development' => [
                'core_domains'     => ['Web Development', 'UI/UX Design', 'Computing & Information Technology'],
                'adjacent_domains' => ['Media & Communication', 'Arts & Humanities', 'Mobile Development'],
                'emerging_domains' => ['Artificial Intelligence'],
                'excluded_domains' => [
                    'DevOps', 'Cloud Computing', 'Data Science', 'Cyber Security',
                    'Business & Management', 'Accounting & Finance', 'Agriculture',
                    'Law', 'Economics', 'Mathematics & Statistics',
                ],
            ],
            'graphic_design' => [
                'core_domains'     => ['UI/UX Design', 'Arts & Humanities', 'Media & Communication'],
                'adjacent_domains' => ['Web Development', 'Computing & Information Technology'],
                'emerging_domains' => ['Artificial Intelligence'],
                'excluded_domains' => [
                    'DevOps', 'Cloud Computing', 'Data Science', 'Cyber Security',
                    'Mobile Development', 'Business & Management', 'Accounting & Finance',
                    'Agriculture', 'Law', 'Economics', 'Mathematics & Statistics',
                ],
            ],
            'software_engineering' => [
                'core_domains'     => ['Computing & Information Technology', 'Web Development', 'DevOps'],
                'adjacent_domains' => ['Cloud Computing', 'Data Science', 'Artificial Intelligence', 'Cyber Security', 'Mobile Development', 'Mathematics & Statistics'],
                'emerging_domains' => ['UI/UX Design'],
                'excluded_domains' => [
                    'Agriculture', 'Law', 'Arts & Humanities', 'Hospitality & Tourism',
                    'Economics', 'Accounting & Finance', 'Media & Communication', 'Psychology',
                ],
            ],
            'information_technology' => [
                'core_domains'     => ['Computing & Information Technology', 'Web Development', 'Cyber Security'],
                'adjacent_domains' => ['Cloud Computing', 'DevOps', 'Data Science', 'Mobile Development', 'Artificial Intelligence', 'UI/UX Design', 'Mathematics & Statistics'],
                'emerging_domains' => [],
                'excluded_domains' => [
                    'Agriculture', 'Law', 'Arts & Humanities', 'Hospitality & Tourism',
                    'Economics', 'Accounting & Finance', 'Media & Communication', 'Psychology',
                ],
            ],
            'networking' => [
                'core_domains'     => ['Computing & Information Technology', 'Cyber Security'],
                'adjacent_domains' => ['Cloud Computing', 'DevOps'],
                'emerging_domains' => ['Artificial Intelligence', 'Data Science'],
                'excluded_domains' => [
                    'Web Development', 'Mobile Development', 'UI/UX Design', 'Agriculture',
                    'Law', 'Arts & Humanities', 'Accounting & Finance', 'Business & Management',
                ],
            ],
            'cyber_security' => [
                'core_domains'     => ['Cyber Security', 'Computing & Information Technology'],
                'adjacent_domains' => ['Cloud Computing', 'DevOps', 'Data Science'],
                'emerging_domains' => ['Artificial Intelligence'],
                'excluded_domains' => [
                    'Web Development', 'Mobile Development', 'UI/UX Design', 'Agriculture',
                    'Law', 'Arts & Humanities', 'Accounting & Finance', 'Business & Management', 'Marketing', 'Economics',
                ],
            ],
            'data_science_ai' => [
                'core_domains'     => ['Data Science', 'Artificial Intelligence', 'Mathematics & Statistics'],
                'adjacent_domains' => ['Computing & Information Technology', 'Cloud Computing', 'Web Development'],
                'emerging_domains' => ['DevOps', 'Business & Management'],
                'excluded_domains' => [
                    'Agriculture', 'Law', 'Arts & Humanities', 'Hospitality & Tourism',
                    'Accounting & Finance', 'Mobile Development', 'UI/UX Design', 'Marketing',
                ],
            ],
            'python_programming' => [
                'core_domains'     => ['Computing & Information Technology', 'Web Development'],
                'adjacent_domains' => ['Data Science', 'Artificial Intelligence', 'DevOps'],
                'emerging_domains' => ['Cloud Computing'],
                'excluded_domains' => [
                    'Agriculture', 'Law', 'Arts & Humanities', 'Hospitality & Tourism',
                    'Accounting & Finance', 'UI/UX Design', 'Marketing', 'Economics',
                ],
            ],
            'mobile_development' => [
                'core_domains'     => ['Mobile Development', 'Computing & Information Technology'],
                'adjacent_domains' => ['Web Development', 'UI/UX Design', 'Cloud Computing'],
                'emerging_domains' => ['Artificial Intelligence', 'DevOps'],
                'excluded_domains' => [
                    'Agriculture', 'Law', 'Arts & Humanities', 'Hospitality & Tourism',
                    'Accounting & Finance', 'Data Science', 'Cyber Security', 'Marketing',
                ],
            ],
            'devops_cloud' => [
                'core_domains'     => ['DevOps', 'Cloud Computing', 'Computing & Information Technology'],
                'adjacent_domains' => ['Cyber Security', 'Data Science'],
                'emerging_domains' => ['Artificial Intelligence'],
                'excluded_domains' => [
                    'Agriculture', 'Law', 'Arts & Humanities', 'Hospitality & Tourism',
                    'Accounting & Finance', 'Web Development', 'Mobile Development', 'UI/UX Design', 'Marketing', 'Economics',
                ],
            ],
            'e_business' => [
                'core_domains'     => ['Business & Management', 'Marketing', 'Economics', 'Accounting & Finance'],
                'adjacent_domains' => ['Web Development', 'Computing & Information Technology', 'Data Science', 'Media & Communication', 'Mathematics & Statistics'],
                'emerging_domains' => ['Artificial Intelligence', 'Cloud Computing'],
                'excluded_domains' => [
                    'DevOps', 'Cyber Security', 'Mobile Development', 'Agriculture',
                    'Law', 'Arts & Humanities', 'Hospitality & Tourism', 'UI/UX Design',
                ],
            ],
            'business_management' => [
                'core_domains'     => ['Business & Management', 'Marketing', 'Economics', 'Accounting & Finance'],
                'adjacent_domains' => ['Media & Communication', 'Psychology', 'Mathematics & Statistics'],
                'emerging_domains' => ['Artificial Intelligence', 'Data Science'],
                'excluded_domains' => [
                    'DevOps', 'Web Development', 'Cloud Computing', 'Cyber Security',
                    'Mobile Development', 'Agriculture', 'Arts & Humanities', 'UI/UX Design',
                    'Law', 'Computing & Information Technology',
                ],
            ],
            'accounting_finance' => [
                'core_domains'     => ['Accounting & Finance', 'Economics', 'Business & Management', 'Mathematics & Statistics'],
                'adjacent_domains' => ['Data Science', 'Law'],
                'emerging_domains' => ['Artificial Intelligence'],
                'excluded_domains' => [
                    'DevOps', 'Web Development', 'Cloud Computing', 'Cyber Security',
                    'Mobile Development', 'Agriculture', 'Arts & Humanities', 'UI/UX Design',
                    'Marketing', 'Computing & Information Technology',
                ],
            ],
            'marketing' => [
                'core_domains'     => ['Marketing', 'Business & Management', 'Media & Communication'],
                'adjacent_domains' => ['Economics', 'Data Science', 'Computing & Information Technology', 'Psychology'],
                'emerging_domains' => ['Artificial Intelligence'],
                'excluded_domains' => [
                    'DevOps', 'Cloud Computing', 'Cyber Security', 'Mobile Development',
                    'Agriculture', 'Arts & Humanities', 'UI/UX Design', 'Accounting & Finance',
                    'Law', 'Mathematics & Statistics',
                ],
            ],
            'agribusiness' => [
                'core_domains'     => ['Agriculture', 'Business & Management', 'Economics'],
                'adjacent_domains' => ['Mathematics & Statistics', 'Environmental Studies'],
                'emerging_domains' => ['Data Science'],
                'excluded_domains' => [
                    'DevOps', 'Web Development', 'Cloud Computing', 'Cyber Security',
                    'Mobile Development', 'Artificial Intelligence', 'Arts & Humanities',
                    'Accounting & Finance', 'UI/UX Design', 'Computing & Information Technology',
                    'Law', 'Marketing', 'Media & Communication',
                ],
            ],
            'agriculture' => [
                'core_domains'     => ['Agriculture'],
                'adjacent_domains' => ['Environmental Studies', 'Science', 'Business & Management', 'Mathematics & Statistics'],
                'emerging_domains' => ['Data Science'],
                'excluded_domains' => [
                    'DevOps', 'Web Development', 'Cloud Computing', 'Cyber Security',
                    'Mobile Development', 'Artificial Intelligence', 'Arts & Humanities',
                    'Accounting & Finance', 'UI/UX Design', 'Computing & Information Technology',
                    'Law', 'Marketing', 'Media & Communication',
                ],
            ],
            'languages_arts' => [
                'core_domains'     => ['Arts & Humanities', 'Media & Communication', 'Education'],
                'adjacent_domains' => ['Psychology', 'Social Science'],
                'emerging_domains' => ['Artificial Intelligence'],
                'excluded_domains' => [
                    'DevOps', 'Web Development', 'Cloud Computing', 'Cyber Security',
                    'Mobile Development', 'Data Science', 'Computing & Information Technology',
                    'Agriculture', 'Accounting & Finance', 'Law', 'Business & Management',
                    'UI/UX Design', 'Marketing', 'Economics', 'Mathematics & Statistics',
                ],
            ],
            'media_communication' => [
                'core_domains'     => ['Media & Communication', 'Arts & Humanities'],
                'adjacent_domains' => ['Marketing', 'Education', 'Psychology'],
                'emerging_domains' => ['Artificial Intelligence', 'Data Science'],
                'excluded_domains' => [
                    'DevOps', 'Web Development', 'Cloud Computing', 'Cyber Security',
                    'Mobile Development', 'Agriculture', 'Accounting & Finance',
                    'UI/UX Design', 'Law', 'Computing & Information Technology', 'Mathematics & Statistics',
                ],
            ],
            'hospitality_tourism' => [
                'core_domains'     => ['Hospitality & Tourism', 'Business & Management'],
                'adjacent_domains' => ['Marketing', 'Economics', 'Media & Communication'],
                'emerging_domains' => ['Data Science', 'Artificial Intelligence'],
                'excluded_domains' => [
                    'DevOps', 'Web Development', 'Cloud Computing', 'Cyber Security',
                    'Mobile Development', 'Agriculture', 'Arts & Humanities',
                    'UI/UX Design', 'Law', 'Computing & Information Technology',
                    'Accounting & Finance', 'Mathematics & Statistics',
                ],
            ],
            'economics' => [
                'core_domains'     => ['Economics', 'Business & Management', 'Mathematics & Statistics'],
                'adjacent_domains' => ['Accounting & Finance', 'Data Science'],
                'emerging_domains' => ['Artificial Intelligence'],
                'excluded_domains' => [
                    'DevOps', 'Web Development', 'Cloud Computing', 'Cyber Security',
                    'Mobile Development', 'Agriculture', 'Arts & Humanities', 'UI/UX Design',
                    'Law', 'Computing & Information Technology', 'Marketing',
                ],
            ],
            'law' => [
                'core_domains'     => ['Law', 'Business & Management'],
                'adjacent_domains' => ['Economics', 'Media & Communication', 'Psychology'],
                'emerging_domains' => ['Artificial Intelligence'],
                'excluded_domains' => [
                    'DevOps', 'Web Development', 'Cloud Computing', 'Cyber Security',
                    'Mobile Development', 'Agriculture', 'Data Science',
                    'Computing & Information Technology', 'UI/UX Design', 'Marketing',
                    'Mathematics & Statistics', 'Accounting & Finance',
                ],
            ],
            'education' => [
                'core_domains'     => ['Education', 'Arts & Humanities', 'Psychology'],
                'adjacent_domains' => ['Media & Communication', 'Social Science'],
                'emerging_domains' => ['Artificial Intelligence', 'Computing & Information Technology'],
                'excluded_domains' => [
                    'DevOps', 'Web Development', 'Cloud Computing', 'Cyber Security',
                    'Mobile Development', 'Agriculture', 'Accounting & Finance',
                    'UI/UX Design', 'Marketing', 'Economics', 'Mathematics & Statistics',
                ],
            ],
            'psychology' => [
                'core_domains'     => ['Psychology', 'Education', 'Social Science'],
                'adjacent_domains' => ['Arts & Humanities', 'Media & Communication'],
                'emerging_domains' => ['Artificial Intelligence', 'Data Science'],
                'excluded_domains' => [
                    'DevOps', 'Web Development', 'Cloud Computing', 'Cyber Security',
                    'Mobile Development', 'Agriculture', 'Accounting & Finance',
                    'UI/UX Design', 'Marketing', 'Law', 'Computing & Information Technology',
                    'Mathematics & Statistics',
                ],
            ],
            'general' => [
                'core_domains'     => [],
                'adjacent_domains' => [],
                'emerging_domains' => [],
                'excluded_domains' => [],
            ],
        ];

        return $map[$programType] ?? $map['general'];
    }

     
    private function getSectorsForProgramType(string $programType): array
    {
        $map = [
            'web_design_development' => ['Information Technology'],
            'graphic_design'         => ['Creative Arts & Design', 'Marketing & Advertising'],
            'software_engineering'   => ['Information Technology', 'Telecommunications'],
            'information_technology' => ['Information Technology', 'Telecommunications'],
            'networking'             => ['Information Technology', 'Telecommunications'],
            'cyber_security'         => ['Information Technology'],
            'data_science_ai'        => ['Information Technology'],
            'python_programming'     => ['Information Technology'],
            'mobile_development'     => ['Information Technology', 'Telecommunications'],
            'devops_cloud'           => ['Information Technology'],
            'e_business'             => ['Information Technology', 'Finance & Banking', 'Management Consulting', 'Marketing & Advertising'],
            'business_management'    => ['Finance & Banking', 'Management Consulting'],
            'accounting_finance'     => ['Finance & Banking', 'Professional Services'],
            'marketing'              => ['Marketing & Advertising', 'Management Consulting'],
            'agribusiness'           => ['Agriculture & Forestry', 'Management Consulting'],
            'agriculture'            => ['Agriculture & Forestry', 'Environmental Services'],
            'languages_arts'         => ['Education', 'Media & Entertainment'],
            'media_communication'    => ['Media & Entertainment', 'Marketing & Advertising', 'Education'],
            'hospitality_tourism'    => ['Tourism & Hospitality'],
            'economics'              => ['Finance & Banking', 'Management Consulting'],
            'law'                    => ['Professional Services'],
            'education'              => ['Education'],
            'psychology'             => ['Education', 'Professional Services'],
            'general'                => ['Professional Services'],
        ];

        return $map[$programType] ?? ['Professional Services'];
    }

    private function calculateConfidence(int $studentCount, int $industryCount, float $avgStudentRelevance, float $avgIndustryRelevance, bool $curriculumAvailable): string
    {
        $total = $studentCount + $industryCount;
        if ($total === 0) {
            return 'Insufficient';
        }

        $hasBalance = ($studentCount > 0 && $industryCount > 0);
        $avgRelevance = ($avgStudentRelevance + $avgIndustryRelevance) / 2.0;

        if ($total < 5) {
            return 'Low';
        }

        if (!$hasBalance) {
            return 'Medium'; 
        }

        if ($avgRelevance >= 0.70 && $total >= 20) {
            return 'High';
        }

        if ($avgRelevance >= 0.50) {
            return 'Medium';
        }

        return 'Low';
    }

    private function calculateCareerReadiness(array $curriculumDomains, \App\Models\Course $course = null): array
    {
        $roles = config('analytics.career_paths', []);
        $readinessList = [];

        // Build flat lowercase text from all curriculum subject names for keyword matching
        $curriculumText = '';
        if ($course) {
            $course->loadMissing('semesters.subjects');
            $subjectNames = [];
            foreach ($course->semesters as $semester) {
                foreach ($semester->subjects as $subject) {
                    $subjectNames[] = strtolower($subject->name);
                }
            }
            $curriculumText = implode(' | ', $subjectNames);
        }

        if ($course) {
            $title = strtolower($course->title);
            $dept = strtolower($course->department ?? '');

            $computingRoles   = ['Cloud Engineer', 'Software Developer', 'Cybersecurity Specialist', 'Mobile App Developer', 'Project Manager', 'DevOps Engineer', 'AI / ML Engineer'];
            $dataScienceRoles = ['Data Scientist', 'Statistician / Actuary', 'AI / ML Engineer', 'Software Developer'];
            $marketingRoles   = ['Digital Marketer', 'Marketing Specialist', 'Project Manager'];
            $accountingRoles  = ['Corporate Accountant', 'Investment Banker'];
            $hrRoles          = ['HR Manager', 'Project Manager'];
            $tourismRoles     = ['Public Relations Officer', 'Management Consultant'];
            $businessRoles    = ['Management Consultant', 'Project Manager', 'HR Manager', 'Corporate Accountant', 'Corporate Lawyer'];
            $languagesRoles   = ['Language Instructor', 'Public Relations Officer'];
            $designMediaRoles = ['Public Relations Officer', 'Marketing Specialist', 'Digital Marketer'];
            $agriRoles        = ['Agricultural Manager', 'Agronomist / Agricultural Consultant', 'Agribusiness Manager', 'Precision Agriculture Specialist', 'Food Security Analyst', 'Project Manager'];

            $allowedRoles = [];

            if (str_contains($title, 'data science') || str_contains($title, 'statistic')) {
                $allowedRoles = array_merge($allowedRoles, $dataScienceRoles);
            }
            if (str_contains($title, 'software') || str_contains($title, 'web') || str_contains($title, 'programming') || str_contains($title, 'network') || str_contains($title, 'computing') || str_contains($title, 'information technology') || str_contains($title, 'python') || str_contains($title, 'computer')) {
                $allowedRoles = array_merge($allowedRoles, $computingRoles);
            }
            if (str_contains($title, 'e-business') || str_contains($title, 'e-commerce') || str_contains($title, 'digital business')) {
                $allowedRoles = array_merge($allowedRoles, ['Digital Marketer', 'Marketing Specialist', 'Project Manager', 'Management Consultant']);
            }
            if (str_contains($title, 'marketing')) {
                $allowedRoles = array_merge($allowedRoles, $marketingRoles);
            }
            if (str_contains($title, 'accounting') || str_contains($title, 'finance')) {
                $allowedRoles = array_merge($allowedRoles, $accountingRoles);
            }
            if (str_contains($title, 'human resource') || str_contains($title, 'hr')) {
                $allowedRoles = array_merge($allowedRoles, $hrRoles);
            }
            if (str_contains($title, 'tourism') || str_contains($title, 'hospitality')) {
                $allowedRoles = array_merge($allowedRoles, $tourismRoles);
            }
            if (str_contains($title, 'business') || str_contains($title, 'management') || str_contains($title, 'entrepreneurship')) {
                $allowedRoles = array_merge($allowedRoles, $businessRoles);
            }
            if (str_contains($title, 'english') || str_contains($title, 'spoken') || str_contains($title, 'language')) {
                $allowedRoles = array_merge($allowedRoles, $languagesRoles);
            }
            if (str_contains($title, 'graphic') || str_contains($title, 'design') || str_contains($title, 'media') || str_contains($title, 'communication')) {
                $allowedRoles = array_merge($allowedRoles, $designMediaRoles);
            }
            if (str_contains($title, 'agri') || str_contains($title, 'farm')) {
                $allowedRoles = array_merge($allowedRoles, $agriRoles);
            }

            if (empty($allowedRoles)) {
                if (str_contains($dept, 'computing')) {
                    $allowedRoles = array_merge($computingRoles, $dataScienceRoles);
                } elseif (str_contains($dept, 'management') || str_contains($dept, 'business')) {
                    $allowedRoles = array_merge($businessRoles, $marketingRoles, $accountingRoles, $hrRoles);
                } elseif (str_contains($dept, 'social') || str_contains($dept, 'language') || str_contains($dept, 'humanities') || str_contains($dept, 'art')) {
                    $allowedRoles = array_merge($languagesRoles, $designMediaRoles);
                } elseif (str_contains($dept, 'agri')) {
                    $allowedRoles = $agriRoles;
                }
            }

            $allowedRoles = array_values(array_unique($allowedRoles));

            if (!empty($allowedRoles)) {
                $roles = array_filter($roles, function ($role) use ($allowedRoles) {
                    return in_array($role, $allowedRoles);
                }, ARRAY_FILTER_USE_KEY);
            }
        }

        foreach ($roles as $role => $requiredDomains) {
            if (empty($requiredDomains)) {
                continue;
            }

            $matchedDomains = [];
            $missingDomains = [];

            foreach ($requiredDomains as $domain) {
                if (in_array($domain, $curriculumDomains)) {
                    $matchedDomains[] = $domain;
                } else {
                    $missingDomains[] = $domain;
                }
            }

            $total = count($requiredDomains);
            $readinessScore = $total > 0 ? (int) round((count($matchedDomains) / $total) * 100) : 0;

            if ($readinessScore > 0) {
                $readinessList[] = [
                    'role'            => $role,
                    'readiness'       => $readinessScore,
                    'matched_domains' => array_slice($matchedDomains, 0, 5),
                    'missing_domains' => array_slice($missingDomains, 0, 5),
                    'total_skills'    => $total,
                    'matched_count'   => count($matchedDomains),
                ];
            }
        }

        usort($readinessList, function ($a, $b) {
            return $b['readiness'] <=> $a['readiness'];
        });

        return $readinessList;
    }

    private function calculateEmergingTechAlerts(array $relevantIndustrySurveys, array $curriculumSubjects, array $curriculumDomains): array
    {
        $totalRelevantIndustry = count($relevantIndustrySurveys);
        
        $threatTemplates = [
            'high_ai_dependency' => [
                'title' => 'High Reliability on AI Tools',
                'regex' => '/\b(ai|generative ai|copilot|chatgpt|artificial intelligence)\b/i',
                'recommendation' => 'Enforce strict guidelines on AI tool usage in coding tasks, emphasizing paper-based exams and manual debugging.'
            ],
            'no_practical_knowledge' => [
                'title' => 'Lack of Practical Hands-on Knowledge',
                'regex' => '/\b(practical|hands-on|debugging|lab|experience|production-level|real-world)\b/i',
                'recommendation' => 'Integrate production-grade coding assignments, mandatory debugging tasks, and industry training.'
            ],
            'no_fundamental_knowledge' => [
                'title' => 'Weak Core & Fundamental Knowledge',
                'regex' => '/\b(fundamental|architecture|basics|core|algorithm|data structure|math|theory)\b/i',
                'recommendation' => 'Reinforce algorithms, computer networks, and system design fundamentals before introducing high-level frameworks.'
            ],
            'no_testing_discipline' => [
                'title' => 'Inadequate Testing & CI/CD Discipline',
                'regex' => '/\b(testing|qa|ci\/cd|cicd|deployment|automation testing|selenium)\b/i',
                'recommendation' => 'Make unit testing and automated build pipelines (CI/CD) a mandatory part of subject project evaluations.'
            ],
            'weak_collaborative_skills' => [
                'title' => 'Weak Collaborative Development Skills',
                'regex' => '/\b(collaborative|git|teamwork|communication|collaboration|agile)\b/i',
                'recommendation' => 'Implement group assignments using Git branches, pull request reviews, and agile sprints.'
            ]
        ];

        $threatCounts = [];
        foreach ($threatTemplates as $key => $t) {
            $threatCounts[$key] = 0;
        }

        foreach ($relevantIndustrySurveys as $ris) {
            $survey = $ris['survey'];
            $text = strtolower(
                ($survey->required_skills ?? '') . ' ' . 
                ($survey->academic_practices ?? '') . ' ' . 
                ($survey->new_program_suggestion ?? '') . ' ' . 
                ($survey->graduate_skill_gaps ?? '') . ' ' . 
                ($survey->additional_recommendations ?? '')
            );

            foreach ($threatTemplates as $key => $t) {
                if (preg_match($t['regex'], $text)) {
                    $threatCounts[$key]++;
                }
            }
        }

        $alerts = [];
        foreach ($threatTemplates as $key => $t) {
            $count = $threatCounts[$key];
            $demandPct = $totalRelevantIndustry > 0 ? (int) round(($count / $totalRelevantIndustry) * 100) : 0;
            
            // Only output threats that have at least 10% prevalence
            if ($demandPct >= 10) {
                $alerts[] = [
                    'tech' => $t['title'],
                    'demand_pct' => $demandPct,
                    'severity' => $demandPct >= 50 ? 'Critical' : ($demandPct >= 25 ? 'High' : 'Medium'),
                    'recommendation' => $t['recommendation']
                ];
            }
        }

        // Sort by prevalence descending
        usort($alerts, function ($a, $b) {
            return $b['demand_pct'] <=> $a['demand_pct'];
        });

        return array_slice($alerts, 0, 5);
    }

    private function getSubSkillsForDomains(array $domains): array
    {
        $subSkillsMap = [
            'DevOps' => ['Docker', 'Kubernetes', 'CI/CD', 'Jenkins'],
            'Artificial Intelligence' => ['Machine Learning', 'Deep Learning', 'TensorFlow', 'PyTorch'],
            'Cloud Computing' => ['AWS', 'Azure', 'GCP', 'Serverless'],
            'Mobile Development' => ['Android', 'iOS', 'Kotlin', 'Swift', 'Flutter'],
            'Cyber Security' => ['Network Security', 'Cryptography', 'Firewalls', 'Penetration Testing'],
            'Web Development' => ['React', 'JavaScript', 'HTML/CSS', 'Node.js'],
            'Database Management' => ['SQL', 'MySQL', 'PostgreSQL', 'MongoDB'],
            'UI/UX Design' => ['Figma', 'UI/UX Design', 'Prototyping', 'Wireframing'],
            'Software Testing & QA' => ['Unit Testing', 'QA', 'Automation Testing', 'Selenium'],
            'Computing & Information Technology' => ['Software Engineering', 'System Design', 'OOP', 'Programming Fundamentals'],
            'Network Engineering' => ['Computer Networks', 'TCP/IP', 'Routing & Switching', 'Network Security'],
            'System Administration' => ['Linux', 'Shell Scripting', 'Server Management'],
            'Emerging Technologies' => ['IoT', 'Blockchain', 'Automation'],
        ];

        $skills = [];
        foreach ($domains as $domain) {
            if (isset($subSkillsMap[$domain])) {
                $skills = array_merge($skills, $subSkillsMap[$domain]);
            }
        }
        return array_values(array_unique($skills));
    }
}