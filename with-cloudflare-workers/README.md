![](../logo.svg)

# Getting started with Polar and Cloudflare Workers

## Clone the repository

```bash
npx degit polarsource/examples/with-cloudflare-workers ./with-cloudflare-workers
```

## How to use

1. Update the `wrangler.jsonc` file with the environment variables:

```bash
	"vars": {
		"POLAR_MODE": "production",
		"POLAR_ACCESS_TOKEN": "polar_oat_...",
		"POLAR_WEBHOOK_SECRET": "polar_whs_...",
		"POLAR_SUCCESS_URL": "https://a.b"
	}
```  

2. Run the command below to install project dependencies:

```
npm install
```

3. Run the Cloudflare Workers application using the following command:

```
npm run cf-typegen && npm run start
```
