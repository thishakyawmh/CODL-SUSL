<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Add the academic_entry_requirements JSON column to analytics_cache.
     * This column stores the secondary aggregation over the already-accepted
     * industry records produced by the program relevance pipeline.
     */
    public function up(): void
    {
        Schema::connection('analytics')->table('analytics_cache', function (Blueprint $table) {
            $table->json('academic_entry_requirements')->nullable()->after('skill_gaps');
        });
    }

    public function down(): void
    {
        Schema::connection('analytics')->table('analytics_cache', function (Blueprint $table) {
            $table->dropColumn('academic_entry_requirements');
        });
    }
};
