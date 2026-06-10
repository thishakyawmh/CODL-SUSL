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
        Schema::table('reattempt_requests', function (Blueprint $table) {
            $table->text('reason')->nullable()->after('exam_title');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('reattempt_requests', function (Blueprint $table) {
            $table->dropColumn('reason');
        });
    }
};
