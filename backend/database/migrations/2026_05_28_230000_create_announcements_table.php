<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    
    public function up(): void
    {
        Schema::create('announcements', function (Blueprint $table) {
            $table->id();
            $table->foreignId('course_id')->nullable()->constrained()->onDelete('cascade');
            $table->string('batch')->nullable();
            $table->string('title');
            $table->text('desc');
            $table->string('type')->default('Notice'); // Notice, Important, Update, General
            $table->timestamps();
        });
    }

    
    public function down(): void
    {
        Schema::dropIfExists('announcements');
    }
};
