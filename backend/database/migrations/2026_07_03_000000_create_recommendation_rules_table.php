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
        Schema::connection('analytics')->create('recommendation_rules', function (Blueprint $table) {

            $table->id();

            // Rule Information
            $table->string('rule_name');
            $table->text('description')->nullable();

            // Course Pattern
            $table->string('target_course_pattern');
            // Example:
            // /^bsc\s*(computer|information|software)/i

            // Industry / Student Skill Pattern
            $table->text('trigger_skill_pattern');
            // Example:
            // docker|kubernetes|devops|aws

            // Recommendation
            $table->string('recommendation_type');
            // Examples:
            // New Subject
            // Update Existing Subject
            // Introduce Specialization
            // Curriculum Revision

            $table->string('recommendation_subject');

            $table->text('recommendation_text');

            // Trigger Threshold
            $table->unsignedTinyInteger('threshold_percent')->default(15);

            // New Columns
            $table->string('priority')->default('Medium');
            $table->string('evidence_source')->default('Industry');

            // Metadata
            $table->boolean('is_active')->default(true);

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::connection('analytics')->dropIfExists('recommendation_rules');
    }
};
