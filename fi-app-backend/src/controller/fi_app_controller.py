import logging
from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text

from src.database import get_db

log = logging.getLogger(__name__)
router = APIRouter(prefix="/api", tags=["FI-App"])

# Actual AI_FI schema (discovered via /debug/tables):
# profiles       : user_id, name, mobile, email, age, weight_kg, height_cm, chronic_condition, gender, goal, updated_at
# food_logs      : id, user_id, meal_label, product_name, energy, ..., created_at
# meal_items     : id, food_log_id, product_name, ..., created_at
# daily_logs     : user_id, date_key, water_ml, sleep_hours, step_count, updated_at
# users          : id, email, password_hash, ..., created_at
# user_settings  : user_id, ..., updated_at


def _date_range(filter: str):
    now = datetime.now(timezone.utc)
    today = now.date().isoformat()
    if filter == "today":
        return today, today
    if filter == "weekly":
        return (now - timedelta(days=7)).date().isoformat(), today
    if filter == "monthly":
        return (now - timedelta(days=30)).date().isoformat(), today
    return None, None


def _safe_query(db, sql, params):
    """Run query, return list of dicts or [] on error."""
    try:
        rows = db.execute(text(sql), params).mappings().all()
        return [dict(r) for r in rows]
    except Exception as e:
        log.debug("Query failed: %s | %s", sql[:80], e)
        return None  # None = try next


# ─── Debug: list tables ──────────────────────────────────────────────────────

@router.get("/debug/tables")
def list_tables(db: Session = Depends(get_db)):
    try:
        rows = db.execute(text(
            "SELECT table_name FROM information_schema.tables "
            "WHERE table_schema = 'public' ORDER BY table_name"
        )).fetchall()
        tables = [r[0] for r in rows]
        detail = {}
        for t in tables:
            try:
                cols = db.execute(text(
                    f"SELECT column_name, data_type FROM information_schema.columns "
                    f"WHERE table_schema='public' AND table_name='{t}' ORDER BY ordinal_position"
                )).fetchall()
                cnt = db.execute(text(f"SELECT COUNT(*) FROM {t}")).scalar()
                detail[t] = {"columns": [c[0] for c in cols], "row_count": cnt}
            except Exception:
                detail[t] = {"error": "could not inspect"}
        return {"tables": tables, "detail": detail}
    except Exception as e:
        return {"error": str(e)}


# ─── Users List ─────────────────────────────────────────────────────────────

@router.get("/users")
def list_users(page: int = 1, page_size: int = 10, search: str = "", db: Session = Depends(get_db)):
    offset = (page - 1) * page_size

    # Known tables, preferred order. profiles uses updated_at; users uses created_at.
    attempts = [
        ("profiles", ["updated_at", "user_id"], "user_id"),
        ("profiles_public", ["created_at", "updated_at", "id"], "user_id"),
        ("users", ["created_at", "id"], "id"),
    ]

    for table, order_cols, id_col in attempts:
        for order_col in order_cols:
            try:
                params: dict = {"limit": page_size, "offset": offset}
                where = ""
                if search.strip():
                    where = " WHERE name ILIKE :search OR email ILIKE :search OR mobile ILIKE :search OR phone ILIKE :search"
                    params["search"] = f"%{search.strip()}%"

                sql = f"SELECT * FROM {table}{where} ORDER BY {order_col} DESC NULLS LAST LIMIT :limit OFFSET :offset"
                count_sql = f"SELECT COUNT(*) FROM {table}" + (where if where else "")
                count_params = {k: v for k, v in params.items() if k not in ("limit", "offset")}

                rows = db.execute(text(sql), params).mappings().all()
                total = db.execute(text(count_sql), count_params).scalar() or 0
                return {"data": [dict(r) for r in rows], "total": int(total), "page": page, "page_size": page_size}
            except Exception as e:
                log.debug("list_users %s/%s failed: %s", table, order_col, e)
                continue

    return {"data": [], "total": 0, "page": page, "page_size": page_size}


# ─── Profile ────────────────────────────────────────────────────────────────

@router.get("/users/{user_id}/profile")
def get_user_profile(user_id: str, db: Session = Depends(get_db)):
    # profiles.user_id is the PK; users.id is the PK
    attempts = [
        ("profiles", "user_id"),
        ("profiles_public", "user_id"),
        ("profiles", "id"),
        ("users", "id"),
    ]
    for table, id_col in attempts:
        try:
            row = db.execute(
                text(f"SELECT * FROM {table} WHERE {id_col} = :uid LIMIT 1"),
                {"uid": user_id},
            ).mappings().first()
            if row:
                r = dict(row)
                name = r.get("name") or r.get("full_name") or r.get("email") or "User"
                return {"name": name, "data": r}
        except Exception as e:
            log.debug("Profile %s/%s failed: %s", table, id_col, e)
    return {"name": "User", "data": {}}


# ─── Food Logs ───────────────────────────────────────────────────────────────

@router.get("/users/{user_id}/food-logs")
def get_food_logs(user_id: str, filter: str = "all", db: Session = Depends(get_db)):
    start, end = _date_range(filter)

    # food_logs has user_id + created_at; try with meal_items join
    for id_col in ["user_id"]:
        try:
            params: dict = {"uid": user_id}
            sql = f"SELECT * FROM food_logs WHERE {id_col} = :uid"
            if start:
                sql += " AND CAST(created_at AS DATE) >= :start"
                params["start"] = start
            if end:
                sql += " AND CAST(created_at AS DATE) <= :end"
                params["end"] = end
            sql += " ORDER BY created_at DESC NULLS LAST"
            rows = db.execute(text(sql), params).mappings().all()
            return {"data": [dict(r) for r in rows], "count": len(rows)}
        except Exception as e:
            log.debug("food_logs/%s: %s", id_col, e)

    return {"data": [], "count": 0}


# ─── Drink / Water Logs ──────────────────────────────────────────────────────

@router.get("/users/{user_id}/drink-logs")
def get_drink_logs(user_id: str, filter: str = "all", db: Session = Depends(get_db)):
    start, end = _date_range(filter)
    # daily_logs uses date_key (DATE string) and updated_at
    for id_col in ["user_id"]:
        try:
            params: dict = {"uid": user_id}
            sql = "SELECT * FROM daily_logs WHERE user_id = :uid"
            if start:
                sql += " AND date_key >= :start"
                params["start"] = start
            if end:
                sql += " AND date_key <= :end"
                params["end"] = end
            sql += " ORDER BY date_key DESC NULLS LAST"
            rows = db.execute(text(sql), params).mappings().all()
            return {"data": [dict(r) for r in rows], "count": len(rows)}
        except Exception as e:
            log.debug("drink_logs: %s", e)

    return {"data": [], "count": 0}


# ─── Sleep Logs ──────────────────────────────────────────────────────────────

@router.get("/users/{user_id}/sleep-logs")
def get_sleep_logs(user_id: str, filter: str = "all", db: Session = Depends(get_db)):
    start, end = _date_range(filter)
    # Same daily_logs table — sleep_hours column
    try:
        params: dict = {"uid": user_id}
        sql = "SELECT * FROM daily_logs WHERE user_id = :uid"
        if start:
            sql += " AND date_key >= :start"
            params["start"] = start
        if end:
            sql += " AND date_key <= :end"
            params["end"] = end
        sql += " ORDER BY date_key DESC NULLS LAST"
        rows = db.execute(text(sql), params).mappings().all()
        return {"data": [dict(r) for r in rows], "count": len(rows)}
    except Exception as e:
        log.debug("sleep_logs: %s", e)

    return {"data": [], "count": 0}


# ─── Daily Logs ──────────────────────────────────────────────────────────────

@router.get("/users/{user_id}/daily-logs")
def get_daily_logs(user_id: str, db: Session = Depends(get_db)):
    try:
        rows = db.execute(
            text("SELECT * FROM daily_logs WHERE user_id = :uid ORDER BY date_key DESC NULLS LAST"),
            {"uid": user_id},
        ).mappings().all()
        return {"data": [dict(r) for r in rows], "count": len(rows)}
    except Exception as e:
        log.debug("daily_logs: %s", e)
    return {"data": [], "count": 0}


# ─── Courses ─────────────────────────────────────────────────────────────────

@router.get("/users/{user_id}/courses")
def get_courses(user_id: str, db: Session = Depends(get_db)):
    attempts = [
        ("user_courses", "user_id"),
        ("courses", "user_id"),
        ("enrolled_courses", "user_id"),
    ]
    for table, id_col in attempts:
        try:
            rows = db.execute(
                text(f"SELECT * FROM {table} WHERE {id_col} = :uid ORDER BY created_at DESC NULLS LAST"),
                {"uid": user_id},
            ).mappings().all()
            return {"data": [dict(r) for r in rows], "count": len(rows)}
        except Exception as e:
            log.debug("courses %s/%s: %s", table, id_col, e)
    return {"data": [], "count": 0}


# ─── Reports ─────────────────────────────────────────────────────────────────

@router.get("/users/{user_id}/reports")
def get_reports(user_id: str, db: Session = Depends(get_db)):
    attempts = [
        ("reports", "user_id"),
        ("user_reports", "user_id"),
        ("health_reports", "user_id"),
    ]
    for table, id_col in attempts:
        try:
            rows = db.execute(
                text(f"SELECT * FROM {table} WHERE {id_col} = :uid ORDER BY created_at DESC NULLS LAST"),
                {"uid": user_id},
            ).mappings().all()
            return {"data": [dict(r) for r in rows], "count": len(rows)}
        except Exception as e:
            log.debug("reports %s/%s: %s", table, id_col, e)
    return {"data": [], "count": 0}
