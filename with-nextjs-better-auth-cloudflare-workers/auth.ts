import { checkout, polar, webhooks } from '@polar-sh/better-auth'
import { Polar } from '@polar-sh/sdk'
import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { drizzle } from 'drizzle-orm/postgres-js'
import { schema } from './auth-schema'
import env from './lib/env'

const polarClient = new Polar({
  server: env.POLAR_MODE,
  accessToken: env.POLAR_ACCESS_TOKEN,
})

const db = drizzle(env.DATABASE_URL)

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    schema,
    provider: 'pg',
  }),
  emailAndPassword: {
    enabled: true,
  },
  plugins: [
    polar({
      client: polarClient,
      createCustomerOnSignUp: false,
      use: [
        checkout({
          authenticatedUsersOnly: true,
          products: [
            {
              productId: 'efd22ea2-d2e1-44b8-951f-493e08e72cb1',
              slug: 'test',
            },
          ],
        }),
        webhooks({
          secret: env.POLAR_WEBHOOK_SECRET,
          onPayload: (payload) => {
            console.log(payload)
            return Promise.resolve()
          },
        }),
      ],
    }),
  ],
})
