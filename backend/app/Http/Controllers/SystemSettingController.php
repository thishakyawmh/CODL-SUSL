<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\SystemSetting;
use App\Models\ActivityLog;
use Illuminate\Support\Facades\Storage;

class SystemSettingController extends Controller
{
    public function getSettings()
    {
        $settings = SystemSetting::first();

        if (!$settings) {
            // Seed default settings if none exist
            $settings = SystemSetting::create([
                'institution_name' => 'Centre for Open & Distance Learning',
                'university_name' => 'Sabaragamuwa University of Sri Lanka',
                'contact_email' => 'info@codl.sab.ac.lk',
                'contact_phone' => '045-2280179',
                'address' => 'Sabaragamuwa University of Sri Lanka, P.O. Box 02, Belihuloya, 70140, Sri Lanka.',
                'logo' => '/images/logo.png',
                'website_url' => 'https://www.sab.ac.lk/codl',
                'academic_year' => '2025/2026',
                'session_timeout' => 30,
                'min_password_length' => 8,
                'maintenance_mode' => false,
                'maintenance_message' => 'The system is currently undergoing scheduled maintenance. Please check back later.',
                'backup_frequency' => 'daily',
                'backup_retention' => 30,
            ]);
        }

        return response()->json($settings);
    }

    public function updateSettings(Request $request)
    {
        $validated = $request->validate([
            'institution_name' => 'required|string|max:255',
            'university_name' => 'required|string|max:255',
            'contact_email' => 'nullable|email|max:255',
            'contact_phone' => 'nullable|string|max:50',
            'address' => 'nullable|string',
            'website_url' => 'nullable|url|max:255',
            'academic_year' => 'nullable|string|max:50',
            'session_timeout' => 'nullable|integer|min:5|max:120',
            'min_password_length' => 'nullable|integer|min:6|max:20',
            'maintenance_mode' => 'nullable|boolean',
            'maintenance_message' => 'nullable|string',
            'backup_frequency' => 'nullable|string|in:daily,weekly,monthly',
            'backup_retention' => 'nullable|integer|in:7,30,90',
        ]);

        $settings = SystemSetting::first();

        if (!$settings) {
            $settings = new SystemSetting();
        }

        $settings->fill($validated);
        $settings->save();

        // Log administrative action
        $user = $request->user();
        if ($user) {
            ActivityLog::log($user->id, 'Updated System Settings', 'General Configuration', 'system');
        }

        return response()->json([
            'message' => 'System settings updated successfully',
            'settings' => $settings
        ]);
    }

    public function uploadLogo(Request $request)
    {
        $request->validate([
            'logo' => 'required|image|mimes:jpeg,png,jpg,gif,webp|max:2048',
        ]);

        $settings = SystemSetting::first();

        if (!$settings) {
            $settings = SystemSetting::create([
                'institution_name' => 'Centre for Open & Distance Learning',
                'university_name' => 'Sabaragamuwa University of Sri Lanka',
                'contact_email' => 'info@codl.sab.ac.lk',
                'contact_phone' => '045-2280179',
                'address' => 'Sabaragamuwa University of Sri Lanka, P.O. Box 02, Belihuloya, 70140, Sri Lanka.',
                'logo' => '/images/logo.png',
                'website_url' => 'https://www.sab.ac.lk/codl',
                'academic_year' => '2025/2026',
                'session_timeout' => 30,
                'min_password_length' => 8,
                'maintenance_mode' => false,
                'maintenance_message' => 'The system is currently undergoing scheduled maintenance. Please check back later.',
                'backup_frequency' => 'daily',
                'backup_retention' => 30,
            ]);
        }

        // Delete old logo if it exists in storage and is not the default public image path
        if ($settings->logo && !str_contains($settings->logo, '/images/logo.png')) {
            $oldFilename = basename($settings->logo);
            if (Storage::disk('public')->exists('logos/' . $oldFilename)) {
                Storage::disk('public')->delete('logos/' . $oldFilename);
            }
        }

        $file = $request->file('logo');
        $filename = 'logo_' . time() . '.' . $file->getClientOriginalExtension();
        $path = $file->storeAs('logos', $filename, 'public');

        $url = asset('storage/' . $path);
        $settings->logo = $url;
        $settings->save();

        // Log administrative action
        $user = $request->user();
        if ($user) {
            ActivityLog::log($user->id, 'Uploaded new system logo', 'Branding Logo', 'system');
        }

        return response()->json([
            'message' => 'Logo uploaded successfully',
            'logo_url' => $url,
            'settings' => $settings
        ]);
    }
}
