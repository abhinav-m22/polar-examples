import {
  AngularNodeAppEngine,
  createNodeRequestHandler,
  isMainModule,
  writeResponseToNodeResponse,
} from '@angular/ssr/node';
import express from 'express';
import { join } from 'node:path';
import { Polar } from '@polar-sh/sdk';
import { Webhook } from 'standardwebhooks';
import { env } from './config/env.js';

const browserDistFolder = join(import.meta.dirname, '../browser');

const app = express();
const angularApp = new AngularNodeAppEngine();

// Initialize Polar SDK
const polar = new Polar({ accessToken: env.POLAR_ACCESS_TOKEN, server: env.POLAR_MODE });

// Middleware to parse JSON and text bodies
app.use(express.json());
app.use(express.text({ type: 'application/json' }));

/**
 * Polar API endpoints
 */

// Webhook endpoint
app.post('/polar/webhooks', async (req, res) => {
  try {
    const requestBody = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
    const webhookHeaders = {
      'webhook-id': req.headers['webhook-id'] as string,
      'webhook-timestamp': req.headers['webhook-timestamp'] as string,
      'webhook-signature': req.headers['webhook-signature'] as string,
    };
    
    const base64Secret = Buffer.from(env.POLAR_WEBHOOK_SECRET, 'utf-8').toString('base64');
    const webhook = new Webhook(base64Secret);
    
    try {
      webhook.verify(requestBody, webhookHeaders);
      res.status(200).json(JSON.parse(requestBody));
    } catch (error) {
      console.log(error instanceof Error ? error.message : String(error));
      res.status(403).json({ error: error instanceof Error ? error.message : String(error) });
    }
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

// Checkout redirect endpoint
app.get('/checkout', async (req, res) => {
  try {
    const productIds = req.query['products'] as string;
    if (!productIds) {
      return res.status(400).json({ error: 'Missing products parameter' });
    }
    
    const checkoutSession = await polar.checkouts.create({
      products: typeof productIds === 'string' ? [productIds] : productIds,
      successUrl: env.POLAR_SUCCESS_URL || `http://${req.headers.host}/`,
    });
    
    return res.redirect(302, checkoutSession.url);
  } catch (error) {
    return res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

// Customer portal redirect endpoint
app.get('/portal', async (req, res) => {
  try {
    const email = req.query['email'] as string;
    if (!email) {
      return res.status(400).json({ error: 'Missing email parameter' });
    }
    
    const customer = await polar.customers.list({ email });
    if (!customer.result.items.length) {
      return res.status(404).json({ error: 'Customer not found' });
    }
    
    const session = await polar.customerSessions.create({
      customerId: customer.result.items[0].id,
    });
    
    return res.redirect(302, session.customerPortalUrl);
  } catch (error) {
    return res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

// API endpoint to get products
app.get('/api/products', async (req, res) => {
  try {
    const products = await polar.products.list({ isArchived: false });
    res.json(products.result.items);
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

/**
 * Serve static files from /browser
 */
app.use(
  express.static(browserDistFolder, {
    maxAge: '1y',
    index: false,
    redirect: false,
  }),
);

/**
 * Handle all other requests by rendering the Angular application.
 */
app.use((req, res, next) => {
  angularApp
    .handle(req)
    .then((response) =>
      response ? writeResponseToNodeResponse(response, res) : next(),
    )
    .catch(next);
});

/**
 * Start the server if this module is the main entry point, or it is ran via PM2.
 * The server listens on the port defined by the `PORT` environment variable, or defaults to 4000.
 */
if (isMainModule(import.meta.url) || process.env['pm_id']) {
  const port = process.env['PORT'] || 4000;
  app.listen(port, (error) => {
    if (error) {
      throw error;
    }

    console.log(`Node Express server listening on http://localhost:${port}`);
  });
}

/**
 * Request handler used by the Angular CLI (for dev-server and during build) or Firebase Cloud Functions.
 */
export const reqHandler = createNodeRequestHandler(app);
