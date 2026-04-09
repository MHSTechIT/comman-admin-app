from dotenv import load_dotenv
import os

env_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), ".env")
load_dotenv(env_path, override=True)

import logging
from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles

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

os.makedirs("uploads", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

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


@app.get("/gcp-metrics")
async def get_gcp_metrics():
    """Fetch real Google Cloud Monitoring metrics for the Generative Language API."""
    import json
    import base64
    import httpx
    from datetime import datetime, timedelta, timezone

    sa_json_str = os.getenv("GCP_SERVICE_ACCOUNT_JSON", "")
    if not sa_json_str:
        raise HTTPException(status_code=503, detail="GCP_SERVICE_ACCOUNT_JSON not configured")

    # Support both raw JSON and base64-encoded JSON
    try:
        sa_info = json.loads(sa_json_str)
    except Exception:
        try:
            sa_info = json.loads(base64.b64decode(sa_json_str).decode())
        except Exception:
            raise HTTPException(status_code=500, detail="Failed to parse GCP service account JSON")

    # Obtain a short-lived OAuth2 access token via the service account
    try:
        import google.oauth2.service_account
        import google.auth.transport.requests

        credentials = google.oauth2.service_account.Credentials.from_service_account_info(
            sa_info,
            scopes=["https://www.googleapis.com/auth/monitoring.read"]
        )
        auth_request = google.auth.transport.requests.Request()
        credentials.refresh(auth_request)
        token = credentials.token
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Auth error: {str(e)}")

    project_id = sa_info.get("project_id", "")
    now = datetime.now(timezone.utc)
    start_24h = now - timedelta(hours=24)
    start_30d = now - timedelta(days=30)
    base_url = f"https://monitoring.googleapis.com/v3/projects/{project_id}/timeSeries"
    headers = {"Authorization": f"Bearer {token}"}

    metric_types = [
        "generativelanguage.googleapis.com/generate_content_requests",
        "generativelanguage.googleapis.com/generate_content_input_token_count",
        "generativelanguage.googleapis.com/generate_content_output_token_count",
    ]

    results = {"project_id": project_id, "metrics": {}, "errors": {}}

    async with httpx.AsyncClient(timeout=15.0) as client:
        for metric_type in metric_types:
            short_name = metric_type.split("/")[-1]
            try:
                resp = await client.get(base_url, headers=headers, params={
                    "filter": f'metric.type="{metric_type}"',
                    "interval.startTime": start_24h.strftime("%Y-%m-%dT%H:%M:%SZ"),
                    "interval.endTime": now.strftime("%Y-%m-%dT%H:%M:%SZ"),
                    "aggregation.alignmentPeriod": "86400s",
                    "aggregation.perSeriesAligner": "ALIGN_SUM",
                    "aggregation.crossSeriesReducer": "REDUCE_SUM",
                })
                data = resp.json()
                time_series = data.get("timeSeries", [])
                total = 0
                series_list = []
                for ts in time_series:
                    labels = ts.get("metric", {}).get("labels", {})
                    resource_labels = ts.get("resource", {}).get("labels", {})
                    points = ts.get("points", [])
                    val = 0
                    for p in points:
                        v = p.get("value", {})
                        val += v.get("int64Value", 0) or v.get("doubleValue", 0) or 0
                    total += val
                    series_list.append({
                        "labels": {**labels, **resource_labels},
                        "value": val
                    })
                results["metrics"][short_name] = {
                    "total_24h": int(total),
                    "series": series_list
                }
            except Exception as e:
                results["errors"][short_name] = str(e)

    return results


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8003)
