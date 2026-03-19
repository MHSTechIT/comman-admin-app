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

app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"http://(localhost|127\.0\.0\.1)(:\d+)?",
    allow_credentials=True,
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
