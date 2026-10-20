<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::connection('analytics')->create('industry_sectors_config', function (Blueprint $table) {
            $table->id();
            $table->string('sector_name');
            $table->timestamps();
        });

        Schema::connection('analytics')->create('industry_interests_config', function (Blueprint $table) {
            $table->id();
            $table->string('interest_field');
            $table->text('skills'); // Used to store comma-separated sub-disciplines
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::connection('analytics')->dropIfExists('industry_sectors_config');
        Schema::connection('analytics')->dropIfExists('industry_interests_config');
    }
};
