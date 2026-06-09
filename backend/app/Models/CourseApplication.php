<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CourseApplication extends Model
{
    protected $fillable = [
        'user_id',
        'applicant_name',
        'display_name',
        'applicant_email',
        'applicant_nic',
        'course_id',
        'batch_id',
        'status',
        'approval_level',
        'phone',
        'whatsapp',
        'home_phone',
        'guardian_phone',
        'district',
        'dob',
        'sex',
        'civil_status',
        'address',
        'employment_title',
        'official_address',
        'ol_subjects',
        'ol_year',
        'ol_index',
        'al_subjects',
        'al_year',
        'al_index',
        'other_qualifications',
        'is_new_applicant',
        'documents',
        'documents_verified',
        'approved_by_secretary',
        'approved_by_coordinator',
        'approved_by_director',
        'secretary_comment',
        'coordinator_comment',
        'director_comment',
        'secretary_approved_at',
        'coordinator_approved_at',
        'director_approved_at',
        'generated_student_number',
    ];

    protected $casts = [
        'ol_subjects' => 'array',
        'al_subjects' => 'array',
        'documents' => 'array',
        'documents_verified' => 'array',
        'is_new_applicant' => 'boolean',
        'dob' => 'date',
        'secretary_approved_at' => 'datetime',
        'coordinator_approved_at' => 'datetime',
        'director_approved_at' => 'datetime',
    ];

    public function course()
    {
        return $this->belongsTo(Course::class);
    }

    public function batch()
    {
        return $this->belongsTo(Batch::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function secretaryApprover()
    {
        return $this->belongsTo(User::class, 'approved_by_secretary');
    }

    public function coordinatorApprover()
    {
        return $this->belongsTo(User::class, 'approved_by_coordinator');
    }

    public function directorApprover()
    {
        return $this->belongsTo(User::class, 'approved_by_director');
    }
}
