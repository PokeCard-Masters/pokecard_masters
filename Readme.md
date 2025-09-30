# Pokecard Masters

This project is a Pokemon Cards game (TCG) made with `Django`.

## Installation

### Requirements

To install our dev environment we need :
- uv
- django

## Quickstart

You can run this commands to recreate the project from scratch :
```shell
# Install uv
curl -LsSf https://astral.sh/uv/install.sh | sh

# init uv
uv init

# Install django
uv add django

# Create django project
uv run django-admin startproject project

# Move into project directory
cd project

# Create django app
uv run python manage.py startapp app
```

Then run the server with :
```shell
uv run python manage.py runserver
```
