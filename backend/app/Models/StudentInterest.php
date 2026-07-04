<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class StudentInterest extends Model
{
    use HasFactory;

    protected $connection = 'analytics';

    protected $fillable = [
        'education_level',
        'province',
        'district',
        'primary_field',
        'secondary_field',
        'third_field',
        'specializations',
        'learning_preferences',
        'theory_practical_score',
        'university_opportunities',
        'emerging_fields',
        'new_program_suggestion',
    ];
}
