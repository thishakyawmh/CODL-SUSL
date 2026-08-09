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
        Schema::table('users', function (Blueprint $table) {
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
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['ol_year', 'ol_index', 'al_year', 'al_index']);
        });
    }
};
