<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::connection('analytics')->table('student_interests', function (Blueprint $table) {
            if (!Schema::connection('analytics')->hasColumn('student_interests', 'email')) {
                $table->string('email')->nullable()->after('survey_submitted_at');
            }
            if (!Schema::connection('analytics')->hasColumn('student_interests', 'whatsapp_no')) {
                $table->string('whatsapp_no')->nullable();
            }
        });
    }

    public function down(): void
    {
        Schema::connection('analytics')->table('student_interests', function (Blueprint $table) {
            $cols = [];
            if (Schema::connection('analytics')->hasColumn('student_interests', 'email')) {
                $cols[] = 'email';
            }
            if (Schema::connection('analytics')->hasColumn('student_interests', 'whatsapp_no')) {
                $cols[] = 'whatsapp_no';
            }
            if (!empty($cols)) {
                $table->dropColumn($cols);
            }
        });
    }
};
