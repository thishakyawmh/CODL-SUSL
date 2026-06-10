<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Exam extends Model
{
    use HasFactory;

    protected $fillable = [
        'course_id',
        'batch_name',
        'title',
        'deadline',
        'date',
        'fee',
        'type',
        'status',
        'timetable_path',
        'subjects',
        'semester',
        'regulars',
    ];

    protected $casts = [
        'subjects' => 'array',
        'regulars' => 'array',
    ];

    public function course()
    {
        return $this->belongsTo(Course::class);
    }
}
