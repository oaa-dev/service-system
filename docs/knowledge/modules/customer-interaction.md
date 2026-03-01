# CustomerInteraction Module

## Model
- **Path**: app/Models/CustomerInteraction.php
- **Table**: customer_interactions
- **Fillable**: customer_id, type, description, logged_by
- **Casts**: (none)
- **Relationships**:
  - customer() -> BelongsTo -> Customer
  - loggedByUser() -> BelongsTo -> User (FK: logged_by)
- **Traits**: HasFactory
- **Scopes**: (none)

### Enum Values
| Field | Values |
|-------|--------|
| type | note, call, complaint, inquiry |

## Connected Files
| Category | File | Notes |
|----------|------|-------|
| Controller | app/Http/Controllers/Api/V1/CustomerController.php | interactions(), storeInteraction(), destroyInteraction() methods |
| Service | app/Services/CustomerService.php | Uses Spatie QueryBuilder scoped to customer_id; creates via CustomerInteraction::create(); deletes with customer_id scope check |
| Service Interface | app/Services/Contracts/CustomerServiceInterface.php | getCustomerInteractions(), createCustomerInteraction(), deleteCustomerInteraction() |
| DTO | app/Data/CustomerInteractionData.php | type and description fields (both Optional) |
| FormRequest | app/Http/Requests/Api/V1/Customer/StoreCustomerInteractionRequest.php | type (required, enum) + description (required) |
| Resource | app/Http/Resources/Api/V1/CustomerInteractionResource.php | id, type, description, logged_by (whenLoaded loggedByUser: id + name), timestamps |

### Notes
- No dedicated controller -- endpoints managed through CustomerController under `customers/{customer}/interactions` nested routes
- `logged_by` is automatically set to `auth()->id()` by the service layer -- not passed in request payloads
- `logged_by` is nullable with nullOnDelete in DB (user can be deleted without losing interaction history)
- CustomerService loads the last 10 interactions (ordered by latest) when fetching a customer via `getCustomerById()`

## Routes
| Method | URI | Action |
|--------|-----|--------|
| GET | api/v1/customers/{customer}/interactions | CustomerController@interactions (permission:customers.view) |
| POST | api/v1/customers/{customer}/interactions | CustomerController@storeInteraction (permission:customers.update) |
| DELETE | api/v1/customers/{customer}/interactions/{interaction} | CustomerController@destroyInteraction (permission:customers.update) |

## Database
| Type | File |
|------|------|
| Migration | database/migrations/2026_02_10_200004_create_customer_interactions_table.php |
| Factory | database/factories/CustomerInteractionFactory.php |
| Seeder | (none) |

### Query Filters (CustomerService::getCustomerInteractions)
| Filter | Type | Description |
|--------|------|-------------|
| filter[type] | exact | note, call, complaint, inquiry |
| sort | allowed | id, type, created_at (default: -created_at) |

## Tests
| Type | File |
|------|------|
| Feature (via CustomerControllerTest) | tests/Feature/Api/V1/CustomerControllerTest.php |

### Test Coverage (within "Customer Interactions" describe block)
- Can list interactions for a customer (paginated with correct structure)
- Can create an interaction (logged_by auto-set from authenticated user)
- Validates required fields (type, description)
- Validates type enum (rejects invalid values with 422)
- Can delete an interaction (hard delete confirmed in DB)
- Returns 422 when deleting a non-existent interaction (customer_id scope check)
- Interactions count appears in customer show response (interactions_count field)
