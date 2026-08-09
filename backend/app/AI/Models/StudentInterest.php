<?php

namespace App\AI\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class StudentInterest extends Model
{
    use HasFactory;

    protected $connection = 'analytics';

    protected $fillable = [
        'survey_submitted_at',
        'email',
        'whatsapp_no',
        'education_level',
        'province',
        'district',
        'primary_field',
        'primary_skills',
        'primary_teaching_methods',
        'primary_theory_practical',
        'secondary_field',
        'secondary_skills',
        'secondary_teaching_methods',
        'secondary_theory_practical',
        'third_field',
        'third_skills',
        'third_teaching_methods',
        'third_theory_practical',
        'specializations',
        'learning_preferences',
        'theory_practical_score',
        'university_opportunities',
        'emerging_fields',
        'new_program_suggestion',
    ];
}
