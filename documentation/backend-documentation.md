# Backend Documentation

This document provides setup instructions and guidelines for the Laravel API backend application.

## Project Setup

### 1. Create Laravel Application

```bash
composer create-project laravel/laravel laravel-template-api
cd laravel-template-api
```

### 2. Install Required Packages

#### Laravel Passport (OAuth2 Authentication)

```bash
composer require laravel/passport
php artisan passport:install
```

#### Spatie Media Library (File Management)

```bash
composer require spatie/laravel-medialibrary
php artisan vendor:publish --provider="Spatie\MediaLibrary\MediaLibraryServiceProvider" --tag="medialibrary-migrations"
php artisan migrate
```

#### Spatie Query Builder (API Filtering/Sorting)

```bash
composer require spatie/laravel-query-builder
```

#### L5-Swagger (API Documentation)

```bash
composer require darkaonline/l5-swagger
php artisan vendor:publish --provider="L5Swagger\L5SwaggerServiceProvider"
```

### 3. Install Development Packages

```bash
composer require --dev pestphp/pest
composer require --dev laravel/pint
composer require --dev laravel/pail
composer require --dev laravel/sail
```

Initialize Pest:

```bash
php artisan pest:install
```

## Complete Installation Script

```bash
# Create Laravel project
composer create-project laravel/laravel laravel-template-api
cd laravel-template-api

# Install production packages
composer require laravel/passport
composer require spatie/laravel-medialibrary
composer require spatie/laravel-query-builder
composer require darkaonline/l5-swagger

# Install dev packages
composer require --dev pestphp/pest laravel/pint laravel/pail laravel/sail

# Publish configurations
php artisan vendor:publish --provider="Spatie\MediaLibrary\MediaLibraryServiceProvider" --tag="medialibrary-migrations"
php artisan vendor:publish --provider="L5Swagger\L5SwaggerServiceProvider"

# Install Passport
php artisan passport:install

# Run migrations
php artisan migrate
```

## Development Commands

### Using Laravel Sail (Docker)

```bash
sail up -d              # Start all Docker containers in background
sail down               # Stop all containers
sail artisan migrate    # Run database migrations
sail artisan db:seed    # Seed the database
sail artisan test       # Run Pest tests
sail composer install   # Install PHP dependencies
sail npm install        # Install Node dependencies
sail npm run build      # Build frontend assets
```

### Without Docker

```bash
composer setup          # First-time setup (install, env, key, migrate, npm)
composer dev            # Run all services concurrently
composer test           # Run Pest tests
./vendor/bin/pint       # Code formatting
```

### What `composer dev` Runs

Starts four concurrent processes:
- `php artisan serve` - PHP development server
- `php artisan queue:listen` - Queue worker
- `php artisan pail` - Real-time log viewer
- `npm run dev` - Vite asset compilation

## Running the Application

1. **Start the API with Sail:**
   ```bash
   cd laravel-template-api
   sail up -d
   ```

2. **Run migrations (first time):**
   ```bash
   sail artisan migrate
   sail artisan passport:install
   ```

3. **API is available at:** http://localhost:8080/api/v1

## Project Structure

```
laravel-template-api/
├── app/
│   ├── Exceptions/
│   │   └── ApiException.php
│   ├── Http/
│   │   ├── Controllers/
│   │   │   └── Api/V1/
│   │   │       ├── AuthController.php
│   │   │       ├── ProfileController.php
│   │   │       └── UserController.php
│   │   ├── Requests/
│   │   │   └── Api/V1/
│   │   │       ├── Auth/
│   │   │       ├── Profile/
│   │   │       └── User/
│   │   └── Resources/
│   │       └── Api/V1/
│   │           ├── AddressResource.php
│   │           ├── ProfileResource.php
│   │           └── UserResource.php
│   ├── Models/
│   │   ├── Address.php
│   │   ├── User.php
│   │   └── UserProfile.php
│   ├── Repositories/
│   │   ├── Contracts/
│   │   ├── BaseRepository.php
│   │   ├── ProfileRepository.php
│   │   └── UserRepository.php
│   ├── Services/
│   │   ├── Contracts/
│   │   ├── ProfileService.php
│   │   └── UserService.php
│   └── Traits/
│       ├── ApiResponse.php
│       └── HasAddress.php
├── config/
├── database/
│   ├── factories/
│   ├── migrations/
│   └── seeders/
├── routes/
│   └── api.php
├── tests/
│   ├── Feature/Api/V1/
│   └── Unit/
├── composer.json
└── phpunit.xml
```

## Architecture

### Service-Repository Pattern

```
Request → Controller → Service → Repository → Model → Database
                ↓
           Resource (JSON transformation)
                ↓
           ApiResponse trait (standardized response)
```

### Layer Responsibilities

| Layer | Responsibility |
|-------|----------------|
| Controller | Handle HTTP requests, validate input, return responses |
| Service | Business logic, orchestration |
| Repository | Data access, database queries |
| Model | Eloquent ORM, relationships |
| Resource | Transform models to JSON |
| Request | Form validation rules |

### Creating New Feature

1. **Create Migration**
   ```bash
   php artisan make:migration create_posts_table
   ```

2. **Create Model**
   ```bash
   php artisan make:model Post
   ```

3. **Create Repository**
   ```php
   // app/Repositories/Contracts/PostRepositoryInterface.php
   // app/Repositories/PostRepository.php
   ```

4. **Create Service**
   ```php
   // app/Services/Contracts/PostServiceInterface.php
   // app/Services/PostService.php
   ```

5. **Register in Service Provider**
   ```php
   // app/Providers/RepositoryServiceProvider.php
   $this->app->bind(PostRepositoryInterface::class, PostRepository::class);
   $this->app->bind(PostServiceInterface::class, PostService::class);
   ```

6. **Create Controller**
   ```bash
   php artisan make:controller Api/V1/PostController
   ```

7. **Create Request Validators**
   ```bash
   php artisan make:request Api/V1/Post/StorePostRequest
   php artisan make:request Api/V1/Post/UpdatePostRequest
   ```

8. **Create Resource**
   ```bash
   php artisan make:resource Api/V1/PostResource
   ```

9. **Add Routes**
   ```php
   // routes/api.php
   Route::apiResource('posts', PostController::class);
   ```

## API Response Format

### Success Response

```php
return $this->successResponse($data, 'Message', 200);
```

```json
{
  "success": true,
  "message": "Message",
  "data": { ... }
}
```

### Created Response

```php
return $this->createdResponse($data, 'Created successfully');
```

### Paginated Response

```php
return $this->paginatedResponse($paginator, UserResource::class);
```

```json
{
  "success": true,
  "message": "Success",
  "data": [ ... ],
  "meta": {
    "current_page": 1,
    "last_page": 10,
    "per_page": 15,
    "total": 150,
    "from": 1,
    "to": 15
  },
  "links": {
    "first": "...",
    "last": "...",
    "prev": null,
    "next": "..."
  }
}
```

### Error Response

```php
return $this->errorResponse('Error message', 400);
return $this->notFoundResponse('Resource not found');
return $this->unauthorizedResponse('Unauthorized');
return $this->forbiddenResponse('Forbidden');
return $this->validationErrorResponse($errors, 'Validation failed');
```

## Authentication

### Passport Setup

1. Install Passport:
   ```bash
   php artisan passport:install
   ```

2. Add `HasApiTokens` to User model:
   ```php
   use Laravel\Passport\HasApiTokens;

   class User extends Authenticatable
   {
       use HasApiTokens, HasFactory, Notifiable;
   }
   ```

3. Configure auth guard in `config/auth.php`:
   ```php
   'guards' => [
       'api' => [
           'driver' => 'passport',
           'provider' => 'users',
       ],
   ],
   ```

### Protecting Routes

```php
Route::middleware('auth:api')->group(function () {
    // Protected routes
});
```

### Creating Token

```php
$token = $user->createToken('auth_token')->accessToken;
```

### Revoking Token

```php
$request->user()->token()->revoke();
```

## Testing

### Running Tests

```bash
composer test                                    # Run all tests
php artisan test                                 # Run all tests
php artisan test --filter=AuthControllerTest    # Run specific test class
php artisan test --filter=test_user_can_login   # Run specific test method
php artisan test tests/Feature/Api/V1/          # Run tests in directory
```

### Test Structure

```php
// tests/Feature/Api/V1/AuthControllerTest.php
use Tests\TestCase;
use App\Models\User;

it('can register a new user', function () {
    $response = $this->postJson('/api/v1/auth/register', [
        'name' => 'Test User',
        'email' => 'test@example.com',
        'password' => 'password123',
        'password_confirmation' => 'password123',
    ]);

    $response->assertStatus(201)
        ->assertJsonStructure([
            'success',
            'message',
            'data' => ['user', 'access_token', 'token_type']
        ]);
});

it('can login with valid credentials', function () {
    $user = User::factory()->create([
        'password' => bcrypt('password123')
    ]);

    $response = $this->postJson('/api/v1/auth/login', [
        'email' => $user->email,
        'password' => 'password123',
    ]);

    $response->assertStatus(200)
        ->assertJsonPath('success', true);
});
```

## API Documentation (Swagger)

### Generate Documentation

```bash
php artisan l5-swagger:generate
```

### Access Documentation

```
GET /api/documentation
```

### Adding OpenAPI Annotations

```php
use OpenApi\Attributes as OA;

#[OA\Post(
    path: '/auth/login',
    summary: 'Login user',
    tags: ['Auth'],
    requestBody: new OA\RequestBody(
        required: true,
        content: new OA\JsonContent(
            required: ['email', 'password'],
            properties: [
                new OA\Property(property: 'email', type: 'string'),
                new OA\Property(property: 'password', type: 'string'),
            ]
        )
    ),
    responses: [
        new OA\Response(response: 200, description: 'Success'),
        new OA\Response(response: 401, description: 'Unauthorized'),
    ]
)]
public function login(LoginRequest $request): JsonResponse
{
    // ...
}
```

## Code Quality

### Laravel Pint (Code Formatting)

```bash
./vendor/bin/pint                    # Format all files
./vendor/bin/pint --test             # Check without fixing
./vendor/bin/pint app/Models         # Format specific directory
./vendor/bin/pint app/Models/User.php # Format specific file
```

## Database

### Migrations

```bash
php artisan make:migration create_posts_table
php artisan migrate
php artisan migrate:rollback
php artisan migrate:fresh           # Drop all tables and re-migrate
php artisan migrate:fresh --seed    # With seeders
```

### Factories

```bash
php artisan make:factory PostFactory
```

```php
// database/factories/PostFactory.php
class PostFactory extends Factory
{
    public function definition(): array
    {
        return [
            'title' => fake()->sentence(),
            'content' => fake()->paragraphs(3, true),
            'user_id' => User::factory(),
        ];
    }
}
```

### Seeders

```bash
php artisan make:seeder PostSeeder
php artisan db:seed
php artisan db:seed --class=PostSeeder
```

## Docker

### Services (docker-compose.yml)

| Service | Port | Description |
|---------|------|-------------|
| laravel-app | - | PHP 8.3 FPM |
| laravel-web | 8080 | Nginx |
| mysql | 3307 | MySQL Database |
| redis | 6379 | Redis Cache |
| rabbitmq | 5672, 15672 | Message Queue |
| phpmyadmin | 8081 | Database GUI |
| mailpit | 1025, 8025 | Email Testing |

### Running with Docker

```bash
docker-compose up -d
docker-compose exec laravel-app php artisan migrate
```

## Environment Variables

Key variables in `.env`:

```env
APP_NAME=Laravel
APP_ENV=local
APP_DEBUG=true
APP_URL=http://localhost

DB_CONNECTION=mysql
DB_HOST=mysql
DB_PORT=3306
DB_DATABASE=laravel
DB_USERNAME=laravel
DB_PASSWORD=secret

CACHE_STORE=database
QUEUE_CONNECTION=database
SESSION_DRIVER=database

REDIS_HOST=redis
REDIS_PORT=6379
```

## Additional Resources

- [Laravel Documentation](https://laravel.com/docs)
- [Laravel Passport](https://laravel.com/docs/passport)
- [Spatie Media Library](https://spatie.be/docs/laravel-medialibrary)
- [Spatie Query Builder](https://spatie.be/docs/laravel-query-builder)
- [L5-Swagger](https://github.com/DarkaOnLine/L5-Swagger)
- [Pest PHP](https://pestphp.com/docs)
- [Laravel Pint](https://laravel.com/docs/pint)
