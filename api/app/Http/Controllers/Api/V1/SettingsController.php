<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\UpdateSettingsRequest;
use App\Http\Resources\V1\SettingResource;
use App\Models\Setting;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class SettingsController extends Controller
{
    /**
     * List every application setting.
     */
    public function index(): AnonymousResourceCollection
    {
        return SettingResource::collection(
            Setting::query()->orderBy('key')->get()
        );
    }

    /**
     * Patch one or more settings by key.
     */
    public function update(UpdateSettingsRequest $request): AnonymousResourceCollection
    {
        foreach ($request->validated('settings') as $key => $value) {
            Setting::updateOrCreate(['key' => $key], ['value' => (string) $value]);
        }

        return SettingResource::collection(
            Setting::query()->orderBy('key')->get()
        );
    }
}
