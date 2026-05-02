import uuid
from datetime import datetime

from pydantic import BaseModel


class SectionCreate(BaseModel):
    type: str
    title: str
    subtitle: str | None = None
    description: str | None = None
    start_date: str | None = None
    end_date: str | None = None
    is_current: bool = False
    url: str | None = None
    sort_order: int = 0
    is_visible: bool = True
    metadata_json: str | None = None


class SectionUpdate(BaseModel):
    type: str | None = None
    title: str | None = None
    subtitle: str | None = None
    description: str | None = None
    start_date: str | None = None
    end_date: str | None = None
    is_current: bool | None = None
    url: str | None = None
    sort_order: int | None = None
    is_visible: bool | None = None
    metadata_json: str | None = None


class SectionResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    type: str
    title: str
    subtitle: str | None
    description: str | None
    start_date: str | None
    end_date: str | None
    is_current: bool
    url: str | None
    sort_order: int
    is_visible: bool
    metadata_json: str | None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class SectionReorderItem(BaseModel):
    id: uuid.UUID
    sort_order: int


class SectionReorderRequest(BaseModel):
    items: list[SectionReorderItem]


class MediaUploadRequest(BaseModel):
    filename: str
    content_type: str


class MediaUploadResponse(BaseModel):
    id: uuid.UUID
    upload_url: str
    object_key: str


class MediaItemResponse(BaseModel):
    id: uuid.UUID
    section_id: uuid.UUID
    object_key: str
    filename: str
    content_type: str
    sort_order: int
    download_url: str | None = None
    created_at: datetime

    model_config = {"from_attributes": True}


class ApiKeyCreate(BaseModel):
    name: str


class ApiKeyResponse(BaseModel):
    id: uuid.UUID
    name: str
    key: str
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}
