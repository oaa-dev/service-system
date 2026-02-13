<x-mail::message>
# Hello, {{ $userName }}

You are receiving this email because we need to verify your email address.

Please use the following verification code to complete your registration:

<x-mail::panel>
<div style="text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 8px; font-family: monospace;">
{{ $otp }}
</div>
</x-mail::panel>

This code will expire in **{{ $expiresInMinutes }} minutes**.

If you did not create an account, no further action is required and you can safely ignore this email.

Thanks,<br>
{{ config('app.name') }}
</x-mail::message>
