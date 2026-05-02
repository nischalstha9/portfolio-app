from minio import Minio

from app.core.config import settings

minio_client = Minio(
    settings.minio_endpoint,
    access_key=settings.minio_access_key,
    secret_key=settings.minio_secret_key,
    secure=settings.minio_use_ssl,
)

if settings.minio_external_endpoint:
    minio_presign_client = Minio(
        settings.minio_external_endpoint,
        access_key=settings.minio_access_key,
        secret_key=settings.minio_secret_key,
        secure=False,
    )
else:
    minio_presign_client = minio_client


def ensure_bucket():
    if not minio_client.bucket_exists(settings.minio_bucket):
        minio_client.make_bucket(settings.minio_bucket)


def get_presigned_upload_url(object_name: str, expires_hours: int = 1) -> str:
    from datetime import timedelta
    return minio_presign_client.presigned_put_object(
        settings.minio_bucket, object_name, expires=timedelta(hours=expires_hours)
    )


def get_presigned_download_url(object_name: str, expires_hours: int = 1) -> str:
    from datetime import timedelta
    return minio_presign_client.presigned_get_object(
        settings.minio_bucket, object_name, expires=timedelta(hours=expires_hours)
    )
