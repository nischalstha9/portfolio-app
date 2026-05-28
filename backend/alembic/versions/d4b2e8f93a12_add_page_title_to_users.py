"""add page_title to users

Revision ID: d4b2e8f93a12
Revises: c3a1f7e82d01
Create Date: 2026-05-28 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'd4b2e8f93a12'
down_revision: Union[str, None] = 'c3a1f7e82d01'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('users', sa.Column('page_title', sa.String(255), nullable=True))


def downgrade() -> None:
    op.drop_column('users', 'page_title')
