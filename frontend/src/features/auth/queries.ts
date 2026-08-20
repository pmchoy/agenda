import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { fetchCurrentUser, forgotPassword, login, logout } from '@/features/auth/api'
import type { ForgotPasswordPayload, LoginPayload } from '@/features/auth/api'

export const authKeys = {
  user: ['auth', 'user'] as const,
}

export function useCurrentUser() {
  return useQuery({
    queryKey: authKeys.user,
    queryFn: fetchCurrentUser,
    staleTime: 5 * 60_000,
  })
}

export function useLogin() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: LoginPayload) => login(payload),
    onSuccess: (user) => {
      queryClient.setQueryData(authKeys.user, user)
    },
  })
}

export function useLogout() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: logout,
    onSuccess: () => {
      queryClient.setQueryData(authKeys.user, null)
      queryClient.clear()
    },
  })
}

export function useForgotPassword() {
  return useMutation({
    mutationFn: (payload: ForgotPasswordPayload) => forgotPassword(payload),
  })
}
