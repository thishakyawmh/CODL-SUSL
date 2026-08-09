<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AiInsight extends Model
{
    protected $fillable = [
        'course_id',
        'overall_match_score',
        'industry_coverage',
        'student_coverage',
        'missing_skills',
        'covered_skills',
        'recommendations'
    ];

    protected $casts = [
        'missing_skills' => 'array',
        'covered_skills' => 'array',
        'recommendations' => 'array',
    ];

    public function course()
    {
        return $this->belongsTo(Course::class);
    }
}
