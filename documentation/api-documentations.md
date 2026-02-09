# API Documentation

This document provides comprehensive documentation for all API endpoints in the Laravel Template API.

**Base URL:** `/api/v1`

**Authentication:** OAuth2 Bearer Token via Laravel Passport

**Content-Type:** `application/json` (except file uploads which use `multipart/form-data`)

---

## Table of Contents

1. [Standard Response Format](#standard-response-format)
2. [Authentication Endpoints](#authentication-endpoints)
   - [Register](#register)
   - [Login](#login)
   - [Logout](#logout)
   - [Get Current User](#get-current-user)
   - [Update Current User](#update-current-user)
3. [User Management Endpoints](#user-management-endpoints)
   - [List Users](#list-users)
   - [Create User](#create-user)
   - [Get User](#get-user)
   - [Update User](#update-user)
   - [Delete User](#delete-user)
4. [Profile Endpoints](#profile-endpoints)
   - [Get Profile](#get-profile)
   - [Update Profile](#update-profile)
   - [Upload Avatar](#upload-avatar)
   - [Delete Avatar](#delete-avatar)
5. [Data Models](#data-models)

---

## Standard Response Format

### Success Response

```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... }
}
```

### Paginated Response

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
    "first": "http://localhost/api/v1/users?page=1",
    "last": "http://localhost/api/v1/users?page=10",
    "prev": null,
    "next": "http://localhost/api/v1/users?page=2"
  }
}
```

### Error Response

```json
{
  "success": false,
  "message": "Error message"
}
```

### Validation Error Response (422)

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": {
    "field_name": ["Error message for this field"]
  }
}
```

---

## Authentication Endpoints

### Register

Create a new user account and receive an access token.

**Endpoint:** `POST /auth/register`

**Authentication:** None (Public)

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| name | string | Yes | User's full name (max: 255 characters) |
| email | string | Yes | User's email address (unique, max: 255 characters) |
| password | string | Yes | Password (min: 8 characters) |
| password_confirmation | string | Yes | Must match password |

**Example Request:**

```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "password_confirmation": "password123"
}
```

**Success Response (201):**

```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": 1,
      "name": "John Doe",
      "email": "john@example.com",
      "email_verified_at": null,
      "profile": {
        "id": 1,
        "bio": null,
        "phone": null,
        "address": null,
        "avatar": null,
        "date_of_birth": null,
        "gender": null,
        "created_at": "2024-01-15T10:30:00.000000Z",
        "updated_at": "2024-01-15T10:30:00.000000Z"
      },
      "created_at": "2024-01-15T10:30:00.000000Z",
      "updated_at": "2024-01-15T10:30:00.000000Z"
    },
    "access_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9...",
    "token_type": "Bearer"
  }
}
```

**Error Responses:**
- `422` - Validation error

---

### Login

Authenticate a user and receive an access token.

**Endpoint:** `POST /auth/login`

**Authentication:** None (Public)

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| email | string | Yes | User's email address |
| password | string | Yes | User's password |

**Example Request:**

```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Success Response (200):**

```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": 1,
      "name": "John Doe",
      "email": "john@example.com",
      "email_verified_at": null,
      "avatar": {
        "original": "http://localhost/storage/avatars/original.jpg",
        "thumb": "http://localhost/storage/avatars/thumb.jpg",
        "preview": "http://localhost/storage/avatars/preview.jpg"
      },
      "profile": { ... },
      "created_at": "2024-01-15T10:30:00.000000Z",
      "updated_at": "2024-01-15T10:30:00.000000Z"
    },
    "access_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9...",
    "token_type": "Bearer"
  }
}
```

**Error Responses:**
- `401` - Invalid credentials
- `422` - Validation error

---

### Logout

Revoke the current access token.

**Endpoint:** `POST /auth/logout`

**Authentication:** Required (Bearer Token)

**Headers:**

```
Authorization: Bearer {access_token}
```

**Success Response (200):**

```json
{
  "success": true,
  "message": "Logged out successfully",
  "data": null
}
```

**Error Responses:**
- `401` - Unauthenticated

---

### Get Current User

Retrieve the authenticated user's information.

**Endpoint:** `GET /auth/me`

**Authentication:** Required (Bearer Token)

**Headers:**

```
Authorization: Bearer {access_token}
```

**Success Response (200):**

```json
{
  "success": true,
  "message": "User profile retrieved successfully",
  "data": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "email_verified_at": null,
    "avatar": {
      "original": "http://localhost/storage/avatars/original.jpg",
      "thumb": "http://localhost/storage/avatars/thumb.jpg",
      "preview": "http://localhost/storage/avatars/preview.jpg"
    },
    "profile": {
      "id": 1,
      "bio": "Software developer",
      "phone": "+1234567890",
      "address": {
        "street": "123 Main St",
        "city": "New York",
        "state": "NY",
        "postal_code": "10001",
        "country": "USA"
      },
      "date_of_birth": "1990-01-15",
      "gender": "male",
      "created_at": "2024-01-15T10:30:00.000000Z",
      "updated_at": "2024-01-15T10:30:00.000000Z"
    },
    "created_at": "2024-01-15T10:30:00.000000Z",
    "updated_at": "2024-01-15T10:30:00.000000Z"
  }
}
```

**Error Responses:**
- `401` - Unauthenticated

---

### Update Current User

Update the authenticated user's account information.

**Endpoint:** `PUT /auth/me`

**Authentication:** Required (Bearer Token)

**Headers:**

```
Authorization: Bearer {access_token}
Content-Type: application/json
```

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| name | string | No | User's full name (max: 255 characters) |
| email | string | No | User's email address (unique, max: 255 characters) |
| password | string | No | New password (min: 8 characters) |
| password_confirmation | string | No | Required if password is provided |

**Example Request:**

```json
{
  "name": "John Smith",
  "email": "johnsmith@example.com"
}
```

**Success Response (200):**

```json
{
  "success": true,
  "message": "Profile updated successfully",
  "data": {
    "id": 1,
    "name": "John Smith",
    "email": "johnsmith@example.com",
    ...
  }
}
```

**Error Responses:**
- `401` - Unauthenticated
- `422` - Validation error

---

## User Management Endpoints

> All user management endpoints require authentication.

### List Users

Get a paginated list of users with optional filtering and sorting.

**Endpoint:** `GET /users`

**Authentication:** Required (Bearer Token)

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| filter[name] | string | - | Filter by name (partial match) |
| filter[email] | string | - | Filter by email (partial match) |
| filter[created_from] | date | - | Filter by created date from (YYYY-MM-DD) |
| filter[created_to] | date | - | Filter by created date to (YYYY-MM-DD) |
| sort | string | - | Sort field. Prefix with `-` for descending. Options: `id`, `name`, `email`, `created_at`, `-id`, `-name`, `-email`, `-created_at` |
| per_page | integer | 15 | Items per page |
| page | integer | 1 | Page number |

**Example Request:**

```
GET /api/v1/users?filter[name]=john&sort=-created_at&per_page=10&page=1
```

**Success Response (200):**

```json
{
  "success": true,
  "message": "Success",
  "data": [
    {
      "id": 1,
      "name": "John Doe",
      "email": "john@example.com",
      "email_verified_at": null,
      "created_at": "2024-01-15T10:30:00.000000Z",
      "updated_at": "2024-01-15T10:30:00.000000Z"
    }
  ],
  "meta": {
    "current_page": 1,
    "last_page": 5,
    "per_page": 10,
    "total": 50,
    "from": 1,
    "to": 10
  },
  "links": {
    "first": "http://localhost/api/v1/users?page=1",
    "last": "http://localhost/api/v1/users?page=5",
    "prev": null,
    "next": "http://localhost/api/v1/users?page=2"
  }
}
```

**Error Responses:**
- `401` - Unauthenticated

---

### Create User

Create a new user account (admin functionality).

**Endpoint:** `POST /users`

**Authentication:** Required (Bearer Token)

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| name | string | Yes | User's full name (max: 255 characters) |
| email | string | Yes | User's email address (unique, max: 255 characters) |
| password | string | Yes | Password (min: 8 characters) |

**Example Request:**

```json
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "password": "securepass123"
}
```

**Success Response (201):**

```json
{
  "success": true,
  "message": "User created successfully",
  "data": {
    "id": 2,
    "name": "Jane Doe",
    "email": "jane@example.com",
    "email_verified_at": null,
    "created_at": "2024-01-15T11:00:00.000000Z",
    "updated_at": "2024-01-15T11:00:00.000000Z"
  }
}
```

**Error Responses:**
- `401` - Unauthenticated
- `422` - Validation error

---

### Get User

Retrieve a specific user by ID.

**Endpoint:** `GET /users/{id}`

**Authentication:** Required (Bearer Token)

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | integer | Yes | User ID |

**Success Response (200):**

```json
{
  "success": true,
  "message": "User retrieved successfully",
  "data": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "email_verified_at": null,
    "created_at": "2024-01-15T10:30:00.000000Z",
    "updated_at": "2024-01-15T10:30:00.000000Z"
  }
}
```

**Error Responses:**
- `401` - Unauthenticated
- `404` - User not found

---

### Update User

Update an existing user.

**Endpoint:** `PUT /users/{id}`

**Authentication:** Required (Bearer Token)

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | integer | Yes | User ID |

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| name | string | No | User's full name (max: 255 characters) |
| email | string | No | User's email address (unique, max: 255 characters) |
| password | string | No | New password (min: 8 characters) |

**Example Request:**

```json
{
  "name": "John Updated",
  "email": "john.updated@example.com"
}
```

**Success Response (200):**

```json
{
  "success": true,
  "message": "User updated successfully",
  "data": {
    "id": 1,
    "name": "John Updated",
    "email": "john.updated@example.com",
    "email_verified_at": null,
    "created_at": "2024-01-15T10:30:00.000000Z",
    "updated_at": "2024-01-15T12:00:00.000000Z"
  }
}
```

**Error Responses:**
- `401` - Unauthenticated
- `404` - User not found
- `422` - Validation error

---

### Delete User

Delete a user by ID.

**Endpoint:** `DELETE /users/{id}`

**Authentication:** Required (Bearer Token)

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | integer | Yes | User ID |

**Success Response (200):**

```json
{
  "success": true,
  "message": "User deleted successfully",
  "data": null
}
```

**Error Responses:**
- `401` - Unauthenticated
- `404` - User not found

---

## Profile Endpoints

> All profile endpoints require authentication and operate on the currently authenticated user's profile.

### Get Profile

Retrieve the current user's profile.

**Endpoint:** `GET /profile`

**Authentication:** Required (Bearer Token)

**Success Response (200):**

```json
{
  "success": true,
  "message": "Profile retrieved successfully",
  "data": {
    "id": 1,
    "bio": "Software developer with 10 years of experience",
    "phone": "+1234567890",
    "address": {
      "street": "123 Main Street",
      "city": "New York",
      "state": "NY",
      "postal_code": "10001",
      "country": "USA"
    },
    "avatar": {
      "original": "http://localhost/storage/avatars/1/original.jpg",
      "thumb": "http://localhost/storage/avatars/1/thumb.jpg",
      "preview": "http://localhost/storage/avatars/1/preview.jpg"
    },
    "date_of_birth": "1990-01-15",
    "gender": "male",
    "created_at": "2024-01-15T10:30:00.000000Z",
    "updated_at": "2024-01-15T10:30:00.000000Z"
  }
}
```

**Error Responses:**
- `401` - Unauthenticated

---

### Update Profile

Update the current user's profile information.

**Endpoint:** `PUT /profile`

**Authentication:** Required (Bearer Token)

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| bio | string | No | User's biography (max: 1000 characters, nullable) |
| phone | string | No | Phone number (max: 20 characters, nullable) |
| date_of_birth | date | No | Date of birth (YYYY-MM-DD format, must be before today, nullable) |
| gender | string | No | Gender (options: `male`, `female`, `other`, nullable) |
| address | object | No | Address object (nullable) |
| address.street | string | No | Street address (max: 255 characters) |
| address.city | string | No | City (max: 100 characters) |
| address.state | string | No | State/Province (max: 100 characters) |
| address.postal_code | string | No | Postal/ZIP code (max: 20 characters) |
| address.country | string | No | Country (max: 100 characters) |

**Example Request:**

```json
{
  "bio": "Full-stack developer passionate about clean code",
  "phone": "+1987654321",
  "date_of_birth": "1992-05-20",
  "gender": "female",
  "address": {
    "street": "456 Oak Avenue",
    "city": "San Francisco",
    "state": "CA",
    "postal_code": "94102",
    "country": "USA"
  }
}
```

**Success Response (200):**

```json
{
  "success": true,
  "message": "Profile updated successfully",
  "data": {
    "id": 1,
    "bio": "Full-stack developer passionate about clean code",
    "phone": "+1987654321",
    "address": {
      "street": "456 Oak Avenue",
      "city": "San Francisco",
      "state": "CA",
      "postal_code": "94102",
      "country": "USA"
    },
    "avatar": null,
    "date_of_birth": "1992-05-20",
    "gender": "female",
    "created_at": "2024-01-15T10:30:00.000000Z",
    "updated_at": "2024-01-15T14:00:00.000000Z"
  }
}
```

**Error Responses:**
- `401` - Unauthenticated
- `422` - Validation error

---

### Upload Avatar

Upload or replace the user's profile avatar image.

**Endpoint:** `POST /profile/avatar`

**Authentication:** Required (Bearer Token)

**Content-Type:** `multipart/form-data`

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| avatar | file | Yes | Image file (JPEG, PNG, or WebP) |

**File Requirements:**
- **Formats:** JPEG, PNG, WebP
- **Max Size:** 5MB (5120 KB)
- **Min Dimensions:** 100x100 pixels
- **Max Dimensions:** 4000x4000 pixels

**Example Request (cURL):**

```bash
curl -X POST http://localhost/api/v1/profile/avatar \
  -H "Authorization: Bearer {access_token}" \
  -F "avatar=@/path/to/image.jpg"
```

**Success Response (200):**

```json
{
  "success": true,
  "message": "Avatar uploaded successfully",
  "data": {
    "id": 1,
    "bio": "Software developer",
    "phone": "+1234567890",
    "address": null,
    "avatar": {
      "original": "http://localhost/storage/avatars/1/original.jpg",
      "thumb": "http://localhost/storage/avatars/1/thumb.jpg",
      "preview": "http://localhost/storage/avatars/1/preview.jpg"
    },
    "date_of_birth": "1990-01-15",
    "gender": "male",
    "created_at": "2024-01-15T10:30:00.000000Z",
    "updated_at": "2024-01-15T15:00:00.000000Z"
  }
}
```

**Error Responses:**
- `401` - Unauthenticated
- `422` - Validation error (invalid file type, size, or dimensions)

---

### Delete Avatar

Remove the user's profile avatar.

**Endpoint:** `DELETE /profile/avatar`

**Authentication:** Required (Bearer Token)

**Success Response (200):**

```json
{
  "success": true,
  "message": "Avatar deleted successfully",
  "data": {
    "id": 1,
    "bio": "Software developer",
    "phone": "+1234567890",
    "address": null,
    "avatar": null,
    "date_of_birth": "1990-01-15",
    "gender": "male",
    "created_at": "2024-01-15T10:30:00.000000Z",
    "updated_at": "2024-01-15T16:00:00.000000Z"
  }
}
```

**Error Responses:**
- `401` - Unauthenticated

---

## Data Models

### User Object

| Field | Type | Description |
|-------|------|-------------|
| id | integer | Unique identifier |
| name | string | User's full name |
| email | string | User's email address |
| email_verified_at | string\|null | ISO 8601 timestamp when email was verified |
| avatar | object\|null | Avatar URLs (when profile is loaded and avatar exists) |
| avatar.original | string | Original avatar URL |
| avatar.thumb | string | Thumbnail avatar URL |
| avatar.preview | string | Preview avatar URL |
| profile | object\|null | User's profile (when loaded) |
| created_at | string | ISO 8601 creation timestamp |
| updated_at | string | ISO 8601 last update timestamp |

### Profile Object

| Field | Type | Description |
|-------|------|-------------|
| id | integer | Unique identifier |
| bio | string\|null | User's biography |
| phone | string\|null | Phone number |
| address | object\|null | Address information |
| avatar | object\|null | Avatar URLs (when avatar exists) |
| avatar.original | string | Original avatar URL |
| avatar.thumb | string | Thumbnail avatar URL |
| avatar.preview | string | Preview avatar URL |
| date_of_birth | string\|null | Date of birth (YYYY-MM-DD format) |
| gender | string\|null | Gender (male, female, other) |
| created_at | string | ISO 8601 creation timestamp |
| updated_at | string | ISO 8601 last update timestamp |

### Address Object

| Field | Type | Description |
|-------|------|-------------|
| street | string\|null | Street address |
| city | string\|null | City name |
| state | string\|null | State or province |
| postal_code | string\|null | Postal or ZIP code |
| country | string\|null | Country name |

---

## HTTP Status Codes

| Code | Description |
|------|-------------|
| 200 | Success |
| 201 | Created successfully |
| 204 | No content |
| 400 | Bad request |
| 401 | Unauthenticated - Invalid or missing token |
| 403 | Forbidden - Insufficient permissions |
| 404 | Resource not found |
| 422 | Validation error |
| 500 | Internal server error |

---

## Interactive API Documentation

For interactive API documentation with a try-it-out feature, access the Swagger UI at:

```
GET /api/documentation
```

This provides an OpenAPI 3.0 specification with all endpoints, schemas, and the ability to test requests directly in the browser.
