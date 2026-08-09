<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class SuperAdminSeeder extends Seeder
{
    public function run(): void
    {
        // Define the users dataset with "000000" as the password for everyone
        $users = [
            // Super Admins
            [
                'student_number' => 'CODL/SA0001',
                'full_name' => 'Super Administrator',
                'email' => 'superadmin@codl.lk',
                'nic' => '000000000V',
                'role' => 'super_admin',
                'phone' => '0112345678',
            ],
            [
                'student_number' => 'CODL/SA0002',
                'full_name' => 'Dilini Jayasinghe',
                'email' => 'd.jayasinghe@codl.lk',
                'nic' => '199058349210',
                'role' => 'super_admin',
                'phone' => '0718392103',
            ],
            // Directors
            [
                'student_number' => 'CODL/DR0001',
                'full_name' => 'Director 1',
                'email' => 'director@codl.lk',
                'nic' => '000000',
                'role' => 'director',
                'phone' => '0710000001',
            ],
            [
                'student_number' => 'CODL/DR0002',
                'full_name' => 'Dr. Shamini Senaratne',
                'email' => 's.senaratne@codl.lk',
                'nic' => '197864321094',
                'role' => 'director',
                'phone' => '0703849102',
            ],
            // Course Coordinators
            [
                'student_number' => 'CODL/CC0001',
                'full_name' => 'Course Coordinator 1',
                'email' => 'coordinator@codl.lk',
                'nic' => '111111',
                'role' => 'coordinator',
                'phone' => '0710000002',
            ],
            [
                'student_number' => 'CODL/CC0002',
                'full_name' => 'Mrs. Kumudu Priyadarshani',
                'email' => 'k.priyadarshani@codl.lk',
                'nic' => '198471920392',
                'role' => 'coordinator',
                'phone' => '0782394012',
            ],
            [
                'student_number' => 'CODL/CC0003',
                'full_name' => 'Dr. Arul Kumaran',
                'email' => 'a.kumaran@codl.lk',
                'nic' => '198219402930',
                'role' => 'coordinator',
                'phone' => '0772938401',
            ],
            [
                'student_number' => 'CODL/CC0004',
                'full_name' => 'Ms. Hasini Gunasekara',
                'email' => 'h.gunasekara@codl.lk',
                'nic' => '198859302910',
                'role' => 'coordinator',
                'phone' => '0753820193',
            ],
            [
                'student_number' => 'CODL/CC0005',
                'full_name' => 'Mr. Tharindu Perera',
                'email' => 't.perera@codl.lk',
                'nic' => '198619402931',
                'role' => 'coordinator',
                'phone' => '0712930492',
            ],
            // Course Secretaries
            [
                'student_number' => 'CODL/CS0001',
                'full_name' => 'Course Secretary 1',
                'email' => 'secretary@codl.lk',
                'nic' => '222222',
                'role' => 'secretary',
                'phone' => '0710000003',
            ],
            [
                'student_number' => 'CODL/CS0002',
                'full_name' => 'Mr. Suresh Fernando',
                'email' => 's.fernando@codl.lk',
                'nic' => '198929301940',
                'role' => 'secretary',
                'phone' => '0772948201',
            ],
            [
                'student_number' => 'CODL/CS0003',
                'full_name' => 'Ms. Thilini Dissanayake',
                'email' => 't.dissanayake@codl.lk',
                'nic' => '199462810392',
                'role' => 'secretary',
                'phone' => '0701930492',
            ],
            [
                'student_number' => 'CODL/CS0004',
                'full_name' => 'Mrs. Fathima Zeena',
                'email' => 'f.zeena@codl.lk',
                'nic' => '199283920192',
                'role' => 'secretary',
                'phone' => '0719284019',
            ],
            [
                'student_number' => 'CODL/CS0005',
                'full_name' => 'Mr. Kusal Mendis',
                'email' => 'k.mendis@codl.lk',
                'nic' => '199320394019',
                'role' => 'secretary',
                'phone' => '0781930492',
            ],
            // Lecturers
            [
                'student_number' => 'CODL/LC0001',
                'full_name' => 'Lecturer 1',
                'email' => 'lecturer@codl.lk',
                'nic' => '333333',
                'role' => 'lecturer',
                'phone' => '0710000004',
            ],
            [
                'student_number' => 'CODL/LC0002',
                'full_name' => 'Dr. Michelle De Silva',
                'email' => 'm.desilva@codl.lk',
                'nic' => '198358203910',
                'role' => 'lecturer',
                'phone' => '0769302910',
            ],
            [
                'student_number' => 'CODL/LC0003',
                'full_name' => 'Mrs. Gayathri Karunaratne',
                'email' => 'g.karunaratne@codl.lk',
                'nic' => '198762930192',
                'role' => 'lecturer',
                'phone' => '0709283019',
            ],
            [
                'student_number' => 'CODL/LC0004',
                'full_name' => 'Mr. Sivakumar Kanthasamy',
                'email' => 's.kanthasamy@codl.lk',
                'nic' => '198218392019',
                'role' => 'lecturer',
                'phone' => '0718302910',
            ],
            [
                'student_number' => 'CODL/LC0005',
                'full_name' => 'Dr. Nirosha Weerasinghe',
                'email' => 'n.weerasinghe@codl.lk',
                'nic' => '198568203910',
                'role' => 'lecturer',
                'phone' => '0729384019',
            ],
        ];

        foreach ($users as $userData) {
            User::updateOrCreate(
                ['student_number' => $userData['student_number']],
                [
                    'full_name' => $userData['full_name'],
                    'email' => $userData['email'],
                    'nic' => $userData['nic'],
                    'role' => $userData['role'],
                    'phone' => $userData['phone'],
                    'status' => 'active',
                    'password' => Hash::make('000000'), // Password set to '000000'
                    'avatar' => 'https://ui-avatars.com/api/?name=' . urlencode($userData['full_name']) . '&background=random&color=fff',
                ]
            );
        }
    }
}
