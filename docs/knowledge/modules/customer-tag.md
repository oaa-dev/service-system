# CustomerTag Module

## Model
- **Path**: app/Models/CustomerTag.php
- **Table**: customer_tags
- **Fillable**: name, slug, color, description, is_active, sort_order
- **Casts**: is_active -> boolean, sort_order -> integer
- **Relationships**:
  - customers() -> BelongsToMany -> Customer (pivot: customer_customer_tag, withTimestamps)
- **Traits**: HasFactory
- **Scopes**: (none)
- **Boot hooks**:
  - `creating`: auto-generates slug from name if not provided (Str::slug)
  - `updating`: regenerates slug from name if name changes and slug is not also being changed

## Connected Files
| Category | File | Notes |
|----------|------|-------|
| Controller | app/Http/Controllers/Api/V1/CustomerTagController.php | Full CRUD + all() + active() endpoints |
| Service | app/Services/CustomerTagService.php | Spatie QueryBuilder on list; getActive() delegates to repository |
| Service Interface | app/Services/Contracts/CustomerTagServiceInterface.php | 7 method contract |
| Repository | app/Repositories/CustomerTagRepository.php | Extends BaseRepository; adds findBySlug(), getActive() |
| Repository Interface | app/Repositories/Contracts/CustomerTagRepositoryInterface.php | Extends BaseRepositoryInterface; adds findBySlug(), getActive() |
| DTO | app/Data/CustomerTagData.php | All fields Optional (name, slug, color, description, is_active, sort_order) |
| FormRequest | app/Http/Requests/Api/V1/CustomerTag/StoreCustomerTagRequest.php | name required + unique; color/description optional |
| FormRequest | app/Http/Requests/Api/V1/CustomerTag/UpdateCustomerTagRequest.php | name unique ignore current record |
| Resource | app/Http/Resources/Api/V1/CustomerTagResource.php | All fields including is_active, sort_order, timestamps |

## Routes
| Method | URI | Action |
|--------|-----|--------|
| GET | api/v1/customer-tags/active | CustomerTagController@active (public, no auth) |
| GET | api/v1/customer-tags/all | CustomerTagController@all (auth only) |
| GET | api/v1/customer-tags | CustomerTagController@index (permission:customer_tags.view) |
| GET | api/v1/customer-tags/{customerTag} | CustomerTagController@show (permission:customer_tags.view) |
| POST | api/v1/customer-tags | CustomerTagController@store (permission:customer_tags.create) |
| PUT | api/v1/customer-tags/{customerTag} | CustomerTagController@update (permission:customer_tags.update) |
| DELETE | api/v1/customer-tags/{customerTag} | CustomerTagController@destroy (permission:customer_tags.delete) |

## Database
| Type | File |
|------|------|
| Migration | database/migrations/2026_02_10_200001_create_customer_tags_table.php |
| Migration (pivot) | database/migrations/2026_02_10_200003_create_customer_customer_tag_table.php |
| Factory | database/factories/CustomerTagFactory.php |
| Seeder | database/seeders/RolePermissionSeeder.php (defines customer_tags.view/create/update/delete permissions) |

### Factory States
- `inactive()` -- sets is_active=false

### Pivot Table: customer_customer_tag
| Column | Type | Notes |
|--------|------|-------|
| customer_id | FK | cascadeOnDelete |
| customer_tag_id | FK | cascadeOnDelete |
| timestamps | | added via withTimestamps() |
| unique | | (customer_id, customer_tag_id) composite unique |

### Query Filters (CustomerTagService::getAllCustomerTags)
| Filter | Type | Description |
|--------|------|-------------|
| filter[name] | partial | Partial match on name |
| filter[is_active] | exact | true or false |
| filter[search] | callback | LIKE match on name |
| sort | allowed | id, name, sort_order, is_active, created_at (default: sort_order) |

## Tests
| Type | File |
|------|------|
| Feature (admin CRUD) | tests/Feature/Api/V1/CustomerTagControllerTest.php |
