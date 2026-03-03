# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Pokemon TCG card collection app with a Django API backend, React Native/Expo mobile frontend. Card data is sourced from the TCGDex API.

## Development Environment

Uses **devbox** for reproducible environments and **uv** as the Python package manager. Python 3.13.

```bash
# Enter devbox shell (sets up Python, Node, MySQL, etc.)
devbox shell

# Install Python dependencies
uv sync
```

## Django Backend (project/)

### Common Commands

All Django commands run from the `project/` directory:

```bash
uv run python project/manage.py runserver        # Dev server (port 8000)
uv run python project/manage.py migrate           # Apply migrations
uv run python project/manage.py makemigrations    # Generate migrations
uv run python project/manage.py createsuperuser   # Create admin user
uv run python project/manage.py test app           # Run tests
uv run python project/import_cards.py             # Import cards from TCGDex API
```

### Architecture

- **API framework**: Django Ninja (`app/api.py`) — REST endpoints under `/api/`
- **Database**: MySQL (`pokemon` database on localhost:3306, root/root)
- **Environment variables**: `project/.env` (client ID/secret, Django secret key)
- **CORS**: Allows `http://localhost:8081` (Expo dev server)

### Key Models (app/models.py)

- **Card** — Pokemon card data (name, card_id from TCGDex, image URL, category, rarity, illustrator)
- **User** — App user (separate from Django auth User)
- **PlayerCard** — User's card collection (links User to Card with quantity)
- **Rarity_Card** — Rarity choices enum (Common through Shiny Gold)

### URL Structure

- `/app/` — Main authenticated view
- `/api/pokemon/` — Card list JSON endpoint
- `/api/` — Django Ninja API root (JWT-protected)
- `/admin/` — Django admin
- `/user/<id>/export/` and `/user/<id>/import/` — Collection import/export

## Expo Mobile App (app_expo/app-pokemasters/)

```bash
cd app_expo/app-pokemasters
npm install
npx expo start            # Start dev server
npx expo start --ios      # iOS simulator
npx expo start --android  # Android emulator
npx expo lint             # Lint
```

- **Framework**: Expo SDK 54, React Native 0.81, TypeScript
- **Routing**: Expo Router (file-based, under `app/`)
- **Navigation**: React Navigation bottom tabs
