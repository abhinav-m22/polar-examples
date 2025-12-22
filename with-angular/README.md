![](../logo.svg)

# Getting started with Polar and Angular

This example demonstrates how to integrate Polar SDK with an Angular application using server-side rendering (SSR).

## Clone the repository

```bash
npx degit polarsource/examples/with-angular ./with-angular
```

## How to use

1. Run the command below to copy the `.env.example` file:

```bash
cp .env.example .env
```

2. Run the command below to install project dependencies:

```bash
npm install
```

3. Build the Angular application:

```bash
npm run build
```

4. Start the server:

```bash
npm run serve:ssr:with-angular
```

The application will be available at `http://localhost:4000`.

