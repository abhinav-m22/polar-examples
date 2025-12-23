from django.urls import path, include

urlpatterns = [
    path("", include("polar_app.urls")),
]
