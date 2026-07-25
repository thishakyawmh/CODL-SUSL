<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;

class DatabaseBackupTest extends TestCase
{
    public function test_non_super_admin_cannot_trigger_backup()
    {
        $lecturer = User::factory()->make(['role' => 'lecturer']);

        $response = $this->actingAs($lecturer, 'sanctum')
                         ->postJson('/api/admin/backups/run');

        $response->assertStatus(403);
    }
}
