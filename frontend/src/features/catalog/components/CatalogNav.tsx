import { NavLink } from 'react-router-dom'

import { cn } from '@/lib/utils'

/** Sub-navigation between the catalog's two list screens. Matches the
 * design addendum's route map: `/catalog/categories` and `/catalog/services`
 * are separate pages, not tabs within one component tree. */
export function CatalogNav() {
  const tabs = [
    { to: '/catalog/categories', label: 'Categories' },
    { to: '/catalog/services', label: 'Services' },
  ]

  return (
    <div className="mb-6 flex gap-1 border-b border-border">
      {tabs.map((tab) => (
        <NavLink
          key={tab.to}
          to={tab.to}
          className={({ isActive }) =>
            cn(
              'border-b-2 px-3 pb-3 text-sm font-medium transition-colors',
              isActive
                ? 'border-primary text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground',
            )
          }
        >
          {tab.label}
        </NavLink>
      ))}
    </div>
  )
}
