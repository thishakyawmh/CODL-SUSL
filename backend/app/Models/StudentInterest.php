<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class StudentInterest extends Model
{
    protected $connection = 'analytics';
    protected $table = 'student_interests';
    
    protected $fillable = [
        'respondent_type',
        'preferred_field',
        'career_interests',
        'skills_to_learn',
        'job_aspirations',
        'comments'
    ];
}