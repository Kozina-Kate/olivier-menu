"""Helpers for reading and validating application environment variables."""

import os

from django.core.exceptions import ImproperlyConfigured


TRUE_VALUES = {"1", "true", "yes", "on"}
FALSE_VALUES = {"0", "false", "no", "off"}


def env_bool(name: str, default: bool) -> bool:
    raw_value = os.getenv(name)
    if raw_value is None:
        return default

    value = raw_value.strip().lower()
    if value in TRUE_VALUES:
        return True
    if value in FALSE_VALUES:
        return False

    allowed = ", ".join(sorted(TRUE_VALUES | FALSE_VALUES))
    raise ImproperlyConfigured(f"{name} must be one of: {allowed}")


def env_list(name: str, default: str = "") -> list[str]:
    return [item.strip() for item in os.getenv(name, default).split(",") if item.strip()]


def env_int(name: str, default: int) -> int:
    raw_value = os.getenv(name)
    if raw_value is None:
        return default

    try:
        return int(raw_value)
    except ValueError as error:
        raise ImproperlyConfigured(f"{name} must be an integer") from error


def validate_production_settings(
    *,
    debug: bool,
    secret_key: str,
    local_secret_key: str,
    allowed_hosts: list[str],
) -> None:
    if debug:
        return

    if (
        secret_key == local_secret_key
        or secret_key.startswith("replace-me-")
        or len(secret_key) < 50
    ):
        raise ImproperlyConfigured(
            "DJANGO_SECRET_KEY must be set to a unique value of at least 50 characters "
            "when DJANGO_DEBUG is false"
        )
    if not allowed_hosts:
        raise ImproperlyConfigured(
            "DJANGO_ALLOWED_HOSTS must contain at least one hostname when "
            "DJANGO_DEBUG is false"
        )


def validate_production_database(*, debug: bool, is_postgresql: bool) -> None:
    if not debug and not is_postgresql:
        raise ImproperlyConfigured(
            "DATABASE_URL must point to PostgreSQL when DJANGO_DEBUG is false"
        )
