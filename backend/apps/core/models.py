"""
Lifecycle Stage: Domain Model Layer -> Shared Abstract Base Models
Production Invariant (🔴): Every domain table inherits UTC audit timestamps without duplicating columns or migrations.
Trap Prevented (⚠️): Naive local timestamps or inconsistent created_at/updated_at schemas across apps.
"""
from django.db import models


class TimeStampedModel(models.Model):
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True
