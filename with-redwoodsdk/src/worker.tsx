import { Document } from '@/app/Document'
import { setCommonHeaders } from '@/app/headers'
import { Home } from '@/app/pages/Home'
import { env as cloudflareEnv } from 'cloudflare:workers'
import { prefix, render, route } from 'rwsdk/router'
import { defineApp } from 'rwsdk/worker'
import { Webhook } from 'standardwebhooks'
import { polar } from './polar'

export type AppContext = {
  polar: typeof polar
}

export default defineApp([
  setCommonHeaders(),
  ({ ctx }) => {
    // Add Polar client to context for use in components
    ctx.polar = polar
  },
  // API Routes (no Document wrapper needed)
  prefix('/api', [
    // Checkout redirect
    route('/checkout', async ({ request }) => {
      const url = new URL(request.url)
      const productId = url.searchParams.get('product')
      if (!productId) return new Response('Missing product parameter', { status: 400 })
      const checkout = await polar.checkouts.create({
        products: [productId],
        successUrl: cloudflareEnv?.SUCCESS_URL || url.origin,
      })
      return Response.redirect(checkout.url, 302)
    }),
    // Customer portal redirect
    route('/portal', async ({ request }) => {
      const url = new URL(request.url)
      const email = url.searchParams.get('email')
      if (!email) return new Response('Missing email parameter', { status: 400 })
      const customers = await polar.customers.list({ email })
      if (!customers.result.items.length) return new Response('Customer not found', { status: 404 })
      const session = await polar.customerSessions.create({
        customerId: customers.result.items[0].id,
      })
      return Response.redirect(session.customerPortalUrl, 302)
    }),
  ]),
  // Webhook endpoint (POST only, no Document wrapper)
  route('/polar/webhooks', async ({ request }) => {
    if (request.method !== 'POST') return new Response('Method not allowed', { status: 405 })
    const body = await request.text()
    const webhookHeaders = {
      'webhook-id': request.headers.get('webhook-id') ?? '',
      'webhook-timestamp': request.headers.get('webhook-timestamp') ?? '',
      'webhook-signature': request.headers.get('webhook-signature') ?? '',
    }
    try {
      const base64Secret = Buffer.from(cloudflareEnv.POLAR_WEBHOOK_SECRET, 'utf-8').toString('base64')
      const webhook = new Webhook(base64Secret)
      webhook.verify(body, webhookHeaders)
      const event = JSON.parse(body)
      // add your logic here
      return new Response(JSON.stringify({ received: true }), {
        headers: { 'Content-Type': 'application/json' },
      })
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      console.error('Webhook verification failed:', message)
      return new Response('Webhook verification failed', { status: 403 })
    }
  }),
  // Page routes (with Document wrapper for HTML)
  render(Document, [route('/', Home)]),
])
