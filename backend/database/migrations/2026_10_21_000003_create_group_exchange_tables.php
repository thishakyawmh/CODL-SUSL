<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('group_exchange_requests')) {
            Schema::create('group_exchange_requests', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('user_id');
                $table->unsignedBigInteger('course_id');
                $table->unsignedBigInteger('batch_id')->nullable();
                $table->string('batch_name')->nullable();
                $table->string('current_group')->nullable();
                $table->string('requested_group');
                $table->text('reason')->nullable();
                $table->string('status')->default('pending'); // pending, approved, rejected
                $table->unsignedBigInteger('action_by')->nullable();
                $table->timestamp('action_at')->nullable();
                $table->text('action_comment')->nullable();
                $table->timestamps();

                $table->index(['course_id', 'batch_id']);
                $table->index(['user_id', 'course_id']);
                $table->index('status');
            });
        }

        if (!Schema::hasTable('group_exchange_histories')) {
            Schema::create('group_exchange_histories', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('user_id');
                $table->unsignedBigInteger('course_id');
                $table->string('batch_name')->nullable();
                $table->string('from_group')->nullable();
                $table->string('to_group');
                $table->unsignedBigInteger('changed_by')->nullable();
                $table->string('method')->default('request_approval'); // request_approval, manual_assignment
                $table->timestamps();

                $table->index(['user_id', 'course_id']);
                $table->index('created_at');
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('group_exchange_histories');
        Schema::dropIfExists('group_exchange_requests');
    }
};
