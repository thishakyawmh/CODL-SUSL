<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AnalyticsCache extends Model
{
    use HasFactory;

    protected $connection = 'analytics';
    protected $table = 'analytics_cache';

    protected $fillable = [
        'student_demand_distribution',
        'industry_demand_distribution',
        'domain_frequency_counts',
        'jaccard_similarity_results',
        'generated_recommendations',
        'kpis',
        'generated_at',
    ];

    protected $casts = [
        'student_demand_distribution' => 'array',
        'industry_demand_distribution' => 'array',
        'domain_frequency_counts' => 'array',
        'jaccard_similarity_results' => 'array',
        'generated_recommendations' => 'array',
        'kpis' => 'array',
        'generated_at' => 'datetime',
    ];
}
