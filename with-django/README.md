# Getting started with Polar and Django

## Prerequisites

- Python 3.10+ installed on your system
- A Polar account with API access

## Clone the repository

```bash
npx degit polarsource/examples/with-django ./with-django
```

## Setup

1. Create a virtual environment:

```bash
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install dependencies:

```bash
pip install -r requirements.txt
```

3. Configure environment variables:

```bash
cp .env.example .env
```

## Usage

Start the Django development server:

```bash
python manage.py runserver 0.0.0.0:8000
```

The application will be available at `http://localhost:8000`.

## Features

- **Home Page (`/`)**: Displays all available products with checkout links and a customer portal form
- **Checkout (`/checkout`)**: Creates a checkout session and redirects to Polar checkout
- **Customer Portal (`/portal`)**: Allows customers to manage their subscriptions
- **Webhooks (`/polar/webhooks`)**: Handles Polar webhook events with signature verification

## Project Structure

```
with-django/
├── config/           # Django project settings
│   ├── settings.py
│   ├── urls.py
│   └── wsgi.py
├── polar_app/        # Polar integration app
│   ├── views.py      # Class-based views for Polar endpoints
│   └── urls.py       # URL routing
├── manage.py
├── requirements.txt
└── .env.example
```
