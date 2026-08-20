import { NavLink, useLocation } from 'react-router-dom'
import {
  CalendarClock,
  LayoutGrid,
  Users,
  UserRound,
  Clock,
  Settings,
  LogOut,
} from 'lucide-react'

import { cn } from '@/lib/utils'
import { Separator } from '@/components/ui/separator'
import { useCurrentUser, useLogout } from '@/features/auth/queries'

type NavItem = {
  to: string
  label: string
  icon: typeof CalendarClock
  match?: string
}

const navItems: NavItem[] = [
  { to: '/agenda', label: 'Agenda', icon: CalendarClock },
  { to: '/catalog/categories', label: 'Catalog', icon: LayoutGrid, match: '/catalog' },
  { to: '/professionals', label: 'Professionals', icon: UserRound, match: '/professionals' },
  { to: '/clients', label: 'Clients', icon: Users },
  { to: '/business-hours', label: 'Business hours', icon: Clock },
  { to: '/settings', label: 'Settings', icon: Settings },
]

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const { data: user } = useCurrentUser()
  const logout = useLogout()
  const location = useLocation()

  return (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      <div className="flex items-center gap-2.5 px-5 py-5">
        <div className="flex size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
          <CalendarClock className="size-4" />
        </div>
        <div>
          <p className="text-sm font-semibold leading-none">Agenda</p>
          <p className="mt-1 text-xs text-sidebar-foreground/60">OMLUruguay</p>
        </div>
      </div>

      <Separator className="bg-sidebar-border" />

      <nav className="flex-1 space-y-1 px-3 py-4">
        {navItems.map(({ to, label, icon: Icon, match }) => (
          <NavLink
            key={to}
            to={to}
            onClick={onNavigate}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                isActive || (match !== undefined && location.pathname.startsWith(match))
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                  : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground',
              )
            }
          >
            <Icon className="size-4 shrink-0" />
            {label}
          </NavLink>
        ))}
      </nav>

      <Separator className="bg-sidebar-border" />

      <div className="space-y-2 px-3 py-4">
        {user && (
          <div className="rounded-md px-3 py-1.5">
            <p className="truncate text-sm font-medium">{user.name}</p>
            <p className="truncate text-xs text-sidebar-foreground/60">{user.email}</p>
          </div>
        )}
        <button
          type="button"
          onClick={() => logout.mutate()}
          disabled={logout.isPending}
          className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground disabled:opacity-50"
        >
          <LogOut className="size-4 shrink-0" />
          Sign out
        </button>
      </div>
    </div>
  )
}
