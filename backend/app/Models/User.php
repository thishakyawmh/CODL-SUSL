<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Laravel\Sanctum\HasApiTokens;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable
{

    use HasApiTokens, HasFactory, Notifiable;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'student_number',
        'full_name',
        'display_name',
        'email',
        'password',
        'nic',
        'role',
        'status',
        'avatar',
        'phone',
        'dob',
        'sex',
        'civil_status',
        'address',
        'district',
        'employment_title',
        'official_address',
        'ol_subjects',
        'ol_year',
        'ol_index',
        'al_subjects',
        'al_year',
        'al_index',
        'whatsapp',
        'home_phone',
        'guardian_phone',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'ol_subjects' => 'array',
            'al_subjects' => 'array',
            'dob' => 'date',
        ];
    }

    public function courses()
    {
        return $this->belongsToMany(Course::class, 'user_courses')->withPivot('batch')->withTimestamps();
    }

    /**
     * Mutator to hash the password if not already hashed.
     */
    public function setPasswordAttribute($value)
    {
        if (is_null($value)) {
            $this->attributes['password'] = null;
            return;
        }

        // If already hashed, don't hash again
        if (preg_match('/^\$(2[ayb]|argon2)/', $value)) {
            $this->attributes['password'] = $value;
        } else {
            $this->attributes['password'] = \Illuminate\Support\Facades\Hash::make($value);
        }
    }
}
