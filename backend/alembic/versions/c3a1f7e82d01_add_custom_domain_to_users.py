"""add custom_domain to users

Revision ID: c3a1f7e82d01
Revises: b8497a1a89eb
Create Date: 2026-05-27 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'c3a1f7e82d01'
down_revision: Union[str, None] = 'b8497a1a89eb'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('users', sa.Column('custom_domain', sa.String(255), nullable=True))
    op.create_index('ix_users_custom_domain', 'users', ['custom_domain'], unique=True)


def downgrade() -> None:
    op.drop_index('ix_users_custom_domain', table_name='users')
    op.drop_column('users', 'custom_domain')
