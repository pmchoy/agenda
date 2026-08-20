import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

import { CalendarView } from '@/features/agenda/components/CalendarView'
import type { Appointment } from '@/types/api'

function appointment(overrides: Partial<Appointment> = {}): Appointment {
  return {
    id: 1,
    service_id: 1,
    professional_id: 1,
    client_id: 1,
    starts_at: '2026-08-20T10:00:00-03:00',
    ends_at: '2026-08-20T10:30:00-03:00',
    status: 'scheduled',
    origin: 'dashboard',
    notes: null,
    cancelled_at: null,
    client: { id: 1, name: 'Lucía Fernández', phone: '099', notes: null },
    professional: { id: 1, name: 'Ana Pérez', phone: null, is_active: true, priority: 1 },
    service: {
      id: 1,
      service_category_id: 1,
      name: 'Corte',
      duration_minutes: 30,
      price: null,
      is_active: true,
      sort_order: 1,
    },
    ...overrides,
  }
}

describe('CalendarView', () => {
  it('renders the day view with a resource column per professional', () => {
    const days = { '2026-08-20': [appointment()] }

    render(
      <MemoryRouter>
        <CalendarView
          view="day"
          date="2026-08-20"
          days={days}
          weekOrder={['2026-08-20']}
          onNavigate={vi.fn()}
          onViewChange={vi.fn()}
        />
      </MemoryRouter>,
    )

    expect(screen.getByText('Ana Pérez')).toBeInTheDocument()
    expect(screen.getByText(/Lucía Fernández/)).toBeInTheDocument()
  })

  it('renders the empty state when there are no appointments', () => {
    render(
      <MemoryRouter>
        <CalendarView
          view="day"
          date="2026-08-20"
          days={{}}
          weekOrder={['2026-08-20']}
          onNavigate={vi.fn()}
          onViewChange={vi.fn()}
        />
      </MemoryRouter>,
    )

    expect(screen.getByText('Nada reservado')).toBeInTheDocument()
  })
})
