import os
from unittest.mock import patch

from django.core.exceptions import ImproperlyConfigured
from django.test import SimpleTestCase

from .env import (
    env_bool,
    env_int,
    env_list,
    validate_production_database,
    validate_production_settings,
)


class EnvironmentHelpersTests(SimpleTestCase):
    @patch.dict(os.environ, {"FEATURE_FLAG": " yes "})
    def test_env_bool_accepts_common_true_values(self):
        self.assertTrue(env_bool("FEATURE_FLAG", False))

    @patch.dict(os.environ, {"FEATURE_FLAG": "sometimes"})
    def test_env_bool_rejects_unknown_value(self):
        with self.assertRaisesMessage(ImproperlyConfigured, "FEATURE_FLAG must be one of"):
            env_bool("FEATURE_FLAG", False)

    @patch.dict(os.environ, {"HOSTS": " api.example.test, ,admin.example.test "})
    def test_env_list_strips_empty_items(self):
        self.assertEqual(env_list("HOSTS"), ["api.example.test", "admin.example.test"])

    @patch.dict(os.environ, {"CONNECTION_AGE": "not-a-number"})
    def test_env_int_rejects_non_integer(self):
        with self.assertRaisesMessage(ImproperlyConfigured, "CONNECTION_AGE must be an integer"):
            env_int("CONNECTION_AGE", 600)

    def test_production_requires_a_strong_secret_key(self):
        with self.assertRaisesMessage(ImproperlyConfigured, "DJANGO_SECRET_KEY must be set"):
            validate_production_settings(
                debug=False,
                secret_key="short",
                local_secret_key="local-only",
                allowed_hosts=["api.example.test"],
            )

    def test_production_rejects_the_documented_placeholder_secret(self):
        with self.assertRaisesMessage(ImproperlyConfigured, "DJANGO_SECRET_KEY must be set"):
            validate_production_settings(
                debug=False,
                secret_key="replace-me-in-production-with-at-least-50-characters",
                local_secret_key="local-only",
                allowed_hosts=["api.example.test"],
            )

    def test_production_requires_allowed_hosts(self):
        with self.assertRaisesMessage(ImproperlyConfigured, "DJANGO_ALLOWED_HOSTS must contain"):
            validate_production_settings(
                debug=False,
                secret_key="x" * 50,
                local_secret_key="local-only",
                allowed_hosts=[],
            )

    def test_local_development_keeps_zero_configuration_defaults(self):
        validate_production_settings(
            debug=True,
            secret_key="local-only",
            local_secret_key="local-only",
            allowed_hosts=[],
        )

    def test_production_requires_postgresql(self):
        with self.assertRaisesMessage(ImproperlyConfigured, "DATABASE_URL must point"):
            validate_production_database(debug=False, is_postgresql=False)
