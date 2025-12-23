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
