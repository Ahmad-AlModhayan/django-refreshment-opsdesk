#!/usr/bin/env python
"""
Lifecycle Stage: CLI Entrypoint -> Django Management Command Dispatch
Production Invariant (🔴): Always targets config.settings consistently across local, CI, and container runs.
Trap Prevented (⚠️): Ambiguous settings module resolution causing silent dev/prod drift.
"""
import os
import sys


def main() -> None:
    os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
    try:
        from django.core.management import execute_from_command_line
    except ImportError as exc:
        raise ImportError(
            "Couldn't import Django. Activate backend/.venv before running manage.py."
        ) from exc
    execute_from_command_line(sys.argv)


if __name__ == "__main__":
    main()
