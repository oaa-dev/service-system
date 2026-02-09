# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a monorepo containing two applications:
- **Backend**: `backend/` - Laravel 12 REST API with OAuth2 authentication
- **Frontend**: `frontend/` - Next.js 16 with React 19

## Development Commands

### Backend (backend/)

```bash
docker compose up -d    # Start Docker containers (MySQL, Redis, etc.)
docker compose exec app php artisan migrate    # Run migrations
docker compose exec app php artisan test       # Run Pest tests
docker compose exec app composer install       # Install dependencies
./vendor/bin/pint       # Code formatting (Laravel Pint)
```

**API URL:** http://localhost:8090/api/v1

### Frontend (frontend/)

```bash
npm install             # Install dependencies (first time)
npm run dev             # Development server (localhost:3000)
npm run build           # Production build
npm run lint            # ESLint
```

**Frontend URL:** http://localhost:3000

### Running Single Tests

```bash
# From backend/
php artisan test --filter=TestClassName
php artisan test --filter=test_method_name
php artisan test tests/Feature/Api/V1/AuthControllerTest.php
```

## Architecture

### Backend - Service-Repository Pattern

```
Controllers → Services → Repositories → Models → Database
     ↓
  Resources (JSON transformation)
     ↓
  ApiResponse trait (standardized JSON format)
```

**Key directories:**
- `app/Http/Controllers/Api/V1/` - API controllers (Auth, User, Profile)
- `app/Services/` - Business logic with interface contracts
- `app/Repositories/` - Data access layer with BaseRepository
- `app/Http/Resources/Api/V1/` - JSON transformers (output)
- `app/Http/Requests/Api/V1/` - Form Request validation classes
- `app/Data/` - Input DTOs (Spatie Laravel Data)
- `app/Rules/` - Custom validation rules
- `routes/api.php` - All API routes (v1 prefix)

**Standard API Response Format:**
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... },
  "meta": { "pagination": ... }
}
```

### Input DTOs (Data Transfer Objects)

Type-safe data transfer from Controllers to Services using Spatie Laravel Data.

**Design Principle:** One model = One DTO

**Location:** `app/Data/`

```php
// Example: app/Data/UserData.php
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Optional;

class UserData extends Data
{
    public function __construct(
        public string|Optional $name = new Optional(),
        public string|Optional $email = new Optional(),
        public string|Optional $password = new Optional(),
        public array|Optional $roles = new Optional(),
    ) {}
}
```

**Usage in Controller:**
```php
$data = UserData::from($request->validated());
$user = $this->userService->createUser($data);
```

**Usage in Service:**
```php
public function updateUser(int $id, UserData $data): User
{
    $updateData = collect($data->toArray())
        ->reject(fn ($value) => $value instanceof Optional)
        ->toArray();
    // ...
}
```

**Available DTOs:**
- `UserData` - User create/update
- `ProfileData` - Profile update (with nested AddressData)
- `AddressData` - Address fields
- `RoleData` - Role create/update
- `ConversationData` - Messaging conversations

### Image Configuration

Centralized image upload configuration with custom validation rule.

**Config:** `config/images.php`
```php
'avatar' => [
    'mimes' => ['jpeg', 'png', 'webp'],
    'max_size' => 5120,  // KB (5MB)
    'min_width' => 100,
    'min_height' => 100,
    'max_width' => 4000,
    'max_height' => 4000,
    'recommendation' => 'Upload a square image...',
],
'document' => [
    'mimes' => ['pdf', 'doc', 'docx'],
    'max_size' => 10240,  // KB (10MB)
    'recommendation' => 'Upload documents in PDF...',
],
```

**Validation Rule:** `app/Rules/ImageRule.php`
```php
// In FormRequest
public function rules(): array
{
    return [
        'avatar' => ['required', ImageRule::avatar()],
        'document' => ['required', ImageRule::document()],
    ];
}
```

**API Endpoint:** `GET /api/v1/config/images` - Returns image configuration (public, no auth required)

### Frontend - Next.js App Router

**State Management:**
- TanStack React Query - Server state, API caching
- Zustand - Client/UI state
- TanStack React Form - Form management

**Path alias:** `@/*` maps to project root

### Authentication

OAuth2 via Laravel Passport. Bearer token in Authorization header.

**Flow:**
1. Register/Login → `POST /api/v1/auth/register` or `/login`
2. Returns access_token
3. Protected routes: `Authorization: Bearer {token}`

### Key Packages

**Backend:**
- Laravel Passport - OAuth2
- Spatie Laravel Data - Input DTOs
- Spatie Media Library - File/avatar management
- Spatie Query Builder - API filtering/sorting
- L5-Swagger - OpenAPI docs at `/api/documentation`
- Pest - Testing framework

**Frontend:**
- TanStack React Query v5
- TanStack React Form v1
- Zustand v5
- Tailwindcss v4

## API Endpoints

All prefixed with `/api/v1/`

- `POST /auth/register`, `POST /auth/login`, `POST /auth/logout`
- `GET /auth/me`, `PUT /auth/me`
- `GET|POST /users`, `GET|PUT|DELETE /users/{id}`
- `GET|PUT /profile`, `POST|DELETE /profile/avatar`
- `GET /config/images` - Image upload configuration (public)

## Docker Services

| Service | Port | Description |
|---------|------|-------------|
| API (Nginx) | 8090 | Laravel REST API |
| phpMyAdmin | 8091 | Database management |
| Mailpit | 8092 | Email testing UI |
| RabbitMQ | 8093 | Message queue management |
| MySQL | 3317 | Database |
| Redis | 6389 | Cache |
| RabbitMQ AMQP | 5682 | Message queue |

## Database

- User → UserProfile (1:1, auto-created on user creation)
- User → Address (polymorphic via HasAddress trait)
- User → Media (Spatie Media Library for avatars/documents)

## Git Configuration

**Repository:** `git@github-oaa:oaa-dev/laravel-react-project.git`

This project uses a custom SSH host alias for the `oaa-dev` GitHub account. Add this to `~/.ssh/config`:

```
Host github-oaa
  HostName github.com
  User git
  IdentityFile ~/.ssh/id_ed25519_oaa_dev
  IdentitiesOnly yes
```

Then clone or set remote using:
```bash
git clone git@github-oaa:oaa-dev/laravel-react-project.git
# or for existing repo:
git remote set-url origin git@github-oaa:oaa-dev/laravel-react-project.git
```

## Architecture

### Backend (Laravel)

```
Request Flow:
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Route     │ -> │ Controller  │ -> │   Service   │ -> │ Repository  │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
                          │                  │                   │
                          ▼                  ▼                   ▼
                   ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
                   │ FormRequest │    │     DTO     │    │    Model    │
                   │ (validation)│    │ (data xfer) │    │  (Eloquent) │
                   └─────────────┘    └─────────────┘    └─────────────┘
                          │
                          ▼
                   ┌─────────────┐
                   │  Resource   │ -> JSON Response
                   │ (transform) │
                   └─────────────┘
```

### Frontend (Next.js)

```
Component Architecture:
┌─────────────────────────────────────────────────────┐
│                    App Router                        │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  │
│  │  (public)   │  │  (vendor)   │  │   (admin)   │  │
│  │   routes    │  │   routes    │  │   routes    │  │
│  └─────────────┘  └─────────────┘  └─────────────┘  │
└─────────────────────────────────────────────────────┘
                          │
         ┌────────────────┼────────────────┐
         ▼                ▼                ▼
┌─────────────┐   ┌─────────────┐   ┌─────────────┐
│    Pages    │   │ Components  │   │    Hooks    │
└─────────────┘   └─────────────┘   └─────────────┘
         │                │                │
         └────────────────┼────────────────┘
                          ▼
              ┌─────────────────────┐
              │      Services       │ -> API calls
              │   (React Query)     │
              └─────────────────────┘
                          │
              ┌─────────────────────┐
              │       Stores        │ -> UI state
              │      (Zustand)      │
              └─────────────────────┘
```
