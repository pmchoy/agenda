<?php

namespace App\Domain\Scheduling\Data;

use Illuminate\Support\Collection;

/**
 * @extends Collection<int, Slot>
 */
final class SlotCollection extends Collection
{
    /**
     * @param  iterable<Slot>  $slots
     */
    public static function fromSlots(iterable $slots): self
    {
        /** @var self $sorted */
        $sorted = (new self($slots))
            ->sortBy(fn (Slot $slot): int => $slot->startsAt->getTimestamp())
            ->values();

        return $sorted;
    }
}
