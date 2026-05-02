import uuid
from datetime import datetime

from pydantic import BaseModel, EmailStr


class UserResponse(BaseModel):
    id: uuid.UUID
    email: EmailStr
    full_name: str
    slug: str
    headline: str | None
    summary: str | None
    location: str | None
    phone: str | None
    website: str | None
    linkedin: str | None
    github: str | None
    avatar_key: str | None
    section_type_order: str | None
    is_admin: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class UserUpdate(BaseModel):
    full_name: str | None = None
    slug: str | None = None
    headline: str | None = None
    summary: str | None = None
    location: str | None = None
    phone: str | None = None
    website: str | None = None
    linkedin: str | None = None
    github: str | None = None
    section_type_order: str | None = None


class PublicUserResponse(BaseModel):
    full_name: str
    slug: str
    headline: str | None
    summary: str | None
    location: str | None
    website: str | None
    linkedin: str | None
    github: str | None
    avatar_url: str | None = None
    section_type_order: str | None = None

    model_config = {"from_attributes": True}
