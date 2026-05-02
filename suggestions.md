# Suggestions for Portfolio/Resume Server

## README Fixes
- Use `- [ ]` (with a space) instead of `- []` for proper markdown checkbox rendering.

## Architecture & Planning

1. **Auth strategy** — Multi-user support needs an auth mechanism. Recommend JWT-based auth with refresh tokens via FastAPI's security utilities.

2. **API design** — Add a rough endpoint map early (`/api/auth`, `/api/resumes`, `/api/sections`, `/api/media`, `/api/keys`) to guide backend structure.

3. **Object storage** — Use MinIO (S3-compatible, self-hosted) for Docker-based development. It maps cleanly to AWS S3 in production.

4. **Resume parsing** — PDF parsing is unreliable with rule-based approaches. Use an LLM (Claude API) to extract structured data from uploaded resumes. Far more robust for varied formats.

5. **Database migrations** — Commit to SQLAlchemy + Alembic. It's the standard for FastAPI + PostgreSQL and has excellent ecosystem support.

6. **CI/CD & testing** — Add pytest for backend, Vitest/Playwright for frontend, and a GitHub Actions pipeline.

7. **Custom domain / CNAME** — This implies multi-tenant hosting with wildcard SSL and tenant routing via nginx. Treat as a later phase so it doesn't block core features.

## Recommended Build Order

1. Docker Compose skeleton (Postgres, FastAPI, Next.js, MinIO, nginx)
2. User model + JWT auth
3. Resume sections CRUD API
4. User panel (Next.js) for editing
5. API key generation for read-only access
6. Media uploads via presigned URLs
7. PDF resume parser (LLM-based)
8. Admin panel
9. Public frontend + custom domain support
