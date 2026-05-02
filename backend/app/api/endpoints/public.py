from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.core.storage import get_presigned_download_url
from app.api.deps import get_user_by_api_key
from app.models.user import User
from app.models.resume import Section, MediaItem
from app.schemas.user import PublicUserResponse
from app.schemas.resume import SectionResponse, MediaItemResponse

router = APIRouter(prefix="/public", tags=["public"])


@router.get("/profile", response_model=PublicUserResponse)
async def get_profile(user: User = Depends(get_user_by_api_key)):
    avatar_url = None
    if user.avatar_key:
        avatar_url = get_presigned_download_url(user.avatar_key)
    return PublicUserResponse(
        full_name=user.full_name,
        slug=user.slug,
        headline=user.headline,
        summary=user.summary,
        location=user.location,
        website=user.website,
        linkedin=user.linkedin,
        github=user.github,
        avatar_url=avatar_url,
        section_type_order=user.section_type_order,
    )


@router.get("/sections", response_model=list[SectionResponse])
async def get_sections(
    type: str | None = None,
    user: User = Depends(get_user_by_api_key),
    db: AsyncSession = Depends(get_db),
):
    query = select(Section).where(Section.user_id == user.id, Section.is_visible.is_(True)).order_by(Section.sort_order)
    if type:
        query = query.where(Section.type == type)
    result = await db.execute(query)
    return result.scalars().all()


@router.get("/sections/{section_id}/media", response_model=list[MediaItemResponse])
async def get_section_media(
    section_id: str,
    user: User = Depends(get_user_by_api_key),
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
