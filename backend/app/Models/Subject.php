<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Subject extends Model
{
    protected $fillable = [
        'course_id', 
        'semester_id', 
        'code', 
        'name', 
        'credits'
    ];

    public function batches()
    {
        return $this->belongsToMany(Batch::class, 'batch_subject_instructor')
                    ->withPivot('instructor_id')
                    ->withTimestamps();
    }
}
