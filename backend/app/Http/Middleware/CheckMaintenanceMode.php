<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use App\Models\SystemSetting;

class CheckMaintenanceMode
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $settings = SystemSetting::first();

        if ($settings && $settings->maintenance_mode) {
            // 1. Allow public retrieval of system settings so the login/maintenance screens can load branding
            if ($request->is('api/admin/system-settings') && $request->isMethod('get')) {
                return $next($request);
            }

            // 2. Allow login routes to pass through so we can authenticate first (we block non-super_admins in AuthController)
            if ($request->is('api/login') || $request->is('api/auth/google')) {
                return $next($request);
            }

            // 3. Check if the authenticated user is a super admin
            $user = auth('sanctum')->user();
            if ($user && $user->role === 'super_admin') {
                return $next($request);
            }

            // 4. Block all other requests
            return response()->json([
                'message' => $settings->maintenance_message ?: 'The system is currently undergoing scheduled maintenance. Please check back later.',
                'maintenance' => true
            ], 503);
        }

        return $next($request);
    }
}
