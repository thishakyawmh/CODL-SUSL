<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckRole
{
    /**
     * Handle an incoming request.
     * Supports parameter list of roles: middleware('role:super_admin,director')
     */
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        $user = $request->user();

        if (!$user) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        // Parse comma-separated role arguments
        $allowedRoles = [];
        foreach ($roles as $role) {
            foreach (explode(',', $role) as $r) {
                $trimmed = trim($r);
                if ($trimmed !== '') {
                    $allowedRoles[] = $trimmed;
                }
            }
        }

        if (!empty($allowedRoles) && !in_array($user->role, $allowedRoles, true)) {
            return response()->json([
                'message' => 'Unauthorized. Requires role: ' . implode(', ', $allowedRoles)
            ], 403);
        }

        return $next($request);
    }
}
