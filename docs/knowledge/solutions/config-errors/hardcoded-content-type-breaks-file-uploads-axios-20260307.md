---
problem_type: config_error
component: service_client
root_cause: config_error
severity: high
resolution_type: config_change
module: customer-portal
tags: [axios, file-upload, multipart, content-type, FormData]
---

# Hardcoded Content-Type Header Breaks File Uploads in Axios

## Symptom
Avatar uploads and other file uploads in the customer portal fail with validation errors. The server receives the file data as a raw string instead of a proper multipart/form-data payload.

## Root Cause
The axios instance in `frontend-customer-portal/lib/axios.ts` had `Content-Type: 'application/json'` hardcoded in default headers. When sending a `FormData` object (for file uploads), axios needs to automatically set `Content-Type: multipart/form-data` with the correct boundary parameter. The hardcoded header prevents this auto-detection.

## Investigation
- Avatar upload request was being sent but server returned validation error (file not received)
- Inspected axios config and found explicit Content-Type in default headers
- The admin frontend (`frontend/lib/axios.ts`) did NOT have this hardcoded header -- only the customer portal did

## Solution
Remove `Content-Type` from axios default headers. Keep only `Accept`:

```ts
// Before (broken)
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// After (fixed)
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: {
    Accept: 'application/json',
  },
});
```

Axios automatically sets the correct Content-Type:
- `application/json` for plain objects
- `multipart/form-data` (with boundary) for `FormData` instances

## Prevention
- NEVER hardcode `Content-Type` in axios default headers when the app handles both JSON and file uploads
- When creating new axios instances, use the admin frontend's `lib/axios.ts` as reference
- Only set `Accept` header as a default; let axios handle `Content-Type` per-request

## Files Changed
- `frontend-customer-portal/lib/axios.ts`
