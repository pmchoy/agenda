import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'

import { RequireAuth } from '@/features/auth/RequireAuth'
import { LoginPage } from '@/features/auth/pages/LoginPage'
import { AppShell } from '@/components/layout/AppShell'
import { StubPage } from '@/pages/StubPage'
import { NotFoundPage } from '@/pages/NotFoundPage'

export function AppRouter() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        <Route element={<RequireAuth />}>
          <Route element={<AppShell />}>
            <Route index element={<Navigate to="/agenda" replace />} />
            <Route path="agenda" element={<StubPage title="Agenda" />} />
            <Route
              path="appointments/new"
              element={<StubPage title="New appointment" note="Booking flow ships in phase 7c." />}
            />
            <Route
              path="appointments/:id"
              element={<StubPage title="Appointment detail" note="Ships in phase 7c." />}
            />
            <Route
              path="catalog/*"
              element={<StubPage title="Catalog" note="Categories & services ship in phase 7b." />}
            />
            <Route
              path="professionals/*"
              element={<StubPage title="Professionals" note="Ships in phase 7b." />}
            />
            <Route path="clients" element={<StubPage title="Clients" note="Ships in phase 7b." />} />
            <Route
              path="business-hours"
              element={<StubPage title="Business hours" note="Ships in phase 7b." />}
            />
            <Route path="settings" element={<StubPage title="Settings" note="Ships in phase 7b." />} />
          </Route>
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  )
}
