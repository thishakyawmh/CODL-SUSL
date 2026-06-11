<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ActivityLog extends Model
{
    protected $fillable = ['user_id', 'action', 'target', 'type'];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public static function log($userId, $action, $target, $type)
    {
        return self::create([
            'user_id' => $userId,
            'action' => $action,
            'target' => $target,
            'type' => $type,
        ]);
    }
}
