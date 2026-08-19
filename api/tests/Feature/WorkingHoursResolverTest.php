<?php

namespace Tests\Feature;

use App\Domain\Scheduling\WorkingHoursResolver;
use App\Models\BusinessHour;
use App\Models\Professional;
use App\Models\ProfessionalHour;
use Carbon\CarbonImmutable;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * 2026-08-19 is a Wednesday (ISO weekday 3) — fixed anchor date for every case.
 */
class WorkingHoursResolverTest extends TestCase
{
    use RefreshDatabase;

    private WorkingHoursResolver $resolver;

    private CarbonImmutable $wednesday;

    protected function setUp(): void
    {
        parent::setUp();

        $this->resolver = new WorkingHoursResolver;
        $this->wednesday = CarbonImmutable::parse('2026-08-19');
    }

    public function test_no_override_follows_base_hours(): void
    {
        BusinessHour::create(['weekday' => 3, 'opens_at' => '09:00:00', 'closes_at' => '18:00:00', 'is_closed' => false]);
        $professional = Professional::create(['name' => 'Ana']);

        $windows = $this->resolver->resolve($professional, $this->wednesday);

        $this->assertCount(1, $windows);
        $this->assertSame('09:00:00', $windows[0]->start->format('H:i:s'));
        $this->assertSame('18:00:00', $windows[0]->end->format('H:i:s'));
    }

    public function test_override_fully_replaces_base_hours(): void
    {
        BusinessHour::create(['weekday' => 3, 'opens_at' => '09:00:00', 'closes_at' => '18:00:00', 'is_closed' => false]);
        $professional = Professional::create(['name' => 'Ana']);
        ProfessionalHour::create([
            'professional_id' => $professional->id,
            'weekday' => 3,
            'opens_at' => '10:00:00',
            'closes_at' => '14:00:00',
            'is_closed' => false,
        ]);

        $windows = $this->resolver->resolve($professional, $this->wednesday);

        $this->assertCount(1, $windows);
        $this->assertSame('10:00:00', $windows[0]->start->format('H:i:s'));
        $this->assertSame('14:00:00', $windows[0]->end->format('H:i:s'));
    }

    public function test_is_closed_override_closes_an_otherwise_open_base_day(): void
    {
        BusinessHour::create(['weekday' => 3, 'opens_at' => '09:00:00', 'closes_at' => '18:00:00', 'is_closed' => false]);
        $professional = Professional::create(['name' => 'Ana']);
        ProfessionalHour::create([
            'professional_id' => $professional->id,
            'weekday' => 3,
            'opens_at' => null,
            'closes_at' => null,
            'is_closed' => true,
        ]);

        $windows = $this->resolver->resolve($professional, $this->wednesday);

        $this->assertSame([], $windows);
    }

    public function test_split_shift_override_returns_both_windows_in_order(): void
    {
        $professional = Professional::create(['name' => 'Ana']);
        ProfessionalHour::create([
            'professional_id' => $professional->id,
            'weekday' => 3,
            'opens_at' => '15:00:00',
            'closes_at' => '19:00:00',
            'is_closed' => false,
        ]);
        ProfessionalHour::create([
            'professional_id' => $professional->id,
            'weekday' => 3,
            'opens_at' => '09:00:00',
            'closes_at' => '13:00:00',
            'is_closed' => false,
        ]);

        $windows = $this->resolver->resolve($professional, $this->wednesday);

        $this->assertCount(2, $windows);
        $this->assertSame('09:00:00', $windows[0]->start->format('H:i:s'));
        $this->assertSame('13:00:00', $windows[0]->end->format('H:i:s'));
        $this->assertSame('15:00:00', $windows[1]->start->format('H:i:s'));
        $this->assertSame('19:00:00', $windows[1]->end->format('H:i:s'));
    }

    public function test_base_split_shift_is_used_when_no_override_present(): void
    {
        BusinessHour::create(['weekday' => 3, 'opens_at' => '09:00:00', 'closes_at' => '13:00:00', 'is_closed' => false]);
        BusinessHour::create(['weekday' => 3, 'opens_at' => '15:00:00', 'closes_at' => '19:00:00', 'is_closed' => false]);
        $professional = Professional::create(['name' => 'Ana']);

        $windows = $this->resolver->resolve($professional, $this->wednesday);

        $this->assertCount(2, $windows);
        $this->assertSame('09:00:00', $windows[0]->start->format('H:i:s'));
        $this->assertSame('15:00:00', $windows[1]->start->format('H:i:s'));
    }
}
