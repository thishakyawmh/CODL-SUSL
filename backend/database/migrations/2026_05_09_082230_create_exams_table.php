<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('exams', function (Blueprint $table) {
            $table->id();
            $table->foreignId('course_id')->constrained()->onDelete('cascade');
            $table->string('batch_name')->nullable();
            $table->string('title');
            $table->date('deadline')->nullable();
            $table->date('date')->nullable();
            $table->decimal('fee', 8, 2)->default(0);
            $table->string('type')->nullable();
            $table->string('status')->default('Upcoming');
            $table->string('timetable_path')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('exams');
    }
};
