<?php

namespace App\Mail;

use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class ResetPasswordMail extends Mailable
{
    use Queueable, SerializesModels;

    public $user;
    public $token;
    public $resetUrl;

    /**
     * Create a new message instance.
     */
    public function __construct(User $user, string $token)
    {
        $this->user = $user;
        $this->token = $token;
        
        $frontendUrl = config('app.frontend_url', 'http://localhost:5173');
        $this->resetUrl = rtrim($frontendUrl, '/') . '/reset-password?token=' . $token . '&email=' . urlencode($user->email);
    }

    /**
     * Build the message.
     */
    public function build()
    {
        return $this->subject('Reset Your Password - CODL SUSL')
                    ->view('emails.reset-password');
    }
}
