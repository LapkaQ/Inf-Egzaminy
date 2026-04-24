"""add payments table and awaiting_payment status

Revision ID: a9c7e2f3b8d1
Revises: f6af366d7b70
Create Date: 2026-04-24 10:30:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a9c7e2f3b8d1'
down_revision: Union[str, Sequence[str], None] = 'f6af366d7b70'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # 1. Utwórz tabelę payments
    op.create_table('payments',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('booking_id', sa.Integer(), nullable=False),
        sa.Column('amount', sa.Integer(), nullable=False),
        sa.Column('status', sa.Enum('pending', 'completed', 'failed', 'refunded', name='paymentstatus'), nullable=True),
        sa.Column('payment_method', sa.String(length=50), nullable=True),
        sa.Column('transaction_id', sa.String(length=128), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('paid_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['booking_id'], ['bookings.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('transaction_id')
    )
    op.create_index(op.f('ix_payments_id'), 'payments', ['id'], unique=False)

    # 2. Dodaj awaiting_payment do BookingStatus enum (MySQL)
    # MySQL wymaga ALTER TABLE ... MODIFY COLUMN
    op.execute("ALTER TABLE bookings MODIFY COLUMN status ENUM('pending','awaiting_payment','confirmed','cancelled') DEFAULT 'awaiting_payment'")


def downgrade() -> None:
    """Downgrade schema."""
    # Przywróć enum bez awaiting_payment
    op.execute("UPDATE bookings SET status = 'pending' WHERE status = 'awaiting_payment'")
    op.execute("ALTER TABLE bookings MODIFY COLUMN status ENUM('pending','confirmed','cancelled') DEFAULT 'pending'")

    op.drop_index(op.f('ix_payments_id'), table_name='payments')
    op.drop_table('payments')
