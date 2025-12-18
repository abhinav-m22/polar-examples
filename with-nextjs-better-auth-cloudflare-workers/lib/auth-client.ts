import { createAuthClient } from 'better-auth/react'
import { polarClient } from '@polar-sh/better-auth/client'

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_BETTER_AUTH_URL,
  plugins: [polarClient()],
})

export const { signIn, signUp, useSession } = createAuthClient()
