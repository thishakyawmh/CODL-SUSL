<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class RecommendationRule extends Model
{
    use HasFactory;

    // Point this to the analytics database connection we created
    protected $connection = 'analytics';

    protected $fillable = [
        'rule_name',
        'target_course_pattern',
        'trigger_skill_pattern',
        'recommendation_subject',
        'recommendation_text',
        'threshold_percent',
    ];
}
