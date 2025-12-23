import os
import json
from polar_sdk import Polar
from dotenv import load_dotenv
from flask import Flask, request, redirect, Response
from polar_sdk.webhooks import validate_event, WebhookVerificationError

load_dotenv()

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

app = Flask(__name__)


@app.route("/", methods=["GET"])
def home():
    """Home page displaying products and customer portal form"""
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
        return Response(html_content, mimetype="text/html")
    except Exception as e:
        return Response(str(e), status=500)


@app.route("/checkout", methods=["GET"])
def checkout():
    """Create a checkout session and redirect to Polar checkout page"""
    products = request.args.get("products")
    if not products:
        return Response("Missing products parameter", status=400)
    try:
        # Get the host from the request to construct success URL
        host = request.headers.get("host", "localhost:8000")
        success_url = POLAR_SUCCESS_URL or f"http://{host}/"
        product_id = products.split(",")[0]
        checkout_session = polar.checkouts.custom.create(
            request={
                "product_id": product_id,
                "success_url": success_url
            }
        )
        return redirect(checkout_session.url, code=302)
    except Exception as e:
        return Response(str(e), status=500)


@app.route("/portal", methods=["GET"])
def customer_portal():
    """Create a customer portal session and redirect"""
    email = request.args.get("email")
    if not email:
        return Response("Missing email parameter", status=400)
    try:
        # Find customer by email
        customer_response = polar.customers.list(email=email)
        if not customer_response.result.items:
            return Response("Customer not found", status=404)
        customer = customer_response.result.items[0]
        # Create customer portal session
        session = polar.customer_sessions.create(
            request={"customer_id": customer.id}
        )
        return redirect(session.customer_portal_url, code=302)
    except Exception as e:
        return Response(str(e), status=500)


@app.route("/polar/webhooks", methods=["POST"])
def webhooks():
    """Handle Polar webhooks with signature verification"""
    try:
        request_body = request.get_data()
        event = validate_event(
            body=request_body,
            headers=request.headers,
            secret=POLAR_WEBHOOK_SECRET,
        )
        return json.loads(event.model_dump_json())
    except WebhookVerificationError:
        return Response("", status=403)

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8000, debug=True)
