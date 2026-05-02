import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.storage import get_presigned_upload_url, get_presigned_download_url
from app.api.deps import get_current_user
from app.models.user import User
from app.models.resume import Section, MediaItem
from app.schemas.resume import MediaUploadRequest, MediaUploadResponse, MediaItemResponse

router = APIRouter(prefix="/media", tags=["media"])


@router.post("/{section_id}/upload", response_model=MediaUploadResponse, status_code=status.HTTP_201_CREATED)
async def request_upload(
    section_id: uuid.UUID,
    body: MediaUploadRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Section).where(Section.id == section_id, Section.user_id == user.id))
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Section not found")

    object_key = f"{user.id}/{section_id}/{uuid.uuid4()}/{body.filename}"
    upload_url = get_presigned_upload_url(object_key)

    media = MediaItem(
        section_id=section_id,
        object_key=object_key,
        filename=body.filename,
        content_type=body.content_type,
    )
    db.add(media)
    await db.commit()
    await db.refresh(media)

    return MediaUploadResponse(id=media.id, upload_url=upload_url, object_key=object_key)


@router.get("/{section_id}", response_model=list[MediaItemResponse])
async def list_media(
    section_id: uuid.UUID,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Section).where(Section.id == section_id, Section.user_id == user.id))
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Section not found")

    result = await db.execute(
        select(MediaItem).where(MediaItem.section_id == section_id).order_by(MediaItem.sort_order)
    )
    items = result.scalars().all()
    response = []
    for item in items:
        download_url = get_presigned_download_url(item.object_key)
        resp = MediaItemResponse.model_validate(item)
        resp.download_url = download_url
        response.append(resp)
    return response


@router.delete("/{media_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_media(
    media_id: uuid.UUID,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(MediaItem).where(MediaItem.id == media_id))
    media = result.scalar_one_or_none()
    if not media:
        raise HTTPException(status_code=404, detail="Media not found")

    result = await db.execute(select(Section).where(Section.id == media.section_id, Section.user_id == user.id))
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=403, detail="Not authorized")

    await db.delete(media)
    await db.commit()
