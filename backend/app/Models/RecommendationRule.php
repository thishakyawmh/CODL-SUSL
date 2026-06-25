<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class RecommendationRule extends Model
{
    protected $connection = 'analytics';
    protected $table = 'recommendation_rules';
    
    protected $fillable = [
        'rule_name',
        'target_course_pattern',
        'trigger_skill_pattern',
        'recommendation_subject',
        'recommendation_text',
        'threshold_percent'
    ];
}