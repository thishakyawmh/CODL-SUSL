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
        Schema::table('exam_applications', function (Blueprint $table) {
            $table->foreignId('exam_id')->nullable()->constrained()->onDelete('set null')->after('course_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('exam_applications', function (Blueprint $table) {
            $table->dropConstrainedForeignId('exam_id');
        });
    }
};
