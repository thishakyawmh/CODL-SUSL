<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use App\Models\User;

class AuthController extends Controller
{
    public function register(Request $request)
    {
        $settings = \App\Models\SystemSetting::first();
        if ($settings && $settings->maintenance_mode) {
            return response()->json([
                'message' => $settings->maintenance_message ?: 'The system is currently undergoing scheduled maintenance. Please check back later.',
                'maintenance' => true
            ], 503);
        }

        $validated = $request->validate([
            'full_name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:8|confirmed',
        ]);

        $user = User::create([
            'full_name' => $validated['full_name'],
            'email' => $validated['email'],
            'password' => $validated['password'],
            'role' => 'applicant', // Default role for self-registered users
            'status' => 'active',
        ]);

        $token = $user->createToken('auth_token', ['role:' . $user->role])->plainTextToken;

        return response()->json([
            'message' => 'Registration successful',
            'access_token' => $token,
            'token_type' => 'Bearer',
            'user' => $user
        ], 201);
    }

    public function login(Request $request)
    {
        $request->validate([
            'login' => 'required', // Can be email or student_number
            'password' => 'required',
        ]);

        \Log::info('Login attempt', [
            'login' => $request->login,
            'password_length' => strlen($request->password),
        ]);

        $user = User::where('email', $request->login)
                    ->orWhere('student_number', $request->login)
                    ->first();

        if (!$user) {
            \Log::warning('Login failed: user not found', ['login' => $request->login]);
            return response()->json([
                'message' => 'Invalid login credentials'
            ], 401);
        }

        $settings = \App\Models\SystemSetting::first();
        if ($settings && $settings->maintenance_mode && $user->role !== 'super_admin') {
            return response()->json([
                'message' => $settings->maintenance_message ?: 'The system is currently undergoing scheduled maintenance. Please check back later.',
                'maintenance' => true
            ], 503);
        }

        \Log::info('User found', [
            'id' => $user->id,
            'student_number' => $user->student_number,
            'role' => $user->role,
        ]);

        if (!Hash::check($request->password, $user->password)) {
            \Log::warning('Login failed: password mismatch', [
                'user_id' => $user->id,
                'input_password_length' => strlen($request->password),
            ]);
            return response()->json([
                'message' => 'Invalid login credentials'
            ], 401);
        }

        // Create token with role-based abilities
        $token = $user->createToken('auth_token', ['role:' . $user->role])->plainTextToken;

        \Log::info('Login successful', ['user_id' => $user->id, 'role' => $user->role]);

        if (in_array($user->role, ['super_admin', 'director', 'coordinator', 'secretary', 'lecturer'])) {
            \App\Models\ActivityLog::log($user->id, 'Logged in to the system', 'Portal Dashboard', 'system');
        }

        return response()->json([
            'message' => 'Login successful',
            'access_token' => $token,
            'token_type' => 'Bearer',
            'user' => $user
        ]);
    }

    public function me(Request $request)
    {
        return response()->json($request->user());
    }

    public function googleLogin(Request $request)
    {
        $request->validate([
            'credential' => 'required|string',
        ]);

        $credential = $request->credential;

        // Parse JWT token from Google
        $parts = explode('.', $credential);
        if (count($parts) !== 3) {
            return response()->json(['message' => 'Invalid Google credential token.'], 400);
        }

        $payload = json_decode(base64_decode(strtr($parts[1], '-_', '+/')), true);

        if (!$payload) {
            return response()->json(['message' => 'Failed to parse Google identity information.'], 400);
        }

        // Validate basic parameters (expiration, issuer)
        if (isset($payload['exp']) && $payload['exp'] < time()) {
            return response()->json(['message' => 'Google credential has expired.'], 400);
        }

        if (isset($payload['iss']) && !in_array($payload['iss'], ['accounts.google.com', 'https://accounts.google.com'])) {
            return response()->json(['message' => 'Invalid Google credential issuer.'], 400);
        }

        $email = $payload['email'] ?? null;
        $name = $payload['name'] ?? 'Google User';
        $avatar = $payload['picture'] ?? null;

        if (!$email) {
            return response()->json(['message' => 'Google credential does not contain email.'], 400);
        }

        // Check if user exists by email
        $user = User::where('email', $email)->first();

        $settings = \App\Models\SystemSetting::first();
        if ($settings && $settings->maintenance_mode) {
            if (!$user || $user->role !== 'super_admin') {
                return response()->json([
                    'message' => $settings->maintenance_message ?: 'The system is currently undergoing scheduled maintenance. Please check back later.',
                    'maintenance' => true
                ], 503);
            }
        }

        if (!$user) {
            // Create user
            $user = User::create([
                'full_name' => $name,
                'email' => $email,
                'password' => bin2hex(random_bytes(16)), // random secure password, auto-hashed by cast
                'role' => 'applicant', // Default role for self-registered users
                'status' => 'active',
                'avatar' => $avatar,
            ]);
        } else {
            // Update avatar if not set
            if ($avatar && !$user->avatar) {
                $user->update(['avatar' => $avatar]);
            }
        }

        // Create Sanctum Token
        $token = $user->createToken('auth_token', ['role:' . $user->role])->plainTextToken;

        if (in_array($user->role, ['super_admin', 'director', 'coordinator', 'secretary', 'lecturer'])) {
            \App\Models\ActivityLog::log($user->id, 'Logged in via Google', 'Portal Dashboard', 'system');
        }

        return response()->json([
            'message' => 'Login successful',
            'access_token' => $token,
            'token_type' => 'Bearer',
            'user' => $user
        ]);
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();
        return response()->json([
            'message' => 'Successfully logged out'
        ]);
    }
}
