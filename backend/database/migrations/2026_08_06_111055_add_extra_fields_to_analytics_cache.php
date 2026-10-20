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
        Schema::table('analytics_cache', function (Blueprint $table) {
            $table->json('emerging_technologies')->nullable();
            $table->json('skill_gaps')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('analytics_cache', function (Blueprint $table) {
            $table->dropColumn(['emerging_technologies', 'skill_gaps']);
        });
    }
};
