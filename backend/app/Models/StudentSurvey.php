<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class StudentSurvey extends Model
{
    protected $fillable = [
        'name',
        'email',
        'interest_field',
        'career_path'
    ];
}
