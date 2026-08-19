<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\StoreProfessionalRequest;
use App\Http\Requests\Api\V1\UpdateProfessionalRequest;
use App\Http\Resources\V1\ProfessionalResource;
use App\Models\Professional;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;

class ProfessionalController extends Controller
{
    /**
     * List every professional.
     */
    public function index(): AnonymousResourceCollection
    {
        return ProfessionalResource::collection(
            Professional::query()->with('services')->orderBy('priority')->get()
        );
    }

    /**
     * Create a new professional and sync its qualified services.
     */
    public function store(StoreProfessionalRequest $request): JsonResponse
    {
        $data = $request->validated();
        $serviceIds = $data['service_ids'] ?? [];
        unset($data['service_ids']);

        $professional = Professional::create($data);
        $professional->services()->sync($serviceIds);

        return ProfessionalResource::make($professional->load('services'))
            ->response()
            ->setStatusCode(Response::HTTP_CREATED);
    }

    /**
     * Show a single professional.
     */
    public function show(Professional $professional): ProfessionalResource
    {
        return ProfessionalResource::make($professional->load('services'));
    }

    /**
     * Update an existing professional and resync its qualified services.
     */
    public function update(UpdateProfessionalRequest $request, Professional $professional): ProfessionalResource
    {
        $data = $request->validated();
        $serviceIds = $data['service_ids'] ?? [];
        unset($data['service_ids']);

        $professional->update($data);
        $professional->services()->sync($serviceIds);

        return ProfessionalResource::make($professional->load('services'));
    }

    /**
     * Delete a professional.
     */
    public function destroy(Professional $professional): Response
    {
        $professional->delete();

        return response()->noContent();
    }
}
