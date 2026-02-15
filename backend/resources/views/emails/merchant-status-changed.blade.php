<x-mail::message>
# Merchant Application Update

Hello,

Your merchant "{{ $merchantName }}" application status has been updated.

**Previous Status:** {{ ucfirst($oldStatus) }}

**New Status:** {{ ucfirst($newStatus) }}

@if($reason)
**Reason:** {{ $reason }}
@endif

@if($newStatus === 'approved')
Congratulations! Your application has been approved.
@elseif($newStatus === 'rejected')
If you believe this was made in error, please update your profile and re-submit your application.
@elseif($newStatus === 'suspended')
Please contact support if you have any questions.
@elseif($newStatus === 'active')
Your store is now active! You can start managing your services and accepting orders.
@endif

Thanks,<br>
{{ config('app.name') }}
</x-mail::message>
