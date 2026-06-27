<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class LetterRequest extends Model
{
    protected $guarded = [];

    protected $casts = [
        'secretary_approved_at' => 'datetime',
        'coordinator_approved_at' => 'datetime',
        'director_approved_at' => 'datetime',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function course()
    {
        return $this->belongsTo(Course::class);
    }

    public function secretaryUser()
    {
        return $this->belongsTo(User::class, 'approved_by_secretary');
    }

    public function coordinatorUser()
    {
        return $this->belongsTo(User::class, 'approved_by_coordinator');
    }

    public function directorUser()
    {
        return $this->belongsTo(User::class, 'approved_by_director');
    }
}
