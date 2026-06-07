<!DOCTYPE html>
<html>
<head>
    <title>Kode OTP Anda</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
    <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
        <h2 style="text-align: center; color: #4F46E5;">Picollo</h2>
        <p>Halo,</p>
        <p>Anda menerima email ini sebagai bagian dari proses <strong>{{ $purpose }}</strong> di aplikasi Picollo.</p>
        <p>Berikut adalah kode OTP rahasia Anda:</p>
        
        <div style="text-align: center; margin: 30px 0;">
            <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #4F46E5; background-color: #f4f4f5; padding: 10px 20px; border-radius: 8px;">
                {{ $otpCode }}
            </span>
        </div>
        
        <p style="font-size: 14px; color: #666;">
            Kode OTP ini hanya berlaku selama <strong>5 menit</strong>. Jangan berikan kode ini kepada siapa pun.
        </p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="font-size: 12px; color: #999; text-align: center;">
            &copy; {{ date('Y') }} Picollo. All rights reserved.
        </p>
    </div>
</body>
</html>
