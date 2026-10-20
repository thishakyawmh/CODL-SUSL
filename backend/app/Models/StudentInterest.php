<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class StudentInterest extends Model
{
    protected $connection = 'analytics';
    protected $table = 'student_interests';
    
    protected $guarded = [];
}