<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\StoreClientRequest;
use App\Http\Requests\Api\V1\UpdateClientRequest;
use App\Http\Resources\V1\ClientResource;
use App\Models\Client;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;

class ClientController extends Controller
{
    /**
     * List every client.
     */
    public function index(): AnonymousResourceCollection
    {
        return ClientResource::collection(
            Client::query()->orderBy('name')->get()
        );
    }

    /**
     * Create a new client.
     */
    public function store(StoreClientRequest $request): JsonResponse
    {
        $client = Client::create($request->validated());

        return ClientResource::make($client)
            ->response()
            ->setStatusCode(Response::HTTP_CREATED);
    }

    /**
     * Show a single client.
     */
    public function show(Client $client): ClientResource
    {
        return ClientResource::make($client);
    }

    /**
     * Update an existing client.
     */
    public function update(UpdateClientRequest $request, Client $client): ClientResource
    {
        $client->update($request->validated());

        return ClientResource::make($client);
    }

    /**
     * Delete a client.
     */
    public function destroy(Client $client): Response
    {
        $client->delete();

        return response()->noContent();
    }
}
