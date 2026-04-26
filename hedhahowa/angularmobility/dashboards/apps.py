from django.apps import AppConfig
import os
import ssl


class DashboardsConfig(AppConfig):
    name = 'dashboards'

    def ready(self):
        # --- Pro Global SSL Fix for Interception/Antivirus Environments ---
        # This solves the [SSL: CERTIFICATE_VERIFY_FAILED] error in Docker
        # by allowing self-signed certificates in the chain (common with host MITM).
        try:
            # Detect if we are in a dev/docker environment
            if os.environ.get('DEBUG', 'False') == 'True':
                ssl._create_default_https_context = ssl._create_unverified_context
                # Also patch the global default context just in case
                if not hasattr(ssl, '_create_default_https_context_orig'):
                    ssl._create_default_https_context_orig = ssl.create_default_context
                    ssl.create_default_context = ssl._create_unverified_context
        except Exception:
            pass
