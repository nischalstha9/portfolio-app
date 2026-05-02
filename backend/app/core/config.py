from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str = "postgresql+asyncpg://portfolio:portfolio_dev@db:5432/portfolio"
    database_url_sync: str = "postgresql://portfolio:portfolio_dev@db:5432/portfolio"
    secret_key: str = "dev-secret-key-change-in-production"
    access_token_expire_minutes: int = 30
    refresh_token_expire_days: int = 7

    minio_endpoint: str = "minio:9000"
    minio_external_endpoint: str = ""
    minio_access_key: str = "minioadmin"
    minio_secret_key: str = "minioadmin"
    minio_bucket: str = "portfolio"
    minio_use_ssl: bool = False

    model_config = {"env_file": ".env"}


settings = Settings()
