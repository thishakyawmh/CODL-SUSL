<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::connection('analytics')->table('analytics_cache', function (Blueprint $table) {
            $table->string('scope_type')->default('global'); // 'global', 'program', etc.
            $table->string('scope_id')->nullable(); // Course ID, department ID, etc.
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::connection('analytics')->table('analytics_cache', function (Blueprint $table) {
            $table->dropColumn(['scope_type', 'scope_id']);
        });
    }
};
