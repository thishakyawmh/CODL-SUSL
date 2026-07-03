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
        // Notice we are specifying the connection explicitly for the analytics DB
        Schema::connection('analytics')->create('recommendation_rules', function (Blueprint $table) {
            $table->id();
            $table->string('rule_name');
            $table->string('target_course_pattern')->comment('Regex pattern to match against courses in main DB');
            $table->string('trigger_skill_pattern')->comment('Regex pattern to match against survey skills');
            $table->string('recommendation_subject');
            $table->text('recommendation_text');
            $table->integer('threshold_percent')->default(15);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::connection('analytics')->dropIfExists('recommendation_rules');
    }
};
