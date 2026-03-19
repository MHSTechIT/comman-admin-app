from dotenv import load_dotenv
import os

env_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), ".env")
load_dotenv(env_path, override=True)

import logging
from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from src.controller.admin_controller import router as admin_router
from src.database import init_db
from src.models.enrollment import Enrollment

logging.basicConfig(level=logging.INFO)
log = logging.getLogger(__name__)

log.info(f"Loading .env from: {env_path}")
init_db()
log.info("Database initialized")

app = FastAPI(
    title="Chatbot Admin API",
    description="FastAPI backend for chatbot admin: documents, links, enrollment leads",
    version="1.0.0"
)

# CORS: allow localhost (dev) + Vercel/Render production URLs
# Set CORS_ORIGINS=* to allow all, or comma-separated list for specific origins
_cors_origins = os.getenv("CORS_ORIGINS", "")
if _cors_origins.strip() == "*":
    _allow_origins = ["*"]
    _allow_origin_regex = None
    _allow_credentials = False
else:
    _allow_origins = [o.strip() for o in _cors_origins.split(",") if o.strip()]
    _allow_origin_regex = r"https?://(localhost|127\.0\.0\.1|[\w-]+\.vercel\.app|[\w-]+\.onrender\.com)(:\d+)?"
    _allow_credentials = True

app.add_middleware(
    CORSMiddleware,
    allow_origins=_allow_origins if _allow_origins else None,
    allow_origin_regex=None if _allow_origins else _allow_origin_regex,
    allow_credentials=_allow_credentials,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

app.include_router(admin_router)


def _cors_headers(origin=None):
    import re
    localhost_pattern = re.compile(r"http://(localhost|127\.0\.0\.1)(:\d+)?")
    o = origin if (origin and localhost_pattern.match(origin)) else "http://localhost:5173"
    return {
        "Access-Control-Allow-Origin": o,
        "Access-Control-Allow-Credentials": "true",
        "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
    }


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    log.exception("Request failed: %s", exc)
    origin = request.headers.get("origin")
    cors = _cors_headers(origin)
    if isinstance(exc, HTTPException):
        return JSONResponse(status_code=exc.status_code, content={"detail": exc.detail}, headers=cors)
    return JSONResponse(
        status_code=500,
        content={"detail": str(exc), "type": "internal_error"},
        headers=cors,
    )


@app.get("/")
def health_check():
    return {"status": "Chatbot API is running", "port": 8003}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8003)
