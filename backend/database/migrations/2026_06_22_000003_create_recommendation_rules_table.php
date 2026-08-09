<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::connection('analytics')->create('recommendation_rules', function (Blueprint $table) {
            $table->id();
            $table->string('rule_name');
            $table->string('target_course_pattern'); // e.g. /^bsc\s*(info|computer)/i
            $table->string('trigger_skill_pattern'); // e.g. /docker|kubernetes|devops/i
            $table->string('recommendation_subject'); // suggested subject name
            $table->text('recommendation_text'); // HTML/Text description
            $table->integer('threshold_percent')->default(15);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::connection('analytics')->dropIfExists('recommendation_rules');
    }
};