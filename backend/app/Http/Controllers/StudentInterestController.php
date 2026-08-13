<?php

namespace App\Http\Controllers;

use App\AI\Models\StudentInterest;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;

class StudentInterestController extends Controller
{
     
    public function store(Request $request)
    {
        $validated = $request->validate([
            'email' => 'nullable|email',
            'whatsapp_no' => 'nullable|string',
            'education_level' => 'required|string',
            'province' => 'required|string',
            'district' => 'required|string',


            'primary_field' => 'required|string',
            'primary_skills' => 'required|string',
            'primary_teaching_methods' => 'required|string',
            'primary_theory_practical' => 'required|integer|min:1|max:5',


            'secondary_field' => 'nullable|string',
            'secondary_skills' => 'nullable|string',
            'secondary_teaching_methods' => 'nullable|string',
            'secondary_theory_practical' => 'nullable|integer|min:1|max:5',


            'third_field' => 'nullable|string',
            'third_skills' => 'nullable|string',
            'third_teaching_methods' => 'nullable|string',
            'third_theory_practical' => 'nullable|integer|min:1|max:5',


            'university_opportunities' => 'nullable|string',
            'new_program_suggestion' => 'nullable|string',
            'recaptcha_token' => 'nullable|string',
        ]);


        $recaptchaSecret = config('services.recaptcha.secret');
        if ($recaptchaSecret && $recaptchaSecret !== '6Ld_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx') {
            $token = $request->input('recaptcha_token');
            if (!$token) {
                return response()->json([
                    'success' => false,
                    'message' => 'reCAPTCHA token is missing.'
                ], 422);
            }

            try {
                $verifyResponse = Http::asForm()->post('https://www.google.com/recaptcha/api/siteverify', [
                    'secret' => $recaptchaSecret,
                    'response' => $token,
                    'remoteip' => $request->ip(),
                ]);

                if (!$verifyResponse->successful() || !$verifyResponse->json('success') || $verifyResponse->json('score') < 0.5) {
                    Log::warning('reCAPTCHA validation failed', [
                        'ip' => $request->ip(),
                        'response' => $verifyResponse->json()
                    ]);
                    return response()->json([
                        'success' => false,
                        'message' => 'Anti-bot verification failed. Please try again.'
                    ], 422);
                }
            } catch (\Exception $verifyException) {
                Log::error('reCAPTCHA verification error: ' . $verifyException->getMessage());

            }
        }

        try {

            $validated['survey_submitted_at'] = now();


            unset($validated['recaptcha_token']);


            $webhookUrl = config('services.google_sheets.student_webhook_url') ?: config('services.google_sheets.webhook_url');
            if ($webhookUrl) {
                try {
                    $secret = config('services.google_sheets.webhook_secret', 'secret_key');
                    $signature = hash_hmac('sha256', json_encode($validated), $secret);
                    $response = Http::timeout(5)->withHeaders([
                        'X-Webhook-Signature' => $signature
                    ])->post($webhookUrl, $validated);
                    if (!$response->successful()) {
                        Log::error('Student Google Sheet Webhook failed with status ' . $response->status() . ': ' . $response->body());
                    } else {
                        $resJson = $response->json();
                        if (is_array($resJson) && isset($resJson['success']) && !$resJson['success']) {
                            Log::error('Student Google Sheet Apps Script execution error: ' . ($resJson['error'] ?? 'Unknown script error'));
                        }
                    }
                } catch (\Exception $sheetException) {

                    Log::error('Google Sheet Sync Error: ' . $sheetException->getMessage());
                }
            }

            return response()->json([
                'success' => true,
                'message' => 'Student academic interests recorded successfully.'
            ], 201);
        } catch (\Exception $e) {
            Log::error('Failed to submit student interest: ' . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'An error occurred while saving submission data.',
                'error' => $e->getMessage()
            ], 500);
        }
    }

     
    public function getConfig()
    {
        try {
            $configs = DB::connection('analytics')->table('survey_interests_config')->get()->map(function ($c) {

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

     
    public function storeConfig(Request $request)
    {
        $validated = $request->validate([
            'id' => 'nullable|integer',
            'interest_field' => 'required|string',
            'skills' => 'required|array'
        ]);


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

     
    public function storeIndustry(Request $request)
    {
        $validated = $request->validate([
            'company_name' => 'required|string',
            'industry_sector' => 'required|string',
            'organization_size' => 'nullable|string',
            'primary_academic_field' => 'required|string',
            'secondary_academic_field' => 'nullable|string',
            'third_academic_field' => 'nullable|string',
            'required_skills' => 'nullable|string',
            'academic_practices' => 'nullable|string',
            'minimum_qualification' => 'nullable|string',
            'minimum_degree_result' => 'nullable|string',
            'certification_importance' => 'nullable|integer|min:1|max:5',
            'emerging_fields' => 'nullable|string',
            'new_program_suggestion' => 'nullable|string',
            'graduate_skill_gaps' => 'nullable|string',
            'additional_recommendations' => 'nullable|string',
            'recaptcha_token' => 'nullable|string',
        ]);


        $recaptchaSecret = config('services.recaptcha.secret');
        if ($recaptchaSecret && $recaptchaSecret !== '6Ld_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx') {
            $token = $request->input('recaptcha_token');
            if (!$token) {
                return response()->json([
                    'success' => false,
                    'message' => 'reCAPTCHA token is missing.'
                ], 422);
            }

            try {
                $verifyResponse = Http::asForm()->post('https://www.google.com/recaptcha/api/siteverify', [
                    'secret' => $recaptchaSecret,
                    'response' => $token,
                    'remoteip' => $request->ip(),
                ]);

                if (!$verifyResponse->successful() || !$verifyResponse->json('success') || $verifyResponse->json('score') < 0.5) {
                    Log::warning('reCAPTCHA validation failed for industry survey', [
                        'ip' => $request->ip(),
                        'response' => $verifyResponse->json()
                    ]);
                    return response()->json([
                        'success' => false,
                        'message' => 'Anti-bot verification failed. Please try again.'
                    ], 422);
                }
            } catch (\Exception $verifyException) {
                Log::error('reCAPTCHA verification error for industry: ' . $verifyException->getMessage());
            }
        }

        try {
            $validated['survey_submitted_at'] = now();
            unset($validated['recaptcha_token']);


            $webhookUrl = config('services.google_sheets.industry_webhook_url') ?: config('services.google_sheets.webhook_url');
            if ($webhookUrl) {
                try {
                    $secret = config('services.google_sheets.webhook_secret', 'secret_key');
                    $signature = hash_hmac('sha256', json_encode($validated), $secret);
                    $response = Http::timeout(5)->withHeaders([
                        'X-Webhook-Signature' => $signature
                    ])->post($webhookUrl, $validated);
                    if (!$response->successful()) {
                        Log::error('Industry Google Sheet Webhook failed with status ' . $response->status() . ': ' . $response->body());
                    } else {
                        $resJson = $response->json();
                        if (is_array($resJson) && isset($resJson['success']) && !$resJson['success']) {
                            Log::error('Industry Google Sheet Apps Script execution error: ' . ($resJson['error'] ?? 'Unknown script error'));
                        }
                    }
                } catch (\Exception $sheetException) {

                    Log::error('Industry Google Sheet Sync Error: ' . $sheetException->getMessage());
                }
            }

            return response()->json([
                'success' => true,
                'message' => 'Industry requirements submitted successfully.'
            ], 201);
        } catch (\Exception $e) {
            Log::error('Failed to submit industry requirement: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while saving industry requirements.',
                'error' => $e->getMessage()
            ], 500);
        }
    }

     
    public function getIndustrySectors()
    {
        try {
            $sectors = DB::connection('analytics')->table('industry_sectors_config')->get()->map(function ($s) {
                return [
                    'id' => $s->id,
                    'sector_name' => $s->sector_name
                ];
            });

            return response()->json($sectors);
        } catch (\Exception $e) {
            Log::error('Failed to retrieve industry sectors config: ' . $e->getMessage());
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

     
    public function storeIndustrySector(Request $request)
    {
        $validated = $request->validate([
            'id' => 'nullable|integer',
            'sector_name' => 'required|string',
        ]);

        try {
            if (!empty($validated['id'])) {
                DB::connection('analytics')->table('industry_sectors_config')
                    ->where('id', $validated['id'])
                    ->update([
                        'sector_name' => $validated['sector_name'],
                        'updated_at' => now()
                    ]);
                $id = $validated['id'];
            } else {
                $id = DB::connection('analytics')->table('industry_sectors_config')->insertGetId([
                    'sector_name' => $validated['sector_name'],
                    'created_at' => now(),
                    'updated_at' => now()
                ]);
            }

            return response()->json([
                'success' => true,
                'id' => $id,
                'message' => 'Industry sector saved successfully.'
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to save industry sector config: ' . $e->getMessage());
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

     
    public function deleteIndustrySector($id)
    {
        try {
            DB::connection('analytics')->table('industry_sectors_config')
                ->where('id', $id)
                ->delete();

            return response()->json([
                'success' => true,
                'message' => 'Industry sector configuration deleted successfully.'
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to delete industry sector config: ' . $e->getMessage());
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

     
    public function getIndustryConfig()
    {
        try {
            $configs = DB::connection('analytics')->table('industry_interests_config')->get()->map(function ($c) {
                $skillsArray = array_filter(array_map('trim', explode(',', $c->skills)));
                return [
                    'id' => $c->id,
                    'interest_field' => $c->interest_field,
                    'skills' => array_values($skillsArray)
                ];
            });

            return response()->json($configs);
        } catch (\Exception $e) {
            Log::error('Failed to retrieve industry survey config: ' . $e->getMessage());
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

     
    public function storeIndustryConfig(Request $request)
    {
        $validated = $request->validate([
            'id' => 'nullable|integer',
            'interest_field' => 'required|string',
            'skills' => 'required|array'
        ]);

        $skillsList = array_filter(array_map('trim', $validated['skills']));
        $skillsString = implode(', ', $skillsList);

        try {
            if (!empty($validated['id'])) {
                DB::connection('analytics')->table('industry_interests_config')
                    ->where('id', $validated['id'])
                    ->update([
                        'interest_field' => $validated['interest_field'],
                        'skills' => $skillsString,
                        'updated_at' => now()
                    ]);
                $id = $validated['id'];
            } else {
                $id = DB::connection('analytics')->table('industry_interests_config')->insertGetId([
                    'interest_field' => $validated['interest_field'],
                    'skills' => $skillsString,
                    'created_at' => now(),
                    'updated_at' => now()
                ]);
            }

            return response()->json([
                'success' => true,
                'id' => $id,
                'message' => 'Industry academic field configuration saved successfully.'
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to save industry survey config: ' . $e->getMessage());
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

     
    public function deleteIndustryConfig($id)
    {
        try {
            DB::connection('analytics')->table('industry_interests_config')
                ->where('id', $id)
                ->delete();

            return response()->json([
                'success' => true,
                'message' => 'Industry academic field configuration deleted successfully.'
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to delete industry survey config: ' . $e->getMessage());
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }
}
