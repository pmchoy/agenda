<?php

namespace Tests\Feature\Api\V1;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\RateLimiter;
use Tests\TestCase;

class AuthTest extends TestCase
{
    use RefreshDatabase;

    public function test_guest_hitting_user_endpoint_gets_401_json(): void
    {
        $response = $this->getJson('/api/v1/user');

        $response->assertStatus(401)
            ->assertJson(['message' => 'Unauthenticated.']);
    }

    public function test_user_can_login_with_valid_credentials(): void
    {
        $user = User::factory()->create(['password' => bcrypt('password')]);

        $response = $this->withHeader('Referer', 'http://agenda.test')
            ->postJson('/api/v1/login', [
                'email' => $user->email,
                'password' => 'password',
            ]);

        $response->assertStatus(200)
            ->assertJsonPath('data.id', $user->id)
            ->assertJsonPath('data.email', $user->email);

        $this->assertAuthenticated();
    }

    public function test_login_fails_with_invalid_password(): void
    {
        $user = User::factory()->create(['password' => bcrypt('password')]);

        $response = $this->postJson('/api/v1/login', [
            'email' => $user->email,
            'password' => 'wrong-password',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors('email');

        $this->assertGuest();
    }

    public function test_authenticated_user_can_fetch_own_profile(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->getJson('/api/v1/user');

        $response->assertStatus(200)
            ->assertJsonPath('data.id', $user->id)
            ->assertJsonPath('data.email', $user->email);
    }

    public function test_user_can_logout(): void
    {
        $user = User::factory()->create();

        $response = $this->withHeader('Referer', 'http://agenda.test')
            ->actingAs($user)
            ->postJson('/api/v1/logout');

        $response->assertStatus(204);

        // The `auth:sanctum` middleware switches the app's default guard to
        // 'sanctum' via Auth::shouldUse() once it authenticates the request,
        // so a bare assertGuest() would check the wrong guard here — the
        // logout controller explicitly logs out the underlying 'web' guard.
        $this->assertGuest('web');
    }

    public function test_login_throttles_after_five_failed_attempts(): void
    {
        $user = User::factory()->create(['password' => bcrypt('password')]);

        RateLimiter::clear(mb_strtolower($user->email).'|127.0.0.1');

        for ($i = 0; $i < 5; $i++) {
            $this->postJson('/api/v1/login', [
                'email' => $user->email,
                'password' => 'wrong-password',
            ]);
        }

        $response = $this->postJson('/api/v1/login', [
            'email' => $user->email,
            'password' => 'wrong-password',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors('email');

        $errors = $response->json('errors.email.0');
        $this->assertStringContainsString('seconds', $errors);
    }
}
