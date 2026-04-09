from dotenv import load_dotenv
import os

env_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), ".env")
load_dotenv(env_path, override=True)

import logging
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from src.controller.fi_app_controller import router as fi_app_router

logging.basicConfig(level=logging.INFO)
log = logging.getLogger(__name__)

log.info(f"Loading .env from: {env_path}")

app = FastAPI(
    title="FI-App API",
    description="FastAPI backend for FI-App: user profiles, food logs, drink logs, sleep logs, reports",
    version="1.0.0",
)

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
)

app.include_router(fi_app_router)


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    log.exception("Request failed: %s", exc)
    return JSONResponse(
        status_code=500,
        content={"detail": str(exc), "type": "internal_error"},
    )


@app.get("/")
def health_check():
    return {"status": "FI-App API is running", "port": 8004}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8004)
