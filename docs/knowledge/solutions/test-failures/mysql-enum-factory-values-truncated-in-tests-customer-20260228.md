---
title: "MySQL ENUM column silently rejects or truncates factory-generated string values in Pest tests"
date: 2026-02-28
module: Customer (preferred_payment_method column)
problem_type: test_failure
component: factory
root_cause: wrong_enum_value
severity: medium
resolution_type: test_fix
tags: [mysql-enum, factory, test, customer, payment-method]
---

## Symptom

Pest tests for endpoints that interact with a MySQL `ENUM` column fail with:
- Data truncation / integrity constraint violation errors
- Assertion failures because the column value stored is empty string or null instead of the expected value
- `SQLSTATE[01000]: Warning: 1265 Data truncated for column 'preferred_payment_method'`

The tests pass individually or in isolation but fail when factories generate values for ENUM columns.

## Investigation

The `customers` table has:
```php
$table->enum('preferred_payment_method', ['cash', 'e-wallet', 'card'])->nullable();
```

The `CustomerFactory` was generating arbitrary string values for `preferred_payment_method` (e.g., `'credit_card'`, `'paypal'`) that are NOT in the MySQL ENUM set. MySQL's strict mode treats this as a data truncation error, causing the test to fail.

The error was subtle — it looked like a general assertion failure, not obviously an ENUM issue.

## Root Cause

MySQL ENUM columns reject values outside the defined set. Unlike string columns, you cannot store arbitrary values. Laravel factories with `fake()->word()` or `fake()->randomElement([...])` will generate invalid values unless explicitly constrained to the ENUM set.

The `RefreshDatabase` trait uses transactions and re-seeds, so the ENUM constraint is enforced on every factory `create()` call.

## Solution

In Pest tests, use only valid ENUM values when creating customers or specifying `preferred_payment_method`:

```php
// WRONG — arbitrary value not in MySQL ENUM
$customer = Customer::factory()->create([
    'preferred_payment_method' => 'credit_card', // not in ['cash', 'e-wallet', 'card']
]);

// CORRECT — use a value from the ENUM set
$customer = Customer::factory()->create([
    'preferred_payment_method' => 'cash', // valid ENUM value
]);
```

Also update the factory to only generate valid ENUM values:

```php
// In CustomerFactory.php
'preferred_payment_method' => fake()->randomElement(['cash', 'e-wallet', 'card', null]),
```

## Prevention

**Rule:** When a database column uses a MySQL `ENUM`, always check the migration for the exact allowed values before writing test assertions or factory overrides. Use only values from the ENUM set.

Checklist when writing tests for ENUM columns:
1. Read the migration to find the exact ENUM values
2. Update the factory to use `fake()->randomElement([...valid values..., null])`
3. In tests, specify enum values explicitly rather than relying on the factory default

This applies to all ENUM columns in this project:
- `customers.preferred_payment_method`: `['cash', 'e-wallet', 'card']`
- `customers.identity_document_status`: `['none', 'pending', 'approved', 'rejected']`
- `merchants.status`: `['pending', 'approved', 'active', 'rejected', 'suspended']`
