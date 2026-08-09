<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::connection('analytics')->table('student_interests', function (Blueprint $table) {
            $table->string('email')->nullable()->after('survey_submitted_at');
            $table->string('whatsapp_no')->nullable()->after('email');
        });
    }

    public function down(): void
    {
        Schema::connection('analytics')->table('student_interests', function (Blueprint $table) {
            $table->dropColumn(['email', 'whatsapp_no']);
        });
    }
};
