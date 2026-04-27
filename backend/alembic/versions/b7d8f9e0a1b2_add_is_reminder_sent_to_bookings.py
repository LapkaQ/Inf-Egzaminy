"""add is_reminder_sent to bookings

Revision ID: b7d8f9e0a1b2
Revises: a9c7e2f3b8d1
Create Date: 2026-04-27 12:25:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'b7d8f9e0a1b2'
down_revision: Union[str, Sequence[str], None] = 'a9c7e2f3b8d1'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column('bookings', sa.Column('is_reminder_sent', sa.Boolean(), nullable=True, server_default='0'))


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('bookings', 'is_reminder_sent')
