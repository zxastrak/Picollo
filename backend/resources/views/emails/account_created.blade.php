<!DOCTYPE html>
<html>
<head>
    <title>Undangan Akun Picollo</title>
</head>
<body style="font-family: sans-serif; background-color: #f4f4f5; padding: 20px;">
    <div style="max-width: 500px; margin: 0 auto; background: #ffffff; padding: 30px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
        <h2 style="color: #18181b; margin-top: 0;">Selamat Datang di Picollo!</h2>
        <p style="color: #52525b; line-height: 1.6;">
            Anda telah didaftarkan sebagai <strong>{{ ucfirst($roleName) }}</strong> oleh administrator outlet Anda.
        </p>
        
        <div style="background-color: #fafafa; border: 1px solid #e4e4e7; border-radius: 8px; padding: 15px; margin: 20px 0;">
            <p style="margin: 0 0 10px 0; color: #52525b; font-size: 14px;">Berikut adalah kredensial login Anda:</p>
            <p style="margin: 0 0 5px 0;"><strong>Email:</strong> {{ $emailStr }}</p>
            <p style="margin: 0;"><strong>Password:</strong> <span style="font-family: monospace; background: #e4e4e7; padding: 2px 6px; border-radius: 4px;">{{ $passwordStr }}</span></p>
        </div>

        <p style="color: #52525b; line-height: 1.6;">
            Silakan klik tombol di bawah ini untuk masuk ke dalam sistem:
        </p>

        <a href="{{ $loginUrl }}" style="display: inline-block; background-color: #facc15; color: #18181b; text-decoration: none; font-weight: bold; padding: 12px 24px; border-radius: 8px; margin-top: 10px;">Masuk ke Aplikasi</a>

        <p style="color: #71717a; font-size: 12px; margin-top: 30px;">
            Atau Anda dapat meng-copy tautan ini ke browser Anda:<br>
            <a href="{{ $loginUrl }}" style="color: #eab308;">{{ $loginUrl }}</a>
        </p>

        <hr style="border: none; border-top: 1px solid #e4e4e7; margin: 30px 0;">
        <p style="color: #a1a1aa; font-size: 12px; text-align: center; margin: 0;">
            &copy; {{ date('Y') }} Picollo POS. All rights reserved.
        </p>
    </div>
</body>
</html>
