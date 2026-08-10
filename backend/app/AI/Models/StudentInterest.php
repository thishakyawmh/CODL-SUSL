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
        'whatsapp',
        'education_level',
        'province',
        'district',
        'primary_interest',
        'primary_skills',
        'primary_learning_methods',
        'primary_learning_balance',
        'secondary_interest',
        'secondary_skills',
        'secondary_learning_methods',
        'secondary_learning_balance',
        'ternary_interest',
        'ternary_skills',
        'ternary_learning_methods',
        'ternary_learning_balance',
        'university_opportunities',
        'new_program_suggestion',
    ];
}
