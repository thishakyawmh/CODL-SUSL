<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ReattemptRequest extends Model
{
    protected $guarded = [];

    protected $casts = [
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

    public function subject()
    {
        return $this->belongsTo(Subject::class);
    }

    public function assignedExam()
    {
        return $this->belongsTo(Exam::class, 'assigned_exam_id');
    }
}
