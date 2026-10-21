<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('announcements', function (Blueprint $table) {
            if (!Schema::hasColumn('announcements', 'group')) {
                $table->string('group')->nullable()->after('batch');
            }
            if (!Schema::hasColumn('announcements', 'author_id')) {
                $table->unsignedBigInteger('author_id')->nullable()->after('type');
            }
            if (!Schema::hasColumn('announcements', 'author_role')) {
                $table->string('author_role')->nullable()->after('author_id');
            }
        });
    }

    public function down(): void
    {
        Schema::table('announcements', function (Blueprint $table) {
            if (Schema::hasColumn('announcements', 'group')) {
                $table->dropColumn('group');
            }
            if (Schema::hasColumn('announcements', 'author_id')) {
                $table->dropColumn('author_id');
            }
            if (Schema::hasColumn('announcements', 'author_role')) {
                $table->dropColumn('author_role');
            }
        });
    }
};
