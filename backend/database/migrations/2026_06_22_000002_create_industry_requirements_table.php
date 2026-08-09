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
            $table->string('company_name');
            $table->string('industry_sector');
            $table->string('demanded_roles');
            $table->text('required_skills');
            $table->string('emerging_technologies');
            $table->text('expected_competencies');
            $table->text('skill_shortages');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::connection('analytics')->dropIfExists('industry_requirements');
    }
};