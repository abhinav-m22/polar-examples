![](../logo.svg)

# Getting started with Polar and Flask

## Prerequisites

- Python 3.8+ installed on your system
- A Polar account with API access

## Clone the repository

```bash
npx degit polarsource/examples/with-flask ./with-flask
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

Start the Flask development server:

```bash
python main.py
```

Or run with Flask CLI:

```bash
flask run --host=0.0.0.0 --port=8000
```

The application will be available at `http://localhost:8000`.
