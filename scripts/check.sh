#!/usr/bin/env bash
set -euo pipefail

if [[ -x .venv/bin/python ]]; then
  OLIVIER_PYTHON=.venv/bin/python
else
  OLIVIER_PYTHON=python3
fi

npm run check:frontend
"$OLIVIER_PYTHON" backend/manage.py check
"$OLIVIER_PYTHON" backend/manage.py makemigrations --check --dry-run
"$OLIVIER_PYTHON" backend/manage.py test recipes
