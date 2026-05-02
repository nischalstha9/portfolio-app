import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.resume import Section
from app.schemas.resume import SectionCreate, SectionUpdate, SectionResponse, SectionReorderRequest

router = APIRouter(prefix="/sections", tags=["sections"])


@router.get("/", response_model=list[SectionResponse])
async def list_sections(
    type: str | None = None,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    query = select(Section).where(Section.user_id == user.id).order_by(Section.sort_order)
    if type:
        query = query.where(Section.type == type)
    result = await db.execute(query)
    return result.scalars().all()


@router.post("/", response_model=SectionResponse, status_code=status.HTTP_201_CREATED)
async def create_section(
    body: SectionCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    section = Section(user_id=user.id, **body.model_dump())
    db.add(section)
    await db.commit()
    await db.refresh(section)
    return section


@router.get("/{section_id}", response_model=SectionResponse)
async def get_section(
    section_id: uuid.UUID,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Section).where(Section.id == section_id, Section.user_id == user.id))
    section = result.scalar_one_or_none()
    if not section:
        raise HTTPException(status_code=404, detail="Section not found")
    return section


@router.patch("/{section_id}", response_model=SectionResponse)
async def update_section(
    section_id: uuid.UUID,
    body: SectionUpdate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Section).where(Section.id == section_id, Section.user_id == user.id))
    section = result.scalar_one_or_none()
    if not section:
        raise HTTPException(status_code=404, detail="Section not found")

    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(section, field, value)
    await db.commit()
    await db.refresh(section)
    return section


@router.put("/reorder", response_model=list[SectionResponse])
async def reorder_sections(
    body: SectionReorderRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    ids = [item.id for item in body.items]
    result = await db.execute(select(Section).where(Section.id.in_(ids), Section.user_id == user.id))
    sections = {s.id: s for s in result.scalars().all()}

    if len(sections) != len(ids):
        raise HTTPException(status_code=400, detail="Some sections not found or not owned by you")

    for item in body.items:
        sections[item.id].sort_order = item.sort_order

    await db.commit()
    result = await db.execute(select(Section).where(Section.user_id == user.id).order_by(Section.sort_order))
    return result.scalars().all()


@router.delete("/{section_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_section(
    section_id: uuid.UUID,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Section).where(Section.id == section_id, Section.user_id == user.id))
    section = result.scalar_one_or_none()
    if not section:
        raise HTTPException(status_code=404, detail="Section not found")
    await db.delete(section)
    await db.commit()
