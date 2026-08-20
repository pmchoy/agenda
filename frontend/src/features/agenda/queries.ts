import { keepPreviousData, useQuery } from '@tanstack/react-query'

import { fetchAgenda, type AgendaParams } from '@/features/agenda/api'

export const agendaKeys = {
  search: (params: AgendaParams) => ['agenda', params] as const,
}

export function useAgenda(params: AgendaParams) {
  return useQuery({
    queryKey: agendaKeys.search(params),
    queryFn: () => fetchAgenda(params),
    // Keeps the previous day/week's rows on screen while navigating instead
    // of flashing back to the loading skeleton on every prev/next click.
    placeholderData: keepPreviousData,
  })
}
