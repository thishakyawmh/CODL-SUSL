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
            $table->date('dob')->nullable()->after('phone');
            $table->string('sex', 20)->nullable()->after('dob');
            $table->string('civil_status', 30)->nullable()->after('sex');
            $table->text('address')->nullable()->after('civil_status');
            $table->string('district', 100)->nullable()->after('address');
            $table->string('employment_title')->nullable()->after('district');
            $table->text('official_address')->nullable()->after('employment_title');
            $table->json('ol_subjects')->nullable()->after('official_address');
            $table->json('al_subjects')->nullable()->after('ol_subjects');
            $table->string('whatsapp', 20)->nullable()->after('phone');
            $table->string('home_phone', 20)->nullable()->after('whatsapp');
            $table->string('guardian_phone', 20)->nullable()->after('home_phone');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn([
                'dob',
                'sex',
                'civil_status',
                'address',
                'district',
                'employment_title',
                'official_address',
                'ol_subjects',
                'al_subjects',
                'whatsapp',
                'home_phone',
                'guardian_phone',
            ]);
        });
    }
};
