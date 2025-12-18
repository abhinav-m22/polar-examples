![](../logo.svg)

# Getting started with Polar, Next.js App Router, Better Auth and Cloudflare Workers

## Clone the repository

```bash
npx degit polarsource/examples/with-nextjs-better-auth-cloudflare-workers ./with-nextjs-better-auth-cloudflare-workers
```

## How to use

1. Install dependencies:

```bash
npm install
```

2. Configure environment variables:

Populate environment variables in your workspace to:

- cp .env.example .env - for locally running the project
- cp wrangler.jsonc.example wrangler.jsonc - for running the project with wrangler and on workers

3. Create the database schema

```bash
npx @better-auth/cli@latest generate
npx drizzle-kit generate --config=auth-schema.ts
```

Post that is done, run the SQL queries generated in the drizzle/*.sql file against your database.

4. Run the Next.js application using the following command:

```bash
npm run dev
```
