<?php

use Illuminate\Support\Facades\Route;

// The SPA (frontend/, built in a later phase) is served for any non-API,
// non-Sanctum, non-health, non-storage path. Laravel itself no longer
// renders any Blade views — see sdd/scheduling-core design-addendum-api-spa.
Route::get('/{any?}', function () {
    return response()->file(public_path('app/index.html'));
})->where('any', '^(?!api|sanctum|up|storage).*$');
