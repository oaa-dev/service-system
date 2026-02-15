<x-mail::message>
# New Merchant Application

Hello,

A new merchant application has been submitted for your review.

**Merchant:** {{ $merchantName }}

**Submitted at:** {{ $submittedAt }}

Please review this application at your earliest convenience.

Thanks,<br>
{{ config('app.name') }}
</x-mail::message>
