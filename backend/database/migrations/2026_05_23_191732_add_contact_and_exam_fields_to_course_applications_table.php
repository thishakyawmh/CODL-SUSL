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
        Schema::table('course_applications', function (Blueprint $table) {
            $table->string('whatsapp', 20)->nullable()->after('phone');
            $table->string('home_phone', 20)->nullable()->after('whatsapp');
            $table->string('guardian_phone', 20)->nullable()->after('home_phone');
            $table->string('ol_year', 10)->nullable()->after('ol_subjects');
            $table->string('ol_index', 30)->nullable()->after('ol_year');
            $table->string('al_year', 10)->nullable()->after('al_subjects');
            $table->string('al_index', 30)->nullable()->after('al_year');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('course_applications', function (Blueprint $table) {
            $table->dropColumn([
                'whatsapp',
                'home_phone',
                'guardian_phone',
                'ol_year',
                'ol_index',
                'al_year',
                'al_index',
            ]);
        });
    }
};
