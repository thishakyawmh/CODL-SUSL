<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SystemSetting extends Model
{
    use HasFactory;

    protected $fillable = [
        'institution_name',
        'university_name',
        'contact_email',
        'contact_phone',
        'address',
        'logo',
        'website_url',
        'academic_year',
        'session_timeout',
        'min_password_length',
        'maintenance_mode',
        'maintenance_message',
        'backup_frequency',
        'backup_retention',
        'last_backup_at',
        'last_backup_status',
        'next_backup_at',
    ];

    protected $casts = [
        'maintenance_mode' => 'boolean',
        'last_backup_at' => 'datetime',
        'next_backup_at' => 'datetime',
    ];
}
