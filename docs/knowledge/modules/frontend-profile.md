# Frontend Profile Module

## Route Files
| File | Type | Notes |
|------|------|-------|
| `frontend/app/(system)/(profile)/profile/page.tsx` | Page | Multi-section profile page: profile info, account settings, avatar, customer preferences |

## Connected Files
| Category | File | Notes |
|----------|------|-------|
| Service | `services/profileService.ts` | Get/update profile, upload/delete avatar |
| Service | `services/authService.ts` | updateMe (for account email/password changes) |
| Hook | `hooks/useProfile.ts` | useProfile, useUpdateProfile, useUploadAvatar, useDeleteAvatar |
| Hook | `hooks/useCustomers.ts` | useCustomerProfile, useUpdateCustomerPreferences |
| Hook | `hooks/useAuth.ts` | useUpdateMe (for account settings) |
| Store | `stores/authStore.ts` | user (for display and role-based conditional sections) |
| Type | `types/api.ts` | User, ApiError |
| Validation | `lib/validations.ts` | updateProfileSchema, updateAccountSchema, updateCustomerPreferencesSchema |
| Component | `components/address-form-fields.tsx` | Cascading geographic dropdown for profile address |
| Component | `components/avatar-crop-dialog.tsx` | Image crop for avatar upload |
| Utility | `lib/utils.ts` | getInitials |

## Tests
| File | Type |
|------|------|
| No frontend tests | N/A |

## Notes
- Profile page combines multiple forms: personal info (first_name, last_name, phone, bio, address), account settings (email, password), and avatar management
- Customer-role users see an additional customer preferences section
- Address editing uses the cascading geographic dropdown (Region -> Province -> City -> Barangay)
- Avatar upload uses the same crop dialog pattern as merchant logo and customer avatar
