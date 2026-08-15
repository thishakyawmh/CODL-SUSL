<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * This migration creates a persistent cache for Gemini-classified domain texts.
     * Uses the 'analytics' DB connection (same as all other AI tables).
     *
     * text_hash  — MD5 of the normalised text (primary key, instant lookup)
     * domains    — JSON array of matched domain strings from the synonym dictionary
     * hit_count  — how many times this cached result has been reused (monitoring)
     */
    protected $connection = 'analytics';

    public function up(): void
    {
        Schema::connection('analytics')->create('domain_classifications', function (Blueprint $table) {
            $table->string('text_hash', 32)->primary();   // MD5 hex — always 32 chars
            $table->string('text_sample', 500)->nullable(); // First 500 chars of original text (for debugging)
            $table->json('domains');                       // Array of matched domain strings
            $table->unsignedInteger('hit_count')->default(0); // Times reused from cache
            $table->timestamps();                          // created_at / updated_at
        });
    }

    public function down(): void
    {
        Schema::connection('analytics')->dropIfExists('domain_classifications');
    }
};
