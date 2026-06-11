<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PostponementRequest extends Model
{
    protected $guarded = [];

    protected $casts = [
        'exams' => 'array',
        'medical_cert' => 'boolean',
        'stages' => 'array',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function course()
    {
        return $this->belongsTo(Course::class);
    }

    public function assignedExam()
    {
        return $this->belongsTo(Exam::class, 'assigned_exam_id');
    }
}
