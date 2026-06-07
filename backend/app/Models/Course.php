<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Course extends Model
{
    protected $fillable = [
        'title',
        'code',
        'level',
        'department',
        'duration',
        'intake_status',
        'max_students',
        'secretary_id',
        'coordinator_id',
        'category_id',
    ];

    public function category()
    {
        return $this->belongsTo(Category::class);
    }

    public function secretary()
    {
        return $this->belongsTo(User::class, 'secretary_id');
    }

    public function coordinator()
    {
        return $this->belongsTo(User::class, 'coordinator_id');
    }

    public function semesters()
    {
        return $this->hasMany(Semester::class);
    }

    public function subjects()
    {
        return $this->hasMany(Subject::class);
    }

    public function batches()
    {
        return $this->hasMany(Batch::class);
    }

    public function applications()
    {
        return $this->hasMany(CourseApplication::class);
    }

    public function students()
    {
        return $this->belongsToMany(User::class, 'user_courses')->withPivot('batch')->withTimestamps();
    }
}
