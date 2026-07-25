<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

class RoleAuthorizationTest extends TestCase
{
    public function test_unauthenticated_user_cannot_access_protected_routes()
    {
        $response = $this->getJson('/api/me');
        $response->assertStatus(401);
    }

    public function test_student_cannot_access_super_admin_database_tables()
    {
        $student = User::factory()->make([
            'role' => 'student',
        ]);

        $response = $this->actingAs($student, 'sanctum')
                         ->getJson('/api/admin/tables');

        $response->assertStatus(403);
    }

    public function test_student_cannot_access_backups()
    {
        $student = User::factory()->make([
            'role' => 'student',
        ]);

        $response = $this->actingAs($student, 'sanctum')
                         ->getJson('/api/admin/backups');

        $response->assertStatus(403);
    }

    public function test_super_admin_can_access_backups()
    {
        $superAdmin = User::factory()->make([
            'role' => 'super_admin',
        ]);

        $response = $this->actingAs($superAdmin, 'sanctum')
                         ->getJson('/api/admin/backups');

        $response->assertStatus(200);
    }
}
