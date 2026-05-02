from fastapi import APIRouter, HTTPException
from fastapi.responses import RedirectResponse

from app.core.storage import get_presigned_download_url

router = APIRouter(prefix="/cdn", tags=["cdn"])


@router.get("/{object_key:path}")
async def cdn_redirect(object_key: str):
    if not object_key or ".." in object_key:
        raise HTTPException(status_code=400, detail="Invalid object key")
    try:
        url = get_presigned_download_url(object_key)
    except Exception:
        raise HTTPException(status_code=404, detail="Object not found")
    return RedirectResponse(
        url=url,
        status_code=307,
        headers={"Cache-Control": "private, max-age=3000"},
    )
