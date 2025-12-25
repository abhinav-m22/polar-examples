![](../logo.svg)

# Getting started with Polar and RedwoodSDK

## Prerequisites

- Node.js 18+ installed on your system
- A Polar account with API access
- Cloudflare account (for deployment)

## Clone the repository

```bash
npx degit polarsource/examples/with-redwoodsdk ./with-redwoodsdk
```

## Setup

1. Install dependencies:

```bash
npm install
```

2. Configure environment variables:

Update the `wrangler.jsonc` file with your Polar credentials:

- `POLAR_ACCESS_TOKEN` - Your Polar access token
- `POLAR_WEBHOOK_SECRET` - Your webhook secret
- `POLAR_MODE` - `sandbox` or `production`

## Development

Start the development server:

```bash
npm run dev
```

The application will be available at `http://localhost:5173`.

## Features

- **Home Page (`/`)**: Displays all available products with checkout links
- **Products API (`/api/products`)**: Fetches available products from Polar
- **Checkout (`/api/checkout`)**: Creates a checkout session and redirects
- **Customer Portal (`/api/portal`)**: Customer subscription management
- **Webhooks (`/api/polar/webhooks`)**: Handles Polar webhook events

## Deploy

```bash
npm run deploy
```
