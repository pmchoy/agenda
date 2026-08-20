import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'

import { RequireAuth } from '@/features/auth/RequireAuth'
import { LoginPage } from '@/features/auth/pages/LoginPage'
import { AppShell } from '@/components/layout/AppShell'
import { NotFoundPage } from '@/pages/NotFoundPage'
import { CategoriesPage } from '@/features/catalog/pages/CategoriesPage'
import { ServicesPage } from '@/features/catalog/pages/ServicesPage'
import { ProfessionalsPage } from '@/features/professionals/pages/ProfessionalsPage'
import { ProfessionalHoursPage } from '@/features/professionals/pages/ProfessionalHoursPage'
import { ClientsPage } from '@/features/clients/pages/ClientsPage'
import { BusinessHoursPage } from '@/features/hours/pages/BusinessHoursPage'
import { SettingsPage } from '@/features/settings/pages/SettingsPage'
import { AgendaPage } from '@/features/agenda/pages/AgendaPage'
import { NewAppointmentPage } from '@/features/appointments/pages/NewAppointmentPage'
import { AppointmentDetailPage } from '@/features/appointments/pages/AppointmentDetailPage'

export function AppRouter() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        <Route element={<RequireAuth />}>
          <Route element={<AppShell />}>
            <Route index element={<Navigate to="/agenda" replace />} />
            <Route path="agenda" element={<AgendaPage />} />
            <Route path="appointments/new" element={<NewAppointmentPage />} />
            <Route path="appointments/:id" element={<AppointmentDetailPage />} />
            <Route path="catalog" element={<Navigate to="/catalog/categories" replace />} />
            <Route path="catalog/categories" element={<CategoriesPage />} />
            <Route path="catalog/services" element={<ServicesPage />} />
            <Route path="professionals" element={<ProfessionalsPage />} />
            <Route path="professionals/:id/hours" element={<ProfessionalHoursPage />} />
            <Route path="clients" element={<ClientsPage />} />
            <Route path="business-hours" element={<BusinessHoursPage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  )
}
