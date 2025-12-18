'use client'

import { authClient, signIn, signUp, useSession } from '@/lib/auth-client'

export default function Home() {
  const { data: session } = useSession()
  return (
    <div className="flex flex-col gap-4">
      {session?.user?.email && <span>{session.user.email}</span>}
      <button onClick={() => signUp.email({ email: 'test1@test.com', name: 'test', password: 'test123$' })}>Sign up</button>
      <button onClick={() => signIn.email({ email: 'test1@test.com', password: 'test123$' })}>Sign In</button>
      <button onClick={() => authClient.checkout({ slug: 'test' })}>Checkout</button>
    </div>
  )
}
