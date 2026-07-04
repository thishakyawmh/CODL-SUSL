<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class IndustryRequirement extends Model
{
    use HasFactory;

    protected $connection = 'analytics';

    protected $fillable = [
        'company_name',
        'industry_sector',
        'organization_size',
        'primary_academic_field',
        'secondary_academic_field',
        'third_academic_field',
        'required_skills',
        'academic_practices',
        'minimum_qualification',
        'minimum_degree_result',
        'certification_importance',
        'emerging_fields',
        'new_program_suggestion',
        'graduate_skill_gaps',
        'additional_recommendations',
    ];
}
