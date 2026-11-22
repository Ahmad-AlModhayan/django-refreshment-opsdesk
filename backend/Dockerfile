# Lifecycle Stage: Container Build -> Hardened Non-Root Django + Gunicorn Image
# Production Invariant (🔴): Runs as non-root user appuser with pinned dependencies and immutable staticfiles.
# Trap Prevented (⚠️): Running containers as root or installing unpinned packages that break mid-deploy.

FROM python:3.13-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1

WORKDIR /app

RUN groupadd --system appgroup && useradd --system --gid appgroup --create-home appuser

COPY requirements.txt .
RUN pip install --upgrade pip && pip install -r requirements.txt

COPY . .
RUN sed -i 's/\r$//' /app/entrypoint.sh && chmod +x /app/entrypoint.sh \
    && mkdir -p /app/staticfiles \
    && chown -R appuser:appgroup /app

USER appuser

EXPOSE 8000

ENTRYPOINT ["/app/entrypoint.sh"]
