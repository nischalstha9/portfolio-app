from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.api.deps import get_current_user, get_admin_user
from app.models.user import User
from app.models.resume import Section
from app.schemas.user import UserResponse, UserUpdate, PublicUserResponse
from app.schemas.resume import SectionResponse
from app.core.storage import get_presigned_download_url

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/me", response_model=UserResponse)
async def get_me(user: User = Depends(get_current_user)):
    return user


@router.patch("/me", response_model=UserResponse)
async def update_me(
    body: UserUpdate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    update_data = body.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(user, field, value)
    await db.commit()
    await db.refresh(user)
    return user


@router.get("/", response_model=list[UserResponse])
async def list_users(
    admin: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(User).order_by(User.created_at.desc()))
    return result.scalars().all()


@router.get("/profile/{slug}", response_model=PublicUserResponse)
async def get_public_profile(slug: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.slug == slug, User.is_active.is_(True)))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

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


@router.get("/profile/{slug}/sections", response_model=list[SectionResponse])
async def get_public_sections(slug: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.slug == slug, User.is_active.is_(True)))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    result = await db.execute(
        select(Section).where(Section.user_id == user.id, Section.is_visible.is_(True)).order_by(Section.sort_order)
    )
    return result.scalars().all()
