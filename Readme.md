# Pokecard Masters

Pokemon TCG card collection app with a Django API backend and React Native/Expo mobile frontend. Card data is sourced from the TCGDex API.

## Installation

### Requirements

- [uv](https://astral.sh/uv) (Python package manager)
- Python 3.13
- MySQL
- Node.js

### Backend Setup

```shell
# Install Python dependencies
uv sync

# Apply database migrations
uv run python project/manage.py migrate

# Import cards from TCGDex API
uv run python project/import_cards.py

# Start the dev server
uv run python project/manage.py runserver
```

### Mobile App Setup

```shell
cd app_expo/app-pokemasters
npm install
npx expo start
```

## Authentication

The app supports two authentication methods:

- **Google OAuth** — Sign in with your Google account
- **Email/Password** — Register and sign in with email and password

Both methods issue JWT tokens used to access protected API endpoints. Accounts are linked by email — a Google user can add a password to their account.

### API Endpoints

| Endpoint | Method | Auth | Description |
|---|---|---|---|
| `/api/auth/register` | POST | No | Register with email, password, name |
| `/api/auth/login` | POST | No | Login with email and password |
| `/api/me` | GET | JWT | Get current user (creates on first Google login) |
| `/api/card` | GET | JWT | List all cards |

## Project Structure

```
project/            # Django backend
  app/
    api.py          # REST API endpoints (Django Ninja)
    models.py       # User, Card, PlayerCard models
    authentification.py  # JWT auth (Google + app-issued)
app_expo/           # Expo/React Native mobile app
  app-pokemasters/
    app/(auth)/     # Login and register screens
    app/(tabs)/     # Main app tabs
    context/        # AuthContext (token management)
    services/       # API fetch helper
    config/         # Auth configuration
```
