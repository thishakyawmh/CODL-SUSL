<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    
    public function up(): void
    {

        Schema::create('letter_requests', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->foreignId('course_id')->constrained()->onDelete('cascade');
            $table->string('letter_type');
            $table->text('reason');
            $table->string('status')->default('pending');
            
            
            $table->string('name_with_initials')->nullable();
            $table->text('address')->nullable();
            $table->string('phone')->nullable();
            $table->string('nic')->nullable();
            $table->string('year')->nullable();
            $table->string('batch')->nullable();
            $table->string('registration_number')->nullable();
            
           
            $table->integer('approval_level')->default(0);
            $table->unsignedBigInteger('approved_by_secretary')->nullable();
            $table->unsignedBigInteger('approved_by_coordinator')->nullable();
            $table->unsignedBigInteger('approved_by_director')->nullable();
            $table->timestamp('secretary_approved_at')->nullable();
            $table->timestamp('coordinator_approved_at')->nullable();
            $table->timestamp('director_approved_at')->nullable();
            $table->text('secretary_comment')->nullable();
            $table->text('coordinator_comment')->nullable();
            $table->text('director_comment')->nullable();
            
            $table->timestamps();

            // Foreign keys
            $table->foreign('approved_by_secretary')->references('id')->on('users')->onDelete('set null');
            $table->foreign('approved_by_coordinator')->references('id')->on('users')->onDelete('set null');
            $table->foreign('approved_by_director')->references('id')->on('users')->onDelete('set null');
        });
    
    }

   
    public function down(): void
    {
        Schema::dropIfExists('letter_requests');
    }
};
