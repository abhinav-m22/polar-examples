![](../logo.svg)

# Getting started with Polar and RedwoodSDK

A minimal example demonstrating Polar payments integration using RedwoodSDK (React on Cloudflare Workers).

## Clone the repository

```bash
npx degit polarsource/examples/with-redwoodsdk ./with-redwoodsdk
```

## How to use

1. Update the `wrangler.jsonc` file with the environment variables:

```jsonc
"vars": {
  "POLAR_MODE": "sandbox",
  "POLAR_ACCESS_TOKEN": "polar_oat_...",
  "POLAR_WEBHOOK_SECRET": "polar_whs_...",
  "POLAR_SUCCESS_URL": "http://localhost:5173/"
}
```

2. Run the command below to install project dependencies:

```bash
npm install
```

3. Run the RedwoodSDK application using the following command:

```bash
npm run dev
```

### Webhook Testing

1. Use tools like ngrok for local webhook testing
2. Configure webhook URL in Polar dashboard
3. Configure `vite.server.allowedhosts` in `vite.config.mts` to allow it.
4. Trigger test events from Polar dashboard
