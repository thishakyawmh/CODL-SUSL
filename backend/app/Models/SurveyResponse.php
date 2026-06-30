<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SurveyResponse extends Model
{
    use HasFactory;

    protected $fillable = [
        'type',
        'respondent_type',
        'preferred_field',
        'skills_to_learn',
        'job_aspirations',
        'company_name',
        'industry_sector',
        'required_skills',
        'skill_shortages',
    ];
}
