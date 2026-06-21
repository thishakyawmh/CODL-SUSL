<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class IndustrySurvey extends Model
{
    protected $fillable = [
        'company_name',
        'industry_sector',
        'job_roles',
        'required_skills',
        'demand_level'
    ];

    protected $casts = [
        'job_roles' => 'array',
        'required_skills' => 'array',
    ];
}
