import polar_sdk
from os import getenv
from fastapi import FastAPI
from polar_sdk import Polar
from dotenv import load_dotenv
from fastapi.responses import RedirectResponse

load_dotenv()

app = FastAPI()

@app.get("/{amount}")
def open_checkout(amount: int):
    polar = Polar(access_token=getenv("POLAR_API_KEY"))
    checkoutSession = polar.checkouts.create(request={
        "products": [product_id],
        "prices": {
            [product_id]: [
                {
                    "price_amount": amount,
                    "amount_type": "fixed",
                    "price_currency": "usd",
                }
            ]
        }
    })
    return RedirectResponse(url=checkoutSession.url)
