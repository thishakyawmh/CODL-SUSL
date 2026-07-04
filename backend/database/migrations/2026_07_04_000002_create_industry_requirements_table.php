<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::connection('analytics')->create('industry_requirements', function (Blueprint $table) {

            $table->id();

            // Section 1
            $table->string('company_name')->nullable();
            $table->string('industry_sector');
            $table->string('organization_size')->nullable();

            // Section 2
            $table->string('primary_academic_field');
            $table->string('secondary_academic_field')->nullable();
            $table->string('third_academic_field')->nullable();

            // Section 3
            $table->text('required_skills')->nullable();

            // Section 4
            $table->text('academic_practices')->nullable();
            $table->string('minimum_qualification')->nullable();
            $table->string('minimum_degree_result')->nullable();
            $table->unsignedTinyInteger('certification_importance')->nullable();

            // Section 5
            $table->text('emerging_fields')->nullable();
            $table->text('new_program_suggestion')->nullable();

            // Section 6
            $table->text('graduate_skill_gaps')->nullable();
            $table->text('additional_recommendations')->nullable();

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::connection('analytics')->dropIfExists('industry_requirements');
    }
};
