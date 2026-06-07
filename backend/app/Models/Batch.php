<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Batch extends Model
{
    use HasFactory;

    protected $fillable = [
        'course_id',
        'name',
        'start_date',
        'registration_deadline',
        'max_enrollments',
        'subtitle',
        'status',
        'instructor_id',
        'materials',
    ];

    protected $casts = [
        'materials' => 'array',
    ];

    public function course()
    {
        return $this->belongsTo(Course::class);
    }

    public function instructor()
    {
        return $this->belongsTo(User::class, 'instructor_id');
    }

    public function subjects()
    {
        return $this->belongsToMany(Subject::class, 'batch_subject_instructor')
                    ->withPivot('instructor_id')
                    ->withTimestamps();
    }
}
