from django.urls import path
from django.views.decorators.csrf import csrf_exempt
from .views import HomeView, CheckoutView, PortalView, WebhookView

urlpatterns = [
    path("", HomeView.as_view(), name="home"),
    path("checkout", CheckoutView.as_view(), name="checkout"),
    path("portal", PortalView.as_view(), name="portal"),
    path("polar/webhooks", csrf_exempt(WebhookView.as_view()), name="webhooks"),
]
