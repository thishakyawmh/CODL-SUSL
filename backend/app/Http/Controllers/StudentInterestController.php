<?php

namespace App\Http\Controllers;

use App\AI\Models\StudentInterest;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;

class StudentInterestController extends Controller
{
    /**
     * Store a new student interest submission.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'email' => 'nullable|email',
            'whatsapp_no' => 'nullable|string',
            'education_level' => 'required|string',
            'province' => 'required|string',
            'district' => 'required|string',

            // Primary details
            'primary_field' => 'required|string',
            'primary_skills' => 'required|string',
            'primary_teaching_methods' => 'required|string',
            'primary_theory_practical' => 'required|integer|min:1|max:5',

            // Secondary details (Optional)
            'secondary_field' => 'nullable|string',
            'secondary_skills' => 'nullable|string',
            'secondary_teaching_methods' => 'nullable|string',
            'secondary_theory_practical' => 'nullable|integer|min:1|max:5',

            // Ternary details (Optional)
            'third_field' => 'nullable|string',
            'third_skills' => 'nullable|string',
            'third_teaching_methods' => 'nullable|string',
            'third_theory_practical' => 'nullable|integer|min:1|max:5',

            // Global questions
            'university_opportunities' => 'nullable|string',
            'new_program_suggestion' => 'nullable|string',
        ]);

        try {
            // Set timestamp of submission
            $validated['survey_submitted_at'] = now();

            // Map incoming Version 1 fields to Model's Version 2 fields
            $modelData = [
                'survey_submitted_at' => $validated['survey_submitted_at'],
                'email' => $validated['email'] ?? null,
                'whatsapp' => $validated['whatsapp_no'] ?? null,
                'education_level' => $validated['education_level'],
                'province' => $validated['province'],
                'district' => $validated['district'],

                'primary_interest' => $validated['primary_field'],
                'primary_skills' => $validated['primary_skills'],
                'primary_learning_methods' => $validated['primary_teaching_methods'],
                'primary_learning_balance' => $validated['primary_theory_practical'],

                'secondary_interest' => $validated['secondary_field'] ?? null,
                'secondary_skills' => $validated['secondary_skills'] ?? null,
                'secondary_learning_methods' => $validated['secondary_teaching_methods'] ?? null,
                'secondary_learning_balance' => $validated['secondary_theory_practical'] ?? null,

                'ternary_interest' => $validated['third_field'] ?? null,
                'ternary_skills' => $validated['third_skills'] ?? null,
                'ternary_learning_methods' => $validated['third_teaching_methods'] ?? null,
                'ternary_learning_balance' => $validated['third_theory_practical'] ?? null,

                'university_opportunities' => $validated['university_opportunities'] ?? null,
                'new_program_suggestion' => $validated['new_program_suggestion'] ?? null,
            ];

            $studentInterest = StudentInterest::create($modelData);

            // Send to Google Sheets webhook asynchronously
            $webhookUrl = env('GOOGLE_SHEET_WEBHOOK_URL');
            if ($webhookUrl) {
                try {
                    Http::timeout(5)->post($webhookUrl, $validated);
                } catch (\Exception $sheetException) {
                    // Log error but do not disrupt student user experience
                    Log::error('Google Sheet Sync Error: ' . $sheetException->getMessage());
                }
            }

            return response()->json([
                'success' => true,
                'message' => 'Student academic interests recorded successfully.',
                'data' => $studentInterest
            ], 201);
        } catch (\Exception $e) {
            Log::error('Failed to save student interest: ' . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'An error occurred while saving submission data.',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get active dynamic configuration of interest fields and skills.
     */
    public function getConfig()
    {
        try {
            $configs = DB::connection('analytics')->table('survey_interests_config')->get()->map(function ($c) {
                // Split comma-separated skills into clean trimmed arrays
                $skillsArray = array_filter(array_map('trim', explode(',', $c->skills)));
                return [
                    'id' => $c->id,
                    'interest_field' => $c->interest_field,
                    'skills' => array_values($skillsArray)
                ];
            });

            return response()->json($configs);
        } catch (\Exception $e) {
            Log::error('Failed to retrieve survey config: ' . $e->getMessage());
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    /**
     * Create or update interest field configuration (Admin).
     */
    public function storeConfig(Request $request)
    {
        $validated = $request->validate([
            'id' => 'nullable|integer',
            'interest_field' => 'required|string',
            'skills' => 'required|array'
        ]);

        // Clean skills array and convert to comma-separated string
        $skillsList = array_filter(array_map('trim', $validated['skills']));
        $skillsString = implode(', ', $skillsList);

        try {
            if (!empty($validated['id'])) {
                DB::connection('analytics')->table('survey_interests_config')
                    ->where('id', $validated['id'])
                    ->update([
                        'interest_field' => $validated['interest_field'],
                        'skills' => $skillsString,
                        'updated_at' => now()
                    ]);
                $id = $validated['id'];
            } else {
                $id = DB::connection('analytics')->table('survey_interests_config')->insertGetId([
                    'interest_field' => $validated['interest_field'],
                    'skills' => $skillsString,
                    'created_at' => now(),
                    'updated_at' => now()
                ]);
            }

            return response()->json([
                'success' => true,
                'id' => $id,
                'message' => 'Academic interest field configuration saved successfully.'
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to save survey config: ' . $e->getMessage());
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    /**
     * Delete an interest field configuration (Admin).
     */
    public function deleteConfig($id)
    {
        try {
            DB::connection('analytics')->table('survey_interests_config')
                ->where('id', $id)
                ->delete();

            return response()->json([
                'success' => true,
                'message' => 'Academic interest field configuration deleted successfully.'
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to delete survey config: ' . $e->getMessage());
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    /**
     * Get active dynamic configuration of teaching methods.
     */
    public function getTeachingMethods()
    {
        try {
            $methods = DB::connection('analytics')->table('survey_teaching_methods')->get()->map(function ($m) {
                return [
                    'id' => $m->id,
                    'method_name' => $m->method_name
                ];
            });

            return response()->json($methods);
        } catch (\Exception $e) {
            Log::error('Failed to retrieve teaching methods config: ' . $e->getMessage());
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    /**
     * Create or update teaching method configuration (Admin).
     */
    public function storeTeachingMethod(Request $request)
    {
        $validated = $request->validate([
            'id' => 'nullable|integer',
            'method_name' => 'required|string',
        ]);

        try {
            if (!empty($validated['id'])) {
                DB::connection('analytics')->table('survey_teaching_methods')
                    ->where('id', $validated['id'])
                    ->update([
                        'method_name' => $validated['method_name'],
                        'updated_at' => now()
                    ]);
                $id = $validated['id'];
            } else {
                $id = DB::connection('analytics')->table('survey_teaching_methods')->insertGetId([
                    'method_name' => $validated['method_name'],
                    'created_at' => now(),
                    'updated_at' => now()
                ]);
            }

            return response()->json([
                'success' => true,
                'id' => $id,
                'message' => 'Teaching method configuration saved successfully.'
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to save teaching method config: ' . $e->getMessage());
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    /**
     * Delete a teaching method configuration (Admin).
     */
    public function deleteTeachingMethod($id)
    {
        try {
            DB::connection('analytics')->table('survey_teaching_methods')
                ->where('id', $id)
                ->delete();

            return response()->json([
                'success' => true,
                'message' => 'Teaching method configuration deleted successfully.'
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to delete teaching method config: ' . $e->getMessage());
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    /**
     * Get active university opportunities configuration.
     */
    public function getUniversityOpportunities()
    {
        try {
            $opportunities = DB::connection('analytics')->table('survey_university_opportunities')->get();
            return response()->json($opportunities);
        } catch (\Exception $e) {
            Log::error('Failed to retrieve university opportunities: ' . $e->getMessage());
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    /**
     * Create or update a university opportunity configuration (Admin).
     */
    public function storeUniversityOpportunity(Request $request)
    {
        $validated = $request->validate([
            'id' => 'nullable|integer',
            'opportunity_name' => 'required|string',
        ]);

        try {
            if (!empty($validated['id'])) {
                DB::connection('analytics')->table('survey_university_opportunities')
                    ->where('id', $validated['id'])
                    ->update([
                        'opportunity_name' => $validated['opportunity_name'],
                        'updated_at' => now()
                    ]);
                $id = $validated['id'];
            } else {
                $id = DB::connection('analytics')->table('survey_university_opportunities')->insertGetId([
                    'opportunity_name' => $validated['opportunity_name'],
                    'created_at' => now(),
                    'updated_at' => now()
                ]);
            }

            return response()->json([
                'success' => true,
                'id' => $id,
                'message' => 'University opportunity configuration saved successfully.'
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to save university opportunity config: ' . $e->getMessage());
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    /**
     * Delete a university opportunity configuration (Admin).
     */
    public function deleteUniversityOpportunity($id)
    {
        try {
            DB::connection('analytics')->table('survey_university_opportunities')
                ->where('id', $id)
                ->delete();

            return response()->json([
                'success' => true,
                'message' => 'University opportunity configuration deleted successfully.'
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to delete university opportunity config: ' . $e->getMessage());
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }
}
