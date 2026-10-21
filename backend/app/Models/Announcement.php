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
        'group',
        'title',
        'desc',
        'type',
        'author_id',
        'author_role',
        'attachment_url',
        'attachment_name',
        'attachment_size',
    ];

    public function course()
    {
        return $this->belongsTo(Course::class);
    }

    public function author()
    {
        return $this->belongsTo(User::class, 'author_id');
    }
}
