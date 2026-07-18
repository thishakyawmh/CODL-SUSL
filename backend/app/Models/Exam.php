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

    protected $appends = ['postponements', 'reattempts'];

    public function getPostponementsAttribute()
    {
        return \App\Models\PostponementRequest::where('assigned_exam_id', $this->id)
            ->pluck('id')
            ->map(fn($id) => (string)$id)
            ->toArray();
    }

    public function getReattemptsAttribute()
    {
        return \App\Models\ReattemptRequest::where('assigned_exam_id', $this->id)
            ->pluck('id')
            ->map(fn($id) => (string)$id)
            ->toArray();
    }

    public function course()
    {
        return $this->belongsTo(Course::class);
    }
}
