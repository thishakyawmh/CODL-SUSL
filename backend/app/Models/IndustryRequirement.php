<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class IndustryRequirement extends Model
{
    protected $connection = 'analytics';
    protected $table = 'industry_requirements';
    
    protected $fillable = [
        'company_name',
        'industry_sector',
        'demanded_roles',
        'required_skills',
        'emerging_technologies',
        'expected_competencies',
        'skill_shortages'
    ];
}