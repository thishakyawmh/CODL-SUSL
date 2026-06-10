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
        Schema::table('postponement_requests', function (Blueprint $table) {
            $table->string('application_id')->nullable()->after('id');
        });

        Schema::table('reattempt_requests', function (Blueprint $table) {
            $table->string('application_id')->nullable()->after('id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('postponement_requests', function (Blueprint $table) {
            $table->dropColumn('application_id');
        });

        Schema::table('reattempt_requests', function (Blueprint $table) {
            $table->dropColumn('application_id');
        });
    }
};
