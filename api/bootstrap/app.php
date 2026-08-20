<?php

use App\Domain\Scheduling\Exceptions\InvalidStatusTransitionException;
use App\Domain\Scheduling\Exceptions\OutsideWorkingHoursException;
use App\Domain\Scheduling\Exceptions\SlotUnavailableException;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        apiPrefix: 'api',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->statefulApi();

        $middleware->redirectGuestsTo(fn () => null);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->shouldRenderJsonWhen(
            fn (Request $request) => $request->is('api/*') || $request->expectsJson(),
        );

        $exceptions->render(function (SlotUnavailableException $e, Request $request) {
            return response()->json([
                'message' => $e->getMessage() ?: 'Ese horario ya no está disponible.',
                'code' => 'slot_unavailable',
            ], 409);
        });

        $exceptions->render(function (OutsideWorkingHoursException $e, Request $request) {
            return response()->json([
                'message' => $e->getMessage() ?: 'Ese horario está fuera del horario laboral.',
                'code' => 'outside_working_hours',
            ], 409);
        });

        $exceptions->render(function (InvalidStatusTransitionException $e, Request $request) {
            return response()->json([
                'message' => $e->getMessage() ?: 'Ese cambio de estado no está permitido.',
                'code' => 'invalid_status_transition',
            ], 409);
        });

        $exceptions->render(function (AuthenticationException $e, Request $request) {
            if ($request->is('api/*') || $request->expectsJson()) {
                return response()->json(['message' => 'No autenticado.'], 401);
            }
        });
    })->create();
