<?php

namespace App\AI\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AnalyticsCache extends Model
{
    use HasFactory;

    protected $connection = 'analytics';
    protected $table = 'analytics_cache';

    protected $fillable = [
        'scope_type',
        'scope_id',
        'student_demand_distribution',
        'industry_demand_distribution',
        'domain_frequency_counts',
        'jaccard_similarity_results',
        'emerging_technologies',
        'skill_gaps',
        'generated_recommendations',
        'kpis',
        'generated_at',
    ];

    protected $casts = [
        'student_demand_distribution' => 'array',
        'industry_demand_distribution' => 'array',
        'domain_frequency_counts' => 'array',
        'jaccard_similarity_results' => 'array',
        'emerging_technologies' => 'array',
        'skill_gaps' => 'array',
        'generated_recommendations' => 'array',
        'kpis' => 'array',
        'generated_at' => 'datetime',
    ];
}
