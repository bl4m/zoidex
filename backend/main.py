import logging

from fastapi import FastAPI, HTTPException, UploadFile, File, Form, Depends
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from fastapi import Request

from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

from sqlmodel import Session, select
from database.database import create_db_and_tables, get_session,supabase
from database.models import Payload
import uuid

from llm import analyse_image
from typing import Optional

logger = logging.getLogger(__name__)

MAX_IMAGE_BYTES = 10 * 1024 * 1024
ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"}
BUCKET_NAME = "images"

@asynccontextmanager
async def lifespan(app: FastAPI):
    create_db_and_tables()
    yield

app = FastAPI(title="Zoidex API", lifespan=lifespan)

limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/v1/health")
def health_check():
    return {"status": "ok"}

@app.post("/api/v1/analyse-image",response_model=Payload)
@limiter.limit("5/minute")
async def analyse(
                request: Request,
                image: UploadFile = File(...),
                latitude: Optional[float] = Form(None),
                longitude: Optional[float] = Form(None),
                session: Session = Depends(get_session)
            ):
    if image.content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(status_code=400, detail="Invalid file type. Please upload an image.")
    image_bytes = await image.read(MAX_IMAGE_BYTES + 1)
    if len(image_bytes) > MAX_IMAGE_BYTES:
        raise HTTPException(status_code=413, detail="Image must be smaller than 10 MB.")
    try:
        data = await analyse_image(image_bytes, image.content_type)

        file_path = f"{uuid.uuid4()}.{image.content_type.split('/')[-1]}"
        
        res = supabase.storage.from_(BUCKET_NAME).upload(
            path=file_path,
            file=image_bytes,
            file_options={"content-type": image.content_type}
        )
        public_url_res = supabase.storage.from_(BUCKET_NAME).get_public_url(file_path)
        public_url = public_url_res if isinstance(public_url_res, str) else public_url_res.get("publicUrl", "")

        payload = Payload(**data, latitude=latitude, longitude=longitude,image_url=public_url)
        session.add(payload)
        session.commit()
        session.refresh(payload)
        return payload
    except HTTPException:
        raise
    except Exception:
        session.rollback()
        logger.exception("Image analysis failed")
        raise HTTPException(status_code=502, detail="Image analysis is temporarily unavailable.")

@app.get("/api/v1/payloads", response_model=list[Payload])
@limiter.limit("5/minute")
def get_payloads(request: Request, count: int = 10, offset: int = 0, session: Session = Depends(get_session)):
    count = min(max(count, 1), 100)
    offset = max(offset, 0)
    try:
        statement = select(Payload).offset(offset).limit(count)
        results = session.exec(statement).all()
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))