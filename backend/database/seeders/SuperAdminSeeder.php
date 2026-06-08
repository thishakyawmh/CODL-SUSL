<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class SuperAdminSeeder extends Seeder
{
    public function run(): void
    {
        // Delete old/obsolete super admins
        User::where('student_number', 'CODL/SUPERADMIN')->delete();

        // 1. Super Admin
        User::updateOrCreate(
            ['student_number' => 'CODL/SA0001'],
            [
                'email' => 'superadmin@codl.lk',
                'full_name' => 'Super Administrator',
                'nic' => '000000000V',
                'role' => 'super_admin',
                'status' => 'active',
                'password' => Hash::make('qqqqqq'),
                'phone' => '0112345678',
                'avatar' => 'https://ui-avatars.com/api/?name=Super+Admin&background=0D8ABC&color=fff',
            ]
        );
        echo "Super Admin seeded: CODL/SA0001 / qqqqqq\n";

        // 2. Director
        User::updateOrCreate(
            ['student_number' => 'CODL/DR0001'],
            [
                'email' => 'director@codl.lk',
                'full_name' => 'Director 1',
                'nic' => '000000',
                'role' => 'director',
                'status' => 'active',
                'password' => Hash::make('000000'),
                'phone' => '0710000001',
                'avatar' => 'https://ui-avatars.com/api/?name=Director+1&background=9333EA&color=fff',
            ]
        );
        echo "Director seeded: CODL/DR0001 / 000000\n";

        // 3. Course Coordinator
        User::updateOrCreate(
            ['student_number' => 'CODL/CC0001'],
            [
                'email' => 'coordinator@codl.lk',
                'full_name' => 'Course Coordinator 1',
                'nic' => '111111',
                'role' => 'coordinator',
                'status' => 'active',
                'password' => Hash::make('111111'),
                'phone' => '0710000002',
                'avatar' => 'https://ui-avatars.com/api/?name=Coordinator+1&background=2563EB&color=fff',
            ]
        );
        echo "Coordinator seeded: CODL/CC0001 / 111111\n";

        // 4. Course Secretary
        User::updateOrCreate(
            ['student_number' => 'CODL/CS0001'],
            [
                'email' => 'secretary@codl.lk',
                'full_name' => 'Course Secretary 1',
                'nic' => '222222',
                'role' => 'secretary',
                'status' => 'active',
                'password' => Hash::make('222222'),
                'phone' => '0710000003',
                'avatar' => 'https://ui-avatars.com/api/?name=Secretary+1&background=0891B2&color=fff',
            ]
        );
        echo "Secretary seeded: CODL/CS0001 / 222222\n";

        // 5. Lecturer
        User::updateOrCreate(
            ['student_number' => 'CODL/LC0001'],
            [
                'email' => 'lecturer@codl.lk',
                'full_name' => 'Lecturer 1',
                'nic' => '333333',
                'role' => 'lecturer',
                'status' => 'active',
                'password' => Hash::make('333333'),
                'phone' => '0710000004',
                'avatar' => 'https://ui-avatars.com/api/?name=Lecturer+1&background=4F46E5&color=fff',
            ]
        );
        echo "Lecturer seeded: CODL/LC0001 / 333333\n";
    }
}
