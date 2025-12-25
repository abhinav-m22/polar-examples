package main

import (
	"context"
	"encoding/base64"
	"fmt"
	"log"
	"net/http"
	"os"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
	polargo "github.com/polarsource/polar-go"
	"github.com/polarsource/polar-go/models/components"
	"github.com/polarsource/polar-go/models/operations"
	svix "github.com/svix/svix-webhooks/go"
)

type Config struct {
	PolarAccessToken   string
	PolarWebhookSecret string
	PolarMode          string
	PolarSuccessURL    string
	Port               string
}

func loadConfig() (*Config, error) {
	// Load .env file
	_ = godotenv.Load()

	config := &Config{
		PolarAccessToken:   os.Getenv("POLAR_ACCESS_TOKEN"),
		PolarWebhookSecret: os.Getenv("POLAR_WEBHOOK_SECRET"),
		PolarMode:          os.Getenv("POLAR_MODE"),
		PolarSuccessURL:    os.Getenv("POLAR_SUCCESS_URL"),
		Port:               os.Getenv("PORT"),
	}

	if config.PolarMode == "" {
		config.PolarMode = "production"
	}
	if config.Port == "" {
		config.Port = "8080"
	}

	// Validate required fields
	if config.PolarAccessToken == "" {
		return nil, fmt.Errorf("POLAR_ACCESS_TOKEN is required")
	}
	if config.PolarWebhookSecret == "" {
		return nil, fmt.Errorf("POLAR_WEBHOOK_SECRET is required")
	}

	return config, nil
}

func main() {
	config, err := loadConfig()
	if err != nil {
		log.Fatalf("Configuration error: %v", err)
	}

	// Initialize Polar client
	polarClient := polargo.New(
		polargo.WithSecurity(config.PolarAccessToken),
	)
	if config.PolarMode == "sandbox" {
		polarClient = polargo.New(
			polargo.WithSecurity(config.PolarAccessToken),
			polargo.WithServerURL("https://sandbox-api.polar.sh"),
		)
	}

	router := gin.Default()

	router.GET("/", func(c *gin.Context) {
		ctx := context.Background()

		// Fetch products
		products, err := polarClient.Products.List(ctx, operations.ProductsListRequest{
			IsArchived: polargo.Bool(false),
		})
		if err != nil {
			c.String(http.StatusInternalServerError, "Error fetching products: %v", err)
			return
		}

		html := `<!doctype html>
<html>
  <head>
    <meta charset="UTF-8" />
    <title>Dashboard</title>
    <script src="https://cdn.tailwindcss.com"></script>
  </head>
  <body class="bg-white flex flex-col items-center justify-center gap-16 min-h-screen">
    <div class="w-[360px] max-w-[90%] flex flex-col gap-3">`

		if products.ListResourceProduct != nil {
			for _, product := range products.ListResourceProduct.Items {
				html += fmt.Sprintf(`
      <a 
        href="/checkout?products=%s" 
        target="_blank"
        class="block text-center px-4 py-3 border rounded-xl bg-gray-50 hover:bg-gray-100 text-gray-900 transition"
      >
        Buy %s
      </a>`, product.ID, product.Name)
			}
		}

		html += `
    </div>
    <form action="/portal" method="get" class="flex gap-2">
      <input 
        required
        type="email" 
        name="email" 
        placeholder="Email"
        class="px-4 py-2 text-base border rounded-lg w-[260px] focus:outline-none focus:border-black"
      />
      <button 
        type="submit" 
        class="px-6 py-2 text-base bg-black text-white rounded-lg hover:opacity-80 transition"
      >
        Continue
      </button>
    </form>
  </body>
</html>`

		c.Data(http.StatusOK, "text/html; charset=utf-8", []byte(html))
	})

	// Route: POST /polar/webhooks
	router.POST("/polar/webhooks", func(c *gin.Context) {
		bodyBytes, err := c.GetRawData()
		if err != nil {
			c.String(http.StatusBadRequest, "Error reading request body: %v", err)
			return
		}

		webhookID := c.GetHeader("webhook-id")
		webhookTimestamp := c.GetHeader("webhook-timestamp")
		webhookSignature := c.GetHeader("webhook-signature")
		base64Secret := base64.StdEncoding.EncodeToString([]byte(config.PolarWebhookSecret))

		// Verify webhook
		wh, err := svix.NewWebhook(base64Secret)
		if err != nil {
			log.Printf("Error creating webhook verifier: %v", err)
			c.String(http.StatusForbidden, "Error verifying webhook")
			return
		}

		headers := http.Header{}
		headers.Set("webhook-id", webhookID)
		headers.Set("webhook-timestamp", webhookTimestamp)
		headers.Set("webhook-signature", webhookSignature)

		err = wh.Verify(bodyBytes, headers)
		if err != nil {
			log.Printf("Webhook verification failed: %v", err)
			c.String(http.StatusForbidden, "Webhook verification failed")
			return
		}

		c.Data(http.StatusOK, "application/json", bodyBytes)
	})

	// Route: GET /checkout
	router.GET("/checkout", func(c *gin.Context) {
		ctx := context.Background()

		productIDs := c.QueryArray("products")
		if len(productIDs) == 0 {
			c.String(http.StatusBadRequest, "Missing products parameter")
			return
		}

		successURL := config.PolarSuccessURL
		if successURL == "" {
			successURL = fmt.Sprintf("http://%s/", c.Request.Host)
		}

		// Create checkout session
		checkoutSession, err := polarClient.Checkouts.Create(ctx, components.CheckoutCreate{
			Products:   productIDs,
			SuccessURL: polargo.String(successURL),
		})
		if err != nil {
			c.String(http.StatusInternalServerError, "Error creating checkout: %v", err)
			return
		}

		// Redirect to checkout URL
		if checkoutSession.Checkout != nil {
			c.Redirect(http.StatusFound, checkoutSession.Checkout.URL)
		} else {
			c.String(http.StatusInternalServerError, "Checkout URL not available")
		}
	})

	// Route: GET /portal
	router.GET("/portal", func(c *gin.Context) {
		ctx := context.Background()

		email := c.Query("email")
		if email == "" {
			c.String(http.StatusBadRequest, "Missing email parameter")
			return
		}

		// Find customer by email
		customers, err := polarClient.Customers.List(ctx, operations.CustomersListRequest{
			Email: polargo.String(email),
		})
		if err != nil {
			c.String(http.StatusInternalServerError, "Error fetching customer: %v", err)
			return
		}

		if customers.ListResourceCustomer == nil || len(customers.ListResourceCustomer.Items) == 0 {
			c.String(http.StatusNotFound, "Customer not found")
			return
		}

		// Create customer portal session
		session, err := polarClient.CustomerSessions.Create(ctx, operations.CreateCustomerSessionsCreateCustomerSessionCreateCustomerSessionCustomerIDCreate(
			components.CustomerSessionCustomerIDCreate{
				CustomerID: customers.ListResourceCustomer.Items[0].ID,
			},
		))
		if err != nil {
			c.String(http.StatusInternalServerError, "Error creating portal session: %v", err)
			return
		}

		// Redirect to customer portal
		if session.CustomerSession != nil {
			c.Redirect(http.StatusFound, session.CustomerSession.CustomerPortalURL)
		} else {
			c.String(http.StatusInternalServerError, "Customer portal URL not available")
		}
	})

	// Start server
	port := config.Port
	if _, err := strconv.Atoi(port); err != nil {
		port = "8080"
	}

	log.Printf("Server starting on port %s", port)
	if err := router.Run(":" + port); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}
