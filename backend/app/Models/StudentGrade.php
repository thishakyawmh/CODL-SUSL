<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class StudentGrade extends Model
{
    protected $guarded = [];

    public function examResult()
    {
        return $this->belongsTo(ExamResult::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
