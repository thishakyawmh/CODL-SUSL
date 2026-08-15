<?php

namespace App\AI\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * Persistent cache for Gemini-classified domain texts.
 *
 * text_hash   — MD5 of the normalised text (primary key)
 * domains     — JSON array of matched domain label strings
 * hit_count   — incremented each time the cached value is reused
 */
class DomainClassification extends Model
{
    protected $connection = 'analytics';
    protected $table      = 'domain_classifications';
    protected $primaryKey = 'text_hash';
    public    $incrementing = false;
    protected $keyType    = 'string';

    protected $fillable = [
        'text_hash',
        'text_sample',
        'domains',
        'hit_count',
    ];

    protected $casts = [
        'domains'   => 'array',
        'hit_count' => 'integer',
    ];
}
