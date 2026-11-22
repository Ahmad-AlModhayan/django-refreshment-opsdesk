"""
Lifecycle Stage: ASGI Server -> Async Callable Entry
Production Invariant (🔴): Maintains clean ASGI compatibility alongside WSGI deployment.
Trap Prevented (⚠️): Missing ASGI entrypoint when adding async endpoints or websockets later.
"""
import os

from django.core.asgi import get_asgi_application

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
application = get_asgi_application()
