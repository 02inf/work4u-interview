import { createAuthClient } from 'better-auth/react'

export const authClient = createAuthClient({
  baseURL: import.meta.env.VITE_SERVER_URL || 'http://localhost:3000',
})

export const useAuth = () => {
  const { data: session, isPending } = authClient.useSession()
  return { session, isPending }
}
