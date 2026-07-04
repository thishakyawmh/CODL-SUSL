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
        Schema::connection('analytics')->table('survey_responses', function (Blueprint $table) {
            $table->json('metadata')->nullable()->after('skill_shortages');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::connection('analytics')->table('survey_responses', function (Blueprint $table) {
            $table->dropColumn('metadata');
        });
    }
};
