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
            $table->string('salutation')->nullable();
            $table->string('name_with_initials')->nullable();
            $table->string('name_denoted_by_initials')->nullable();
            $table->string('contact_number')->nullable();
            $table->text('permanent_address')->nullable();
            $table->text('address_during_exam')->nullable();
            $table->string('medium')->nullable();
            $table->date('registration_date')->nullable();
            $table->text('postponement_details')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('exam_applications', function (Blueprint $table) {
            $table->dropColumn([
                'salutation',
                'name_with_initials',
                'name_denoted_by_initials',
                'contact_number',
                'permanent_address',
                'address_during_exam',
                'medium',
                'registration_date',
                'postponement_details',
            ]);
        });
    }
};
