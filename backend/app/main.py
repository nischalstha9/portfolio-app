from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.storage import ensure_bucket
from app.api.endpoints import auth, users, sections, media, api_keys, public, admin, cdn


@asynccontextmanager
async def lifespan(app: FastAPI):
    try:
        ensure_bucket()
    except Exception:
        pass
    yield


app = FastAPI(title="Portfolio Resume Server", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api")
app.include_router(users.router, prefix="/api")
app.include_router(sections.router, prefix="/api")
app.include_router(media.router, prefix="/api")
app.include_router(api_keys.router, prefix="/api")
app.include_router(public.router, prefix="/api")
app.include_router(admin.router, prefix="/api")
app.include_router(cdn.router, prefix="/api")


@app.get("/api/health")
async def health():
    return {"status": "ok"}
