import os
import json
from django.http import HttpResponse, HttpResponseRedirect, JsonResponse
from django.views import View
from polar_sdk import Polar
from polar_sdk.webhooks import validate_event, WebhookVerificationError

# Environment variables
POLAR_MODE = os.getenv("POLAR_MODE", "production")
POLAR_SUCCESS_URL = os.getenv("POLAR_SUCCESS_URL")
POLAR_ACCESS_TOKEN = os.getenv("POLAR_ACCESS_TOKEN")
POLAR_WEBHOOK_SECRET = os.getenv("POLAR_WEBHOOK_SECRET")

if not POLAR_ACCESS_TOKEN:
    raise ValueError("POLAR_ACCESS_TOKEN is required")
if not POLAR_WEBHOOK_SECRET:
    raise ValueError("POLAR_WEBHOOK_SECRET is required")

# Initialize Polar SDK
polar = Polar(
    access_token=POLAR_ACCESS_TOKEN,
    server=POLAR_MODE
)


class HomeView(View):
    """Home page displaying products and customer portal form"""
    
    def get(self, request):
        try:
            products = polar.products.list(is_archived=False)
            
            products_html = ""
            for product in products.result.items:
                products_html += f'<div><a target="_blank" href="/checkout?products={product.id}">{product.name}</a></div>'
            
            html_content = f"""
            <html>
                <body>
                    <form action="/portal" method="get">
                        <input type="email" name="email" placeholder="Email" required />
                        <button type="submit">Open Customer Portal</button>
                    </form>
                    <br>
                    {products_html}
                </body>
            </html>
            """
            return HttpResponse(html_content, content_type="text/html")
        except Exception as e:
            return HttpResponse(str(e), status=500)


class CheckoutView(View):
    """Create a checkout session and redirect to Polar checkout page"""
    
    def get(self, request):
        products = request.GET.get("products")
        
        if not products:
            return HttpResponse("Missing products parameter", status=400)
        
        try:
            # Get the host from the request to construct success URL
            host = request.META.get("HTTP_HOST", "localhost:8000")
            success_url = POLAR_SUCCESS_URL or f"http://{host}/"
            product_id = products.split(",")[0]
            
            checkout_session = polar.checkouts.custom.create(
                request={
                    "product_id": product_id,
                    "success_url": success_url
                }
            )
            
            return HttpResponseRedirect(checkout_session.url)
        except Exception as e:
            return HttpResponse(str(e), status=500)


class PortalView(View):
    """Create a customer portal session and redirect"""
    
    def get(self, request):
        email = request.GET.get("email")
        
        if not email:
            return HttpResponse("Missing email parameter", status=400)
        
        try:
            # Find customer by email
            customer_response = polar.customers.list(email=email)
            
            if not customer_response.result.items:
                return HttpResponse("Customer not found", status=404)
            
            customer = customer_response.result.items[0]
            
            # Create customer portal session
            session = polar.customer_sessions.create(
                request={"customer_id": customer.id}
            )
            
            return HttpResponseRedirect(session.customer_portal_url)
        except Exception as e:
            return HttpResponse(str(e), status=500)


class WebhookView(View):
    """Handle Polar webhooks with signature verification"""
    
    def post(self, request):
        try:
            request_body = request.body
            event = validate_event(
                body=request_body,
                headers=request.headers,
                secret=POLAR_WEBHOOK_SECRET,
            )
            return JsonResponse(json.loads(event.model_dump_json()))
        except WebhookVerificationError:
            return HttpResponse("", status=403)
