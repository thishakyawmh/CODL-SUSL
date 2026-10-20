<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use App\Models\SystemSetting;

class CheckMaintenanceMode
{
     
    public function handle(Request $request, Closure $next): Response
    {
        $settings = SystemSetting::first();

        if ($settings && $settings->maintenance_mode) {

            if ($request->is('api/admin/system-settings') && $request->isMethod('get')) {
                return $next($request);
            }


            if ($request->is('api/login') || $request->is('api/auth/google')) {
                return $next($request);
            }


            $user = auth('sanctum')->user();
            if ($user && $user->role === 'super_admin') {
                return $next($request);
            }


            return response()->json([
                'message' => $settings->maintenance_message ?: 'The system is currently undergoing scheduled maintenance. Please check back later.',
                'maintenance' => true
            ], 503);
        }

        return $next($request);
    }
}
