<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Announcement extends Model
{
    use HasFactory;

    protected $fillable = [
        'course_id',
        'batch',
        'title',
        'desc',
        'type',
    ];

    public function course()
    {
        return $this->belongsTo(Course::class);
    }
}
