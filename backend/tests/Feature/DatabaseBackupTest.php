<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

class DatabaseBackupTest extends TestCase
{
    use RefreshDatabase;

    public function test_non_super_admin_cannot_trigger_backup()
    {
        $lecturer = User::factory()->create(['role' => 'lecturer']);

        $response = $this->actingAs($lecturer, 'sanctum')
                         ->postJson('/api/admin/backups/run');

        $response->assertStatus(403);
    }
}
