import { Hono } from 'hono'
import { env } from 'hono/adapter'
import { Polar } from '@polar-sh/sdk'
import { Checkout, CustomerPortal, Webhooks } from "@polar-sh/hono";

interface Env {
    POLAR_ACCESS_TOKEN: string;
    POLAR_WEBHOOK_SECRET: string;
    POLAR_MODE: string;
    POLAR_SUCCESS_URL: string;
}

const app = new Hono()

// Home page with products list
app.get('/', async (c) => {
    const { POLAR_MODE, POLAR_ACCESS_TOKEN } = env<Env>(c)

    try {
        const polar = new Polar({
            accessToken: POLAR_ACCESS_TOKEN,
            server: POLAR_MODE === "production" ? "production" : "sandbox",
        });

        const products = await polar.products.list({ isArchived: false });

        const productsList = products.result.items
            .map(
                (p) => `
          <li class="product-card">
            <div>
              <h3>${p.name}</h3>
            </div>
            <a href="/checkout?products=${p.id}" target="_blank" class="btn">
              Open Checkout
            </a>
          </li>
        `
            )
            .join("");

        const html = `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Polar with RedwoodSDK</title>
          <style>
            * { box-sizing: border-box; margin: 0; padding: 0; }
            body {
              font-family: system-ui, -apple-system, sans-serif;
              min-height: 100vh;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              padding: 2rem;
              background: #fafafa;
              color: #1a1a1a;
            }
            @media (prefers-color-scheme: dark) {
              body { background: #1a1a1a; color: #fafafa; }
              .product-card { background: #2a2a2a; border-color: #333; }
            }
            .container { width: 100%; max-width: 42rem; }
            h2 { font-size: 1.5rem; font-weight: bold; margin-bottom: 1rem; }
            .btn {
              display: inline-block;
              padding: 0.5rem 1rem;
              border: 1px solid currentColor;
              border-radius: 0.375rem;
              text-decoration: none;
              color: inherit;
              font-size: 0.875rem;
            }
            .btn:hover { background: rgba(0,0,0,0.05); }
            .products { list-style: none; margin-top: 1rem; }
            .product-card {
              background: white;
              border: 1px solid #e5e5e5;
              border-radius: 0.5rem;
              padding: 1.5rem;
              margin-bottom: 1rem;
              display: flex;
              justify-content: space-between;
              align-items: center;
            }
            .product-card h3 { font-size: 1.125rem; font-weight: 600; }
            .empty { color: #666; text-align: center; padding: 2rem; }
          </style>
        </head>
        <body>
          <div class="container">
            <h2>Products</h2>
            <a class="btn" href="/portal?email=test@example.com" target="_blank">
              Open Customer Portal
            </a>
            ${products.result.items.length > 0
                ? `<ul class="products">${productsList}</ul>`
                : '<p class="empty">No products found.</p>'
            }
          </div>
        </body>
      </html>
    `;

        return c.html(html);
    } catch (error) {
        return c.html(`<html><body><h1>Error</h1><p>${error}</p></body></html>`, 500);
    }
})

// Checkout endpoint
app.get("/checkout", async (c) => {
    const { POLAR_MODE, POLAR_ACCESS_TOKEN } = env<Env>(c)
    return await Checkout({
        accessToken: POLAR_ACCESS_TOKEN,
        server: POLAR_MODE === "production" ? "production" : "sandbox",
    })(c)
});

// Customer portal endpoint
app.get("/portal", async (c) => {
    const { email } = c.req.query()
    const { POLAR_MODE, POLAR_ACCESS_TOKEN } = env<Env>(c)
    return await CustomerPortal({
        server: POLAR_MODE === "production" ? "production" : "sandbox",
        accessToken: POLAR_ACCESS_TOKEN,
        getCustomerId: async () => {
            const polar = new Polar({
                accessToken: POLAR_ACCESS_TOKEN,
                server: POLAR_MODE === "production" ? "production" : "sandbox",
            });
            const customer = await polar.customers.list({ email, limit: 1, page: 1 });
            return customer.result.items[0].id
        },
    })(c)
});

// Webhook endpoint
app.post('/polar/webhooks', async (c) => {
    const { POLAR_WEBHOOK_SECRET } = env<Env>(c)
    return await Webhooks({
        webhookSecret: POLAR_WEBHOOK_SECRET,
        onPayload: async (payload) => {
            console.log("Received webhook:", payload.type);
            return c.json(payload)
        }
    })(c)
})

export default app
