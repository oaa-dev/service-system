---
title: "enforceMorphMap breaks all existing polymorphic relationships when adding a new morphable model"
date: 2026-02-28
module: Chat (Conversation model)
problem_type: runtime_error
component: eloquent_model
root_cause: config_error
severity: critical
resolution_type: code_fix
tags: [morph-map, polymorphic, eloquent, conversation, media-library]
---

## Symptom

When adding a new polymorphic model (e.g., `Conversation` with a `conversable` morph) and registering it with `Relation::enforceMorphMap([...])` in a service provider, all existing polymorphic relationships in the project that are NOT in the map start throwing runtime errors:

```
Call to undefined method Illuminate\Database\Eloquent\Relations\MorphTo::find()
// or
BadMethodCallException: Morph map not configured for [App\Models\SomeOtherModel]
```

This silently breaks existing models using Spatie Media Library (which uses `media` morphMany), `HasAddress` (polymorphic address), or any other pre-existing morph.

## Investigation

Initially used `Relation::enforceMorphMap()` thinking it was the correct Laravel way to register morph aliases. This method requires **every** polymorphic relationship in the entire project to be registered — both the new ones and all pre-existing ones (Media, Address, etc.). Since `enforceMorphMap` throws on any unregistered morph class, the first model lookup via an unregistered morph fails catastrophically.

## Root Cause

`Relation::enforceMorphMap()` enables **strict mode** — Laravel will throw an exception for any morph relationship that uses a class name not explicitly registered in the map. This is fine for greenfield projects where you register everything, but it breaks existing projects that rely on the default class-name-based morphing for pre-existing models.

`Relation::morphMap()` registers aliases **without** enforcing that all morphs are registered. Unregistered morphs continue to use their fully-qualified class names as the morph type string.

## Solution

Replace `enforceMorphMap()` with `morphMap()` in `AppServiceProvider` (or wherever the map is registered):

```php
// WRONG — breaks all unregistered morphs project-wide
Relation::enforceMorphMap([
    'booking'      => \App\Models\Booking::class,
    'reservation'  => \App\Models\Reservation::class,
    'service_order' => \App\Models\ServiceOrder::class,
]);

// CORRECT — registers aliases without enforcement
Relation::morphMap([
    'booking'      => \App\Models\Booking::class,
    'reservation'  => \App\Models\Reservation::class,
    'service_order' => \App\Models\ServiceOrder::class,
]);
```

## Prevention

**Rule:** In an existing project with Spatie Media Library, HasAddress, or any unregistered polymorphic relations, **always use `Relation::morphMap()`**, never `enforceMorphMap()`.

Only use `enforceMorphMap()` in new projects where you are registering every single polymorphic model from the start and want strict enforcement to catch mistakes.

When adding a new polymorphic model to an existing project:
1. Register it in `morphMap()` in `AppServiceProvider::boot()`
2. Use the alias string as the `conversable_type` column value in migrations/seeders
3. Never switch to `enforceMorphMap()` unless you audit and register every morph in the project
