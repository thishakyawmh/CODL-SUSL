<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ExamApplication extends Model
{
    protected $guarded = [];

    protected $casts = [
        'subjects' => 'array',
        'fee_paid' => 'float',
        'stages' => 'array',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function course()
    {
        return $this->belongsTo(Course::class);
    }
}
