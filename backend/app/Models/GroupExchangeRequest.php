<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class GroupExchangeRequest extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'course_id',
        'batch_id',
        'batch_name',
        'current_group',
        'requested_group',
        'reason',
        'status',
        'action_by',
        'action_at',
        'action_comment',
    ];

    protected $casts = [
        'action_at' => 'datetime',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function course()
    {
        return $this->belongsTo(Course::class);
    }

    public function batch()
    {
        return $this->belongsTo(Batch::class);
    }

    public function actionUser()
    {
        return $this->belongsTo(User::class, 'action_by');
    }
}
