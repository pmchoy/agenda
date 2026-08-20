<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\StoreServiceCategoryRequest;
use App\Http\Requests\Api\V1\UpdateServiceCategoryRequest;
use App\Http\Resources\V1\ServiceCategoryResource;
use App\Models\ServiceCategory;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;

class ServiceCategoryController extends Controller
{
    /**
     * List every service category.
     */
    public function index(): AnonymousResourceCollection
    {
        return ServiceCategoryResource::collection(
            ServiceCategory::query()->orderBy('sort_order')->get()
        );
    }

    /**
     * Create a new service category.
     */
    public function store(StoreServiceCategoryRequest $request): JsonResponse
    {
        $category = ServiceCategory::create($request->validated());

        return ServiceCategoryResource::make($category)
            ->response()
            ->setStatusCode(Response::HTTP_CREATED);
    }

    /**
     * Show a single service category.
     */
    public function show(ServiceCategory $service_category): ServiceCategoryResource
    {
        return ServiceCategoryResource::make($service_category);
    }

    /**
     * Update an existing service category.
     */
    public function update(UpdateServiceCategoryRequest $request, ServiceCategory $service_category): ServiceCategoryResource
    {
        $service_category->update($request->validated());

        return ServiceCategoryResource::make($service_category);
    }

    /**
     * Delete a service category.
     */
    public function destroy(ServiceCategory $service_category): Response
    {
        $service_category->delete();

        return response()->noContent();
    }
}
