/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `npm run dev` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `npm run deploy` to publish your worker
 *
 * Bind resources to your worker in `wrangler.jsonc`. After adding bindings, a type definition for the
 * `Env` object can be regenerated with `npm run cf-typegen`.
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

import { Polar } from '@polar-sh/sdk'
import { env as cloudflareEnv } from 'cloudflare:workers';
import { z } from 'zod'
import { Webhook } from 'standardwebhooks'

const envSchema = z.object({
	POLAR_MODE: z.enum(['sandbox', 'production']).default('production'),
	POLAR_ACCESS_TOKEN: z.string().min(1, 'POLAR_ACCESS_TOKEN is required'),
	POLAR_WEBHOOK_SECRET: z.string().min(1, 'POLAR_WEBHOOK_SECRET is required'),
	POLAR_SUCCESS_URL: z.string().url('POLAR_SUCCESS_URL must be a valid URL').optional(),
})

const env = envSchema.parse(cloudflareEnv)

const polar = new Polar({ accessToken: env.POLAR_ACCESS_TOKEN, server: env.POLAR_MODE })

export default {
	async fetch(request, env, ctx): Promise<Response> {
		
		const url = new URL(request.url, `http://${request.headers.get('host')}`)
		const { pathname } = url
		const { method } = request
		try {
		  // Route: GET /
		  if (pathname === '/' && method === 'GET') {
			const products = await polar.products.list({ isArchived: false })
			return new Response(
			  `<html><body>
			<form action="/portal" method="get">
			  <input type="email" name="email" placeholder="Email" required />
			  <button type="submit">Open Customer Portal</button>
			</form>
			${products.result.items.map((product) => `<div><a target="_blank" href="/checkout?products=${product.id}">${product.name}</a></div>`).join('')}
			</body></html>`,
			  {
				headers: {
				  'Content-Type': 'text/html',
				},
			  },
			)
		  }
		  // Route: POST /polar/webhooks
		  if (pathname === '/polar/webhooks' && method === 'POST') {
			const requestBody = await request.text()
			const webhookHeaders = {
			  'webhook-id': request.headers.get('webhook-id'),
			  'webhook-timestamp': request.headers.get('webhook-timestamp'),
			  'webhook-signature': request.headers.get('webhook-signature'),
			}
			const base64Secret = Buffer.from(env.POLAR_WEBHOOK_SECRET, 'utf-8').toString('base64')
			const webhook = new Webhook(base64Secret)
			try {
			  webhook.verify(requestBody, webhookHeaders)
			  return new Response(requestBody, {
				headers: { 'Content-Type': 'application/json' },
			  })
			} catch (error: any) {
			  console.log(error.message || error.toString())
			  return new Response(null, {
				status: 403,
				statusText: error.message || error.toString(),
			  })
			}
		  }
		  // Route: GET /checkout
		  if (pathname === '/checkout' && method === 'GET') {
			const productIds = url.searchParams.get('products')
			if (!productIds) {
			  return new Response(null, {
				status: 400,
				statusText: 'Missing products parameter',
			  })
			}
			const checkoutSession = await polar.checkouts.create({
			  products: typeof productIds === 'string' ? [productIds] : productIds,
			  successUrl: env.POLAR_SUCCESS_URL || `http://${request.headers.get('host')}/`,
			})
			return new Response(null, {
			  status: 302,
			  headers: {
				Location: checkoutSession.url,
			  },
			})
		  }
		  // Route: GET /portal
		  if (pathname === '/portal' && method === 'GET') {
			const email = url.searchParams.get('email')
			if (!email) {
			  return new Response(null, {
				status: 400,
				statusText: 'Missing email parameter',
			  })
			}
			const customer = await polar.customers.list({ email })
			if (!customer.result.items.length) {
			  return new Response(null, {
				status: 404,
				statusText: 'Customer not found',
			  })
			}
			const session = await polar.customerSessions.create({
			  customerId: customer.result.items[0].id,
			})
			return new Response(null, {
			  status: 302,
			  headers: {
				Location: session.customerPortalUrl,
			  },
			})
		  }
		  // 405 Method Not Allowed
		  return new Response(null, {
			status: 405,
		  })
		} catch (error: any) {
		  return new Response(error.message || error.toString(), {
			status: 500,
			statusText: error.message || error.toString(),
		  })
		}
	},
} satisfies ExportedHandler<Env>;
