<?php

namespace Tests\Feature\Schema;

use App\Models\Client;
use Illuminate\Database\QueryException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ClientModelTest extends TestCase
{
    use RefreshDatabase;

    public function test_it_persists_with_a_phone(): void
    {
        $client = Client::create(['name' => 'Carla', 'phone' => '+59899123456']);

        $this->assertDatabaseHas('clients', [
            'name' => 'Carla',
            'phone' => '+59899123456',
        ]);
        $this->assertNull($client->fresh()->notes);
    }

    public function test_phone_must_be_unique(): void
    {
        Client::create(['name' => 'Carla', 'phone' => '+59899123456']);

        $this->expectException(QueryException::class);

        Client::create(['name' => 'Other Carla', 'phone' => '+59899123456']);
    }

    public function test_phone_is_normalized_to_e164_through_the_cast(): void
    {
        $client = Client::create(['name' => 'Carla', 'phone' => '099123456']);

        $this->assertSame('+59899123456', $client->fresh()->phone);
        $this->assertDatabaseHas('clients', [
            'name' => 'Carla',
            'phone' => '+59899123456',
        ]);
    }
}
