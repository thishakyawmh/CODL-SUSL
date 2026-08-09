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
        Schema::connection('analytics')->create('analytics_cache', function (Blueprint $table) {
            $table->id();
            
            // We use JSON columns to easily store complex aggregated data
            $table->json('student_demand_distribution')->nullable();
            $table->json('industry_demand_distribution')->nullable();
            $table->json('domain_frequency_counts')->nullable();
            $table->json('jaccard_similarity_results')->nullable();
            $table->json('generated_recommendations')->nullable();
            $table->json('kpis')->nullable();

            $table->timestamp('generated_at')->useCurrent();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::connection('analytics')->dropIfExists('analytics_cache');
    }
};
