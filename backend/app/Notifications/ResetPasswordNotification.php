<?php

namespace App\Notifications;

use Illuminate\Notifications\Notification;
use Illuminate\Notifications\Messages\MailMessage;

class ResetPasswordNotification extends Notification
{
    public string $token;
    public string $email;

    public function __construct(string $token, string $email)
    {
        $this->token = $token;
        $this->email = $email;
    }

    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        // FIX: Gunakan env('FRONTEND_URL') langsung karena config/app.php
        // default Laravel tidak punya key 'frontend_url'.
        // Alternatif: tambahkan 'frontend_url' => env('FRONTEND_URL') di config/app.php
        $frontendUrl = env('FRONTEND_URL', 'http://localhost:5173');
        $resetUrl    = $frontendUrl . '/reset-password?token=' . $this->token . '&email=' . urlencode($this->email);

        return (new MailMessage)
            ->subject('Reset Password — Picollo')
            ->greeting('Halo, ' . $notifiable->name . '!')
            ->line('Kami menerima permintaan reset password untuk akun Picollo kamu.')
            ->action('Reset Password Sekarang', $resetUrl)
            ->line('Link ini akan kadaluarsa dalam **60 menit**.')
            ->line('Jika kamu tidak merasa meminta reset password, abaikan email ini.')
            ->salutation('Salam, Tim Picollo');
    }
}