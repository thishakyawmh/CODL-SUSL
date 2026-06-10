<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    
    public function up(): void
    {

        Schema::create('subjects', function (Blueprint $table) {
            $table->id();
            $table->foreignId('course_id')->nullable()->constrained()->onDelete('cascade');
            $table->foreignId('semester_id')->nullable()->constrained()->onDelete('cascade');
            $table->string('code')->unique();
            $table->string('name');
            $table->string('credits')->nullable();
            $table->foreignId('instructor_id')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamps();
        });
    
    }

    
    public function down(): void
    {
        Schema::dropIfExists('subjects');
    }
};
