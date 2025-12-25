# Getting started with Polar and Go (Gin)

## Clone the repository

```bash
npx degit polarsource/examples/with-golang-gin ./with-golang-gin
```

## How to use

1. Run the command below to copy the `.env.example` file:

```
cp .env.example .env
```

2. Edit the `.env` file and add your Polar credentials:

- `POLAR_ACCESS_TOKEN`: Your Organization Access Token
- `POLAR_WEBHOOK_SECRET`: Your webhook secret
- `POLAR_MODE`: Set to `sandbox` for testing or `production` for live mode
- `POLAR_SUCCESS_URL`: The URL customers will be redirected to after successful checkout (default: `http://localhost:8080`)

3. Run the command below to install project dependencies:

```
go mod download
```

4. Run the Go application using the following command:

```
go run main.go
```

5. Open your browser and navigate to `http://localhost:8080`