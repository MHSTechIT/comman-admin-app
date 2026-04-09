import logging
from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text

from src.database import get_db

log = logging.getLogger(__name__)
router = APIRouter(prefix="/api", tags=["FI-App"])


def _date_range(filter: str):
    """Return (start_date_str, end_date_str) or (None, None) for 'all'."""
    now = datetime.now(timezone.utc)
    today = now.date().isoformat()
    if filter == "today":
        return today, today
    if filter == "weekly":
        return (now - timedelta(days=7)).date().isoformat(), today
    if filter == "monthly":
        return (now - timedelta(days=30)).date().isoformat(), today
    return None, None


def _apply_date_filter(query: str, params: dict, col: str, start: str, end: str) -> str:
    """Append date range WHERE clauses to a query string."""
    if start:
        query += f" AND CAST({col} AS DATE) >= :start_date"
        params["start_date"] = start
    if end:
        query += f" AND CAST({col} AS DATE) <= :end_date"
        params["end_date"] = end
    return query


def _try_tables(db: Session, attempts, build_query_fn):
    """
    Try multiple (table, id_col) pairs; return first successful result list.
    attempts: list of (table, id_col) tuples
    build_query_fn: callable(table, id_col) -> (sql_str, params_dict)
    """
    for table, id_col in attempts:
        try:
            sql, params = build_query_fn(table, id_col)
            rows = db.execute(text(sql), params).mappings().all()
            return [dict(r) for r in rows]
        except Exception as e:
            log.debug("Table %s / col %s failed: %s", table, id_col, e)
            continue
    return []


# ─── Debug: list tables ──────────────────────────────────────────────────────

@router.get("/debug/tables")
def list_tables(db: Session = Depends(get_db)):
    """List all tables in the database and their columns."""
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
    """List users with optional search and pagination."""
    offset = (page - 1) * page_size
    tables = ["profiles_public", "profiles"]
    for table in tables:
        try:
            params: dict = {"limit": page_size, "offset": offset}
            base = f"SELECT * FROM {table}"
            count_base = f"SELECT COUNT(*) FROM {table}"
            where = ""
            if search.strip():
                where = " WHERE name ILIKE :search OR email ILIKE :search OR phone ILIKE :search"
                params["search"] = f"%{search.strip()}%"
            order = " ORDER BY created_at DESC NULLS LAST"
            rows = db.execute(text(base + where + order + " LIMIT :limit OFFSET :offset"), params).mappings().all()
            total = db.execute(text(count_base + where), {k: v for k, v in params.items() if k not in ("limit", "offset")}).scalar() or 0
            return {"data": [dict(r) for r in rows], "total": int(total), "page": page, "page_size": page_size}
        except Exception as e:
            log.debug("list_users table %s failed: %s", table, e)
            continue
    return {"data": [], "total": 0, "page": page, "page_size": page_size}


# ─── Profile ────────────────────────────────────────────────────────────────

@router.get("/users/{user_id}/profile")
def get_user_profile(user_id: str, db: Session = Depends(get_db)):
    attempts = [
        ("profiles_public", "user_id"),
        ("profiles", "id"),
        ("profiles_public", "id"),
        ("profiles", "user_id"),
    ]
    for table, id_col in attempts:
        try:
            row = db.execute(
                text(f"SELECT * FROM {table} WHERE {id_col} = :uid LIMIT 1"),
                {"uid": user_id},
            ).mappings().first()
            if row:
                return {"name": row.get("name") or row.get("full_name") or "User", "data": dict(row)}
        except Exception as e:
            log.debug("Profile table %s failed: %s", table, e)
    return {"name": "User", "data": {}}


# ─── Food Logs ───────────────────────────────────────────────────────────────

@router.get("/users/{user_id}/food-logs")
def get_food_logs(user_id: str, filter: str = "all", db: Session = Depends(get_db)):
    start, end = _date_range(filter)
    date_cols = ["created_at", "date_key", "date", "logged_at"]

    attempts = [
        ("food_logs", "user_id"),
        ("food_logs", "profile_id"),
        ("meal_items", "user_id"),
        ("meal_items", "profile_id"),
        ("meal_logs", "user_id"),
        ("meal_logs", "profile_id"),
        ("food_log", "user_id"),
    ]

    for table, id_col in attempts:
        for date_col in date_cols:
            try:
                params = {"uid": user_id}
                sql = f"SELECT * FROM {table} WHERE {id_col} = :uid"
                sql = _apply_date_filter(sql, params, date_col, start, end)
                sql += f" ORDER BY {date_col} DESC NULLS LAST"
                rows = db.execute(text(sql), params).mappings().all()
                return {"data": [dict(r) for r in rows], "count": len(rows)}
            except Exception as e:
                log.debug("food_logs %s/%s/%s: %s", table, id_col, date_col, e)
                continue

    return {"data": [], "count": 0}


# ─── Drink / Water Logs ──────────────────────────────────────────────────────

@router.get("/users/{user_id}/drink-logs")
def get_drink_logs(user_id: str, filter: str = "all", db: Session = Depends(get_db)):
    start, end = _date_range(filter)
    date_cols = ["date_key", "created_at", "date"]

    attempts = [
        ("daily_logs", "user_id"),
        ("daily_logs", "profile_id"),
        ("water_logs", "user_id"),
        ("water_logs", "profile_id"),
        ("drink_logs", "user_id"),
        ("drink_logs", "profile_id"),
    ]

    for table, id_col in attempts:
        for date_col in date_cols:
            try:
                params = {"uid": user_id}
                sql = f"SELECT * FROM {table} WHERE {id_col} = :uid"
                sql = _apply_date_filter(sql, params, date_col, start, end)
                sql += f" ORDER BY {date_col} DESC NULLS LAST"
                rows = db.execute(text(sql), params).mappings().all()
                return {"data": [dict(r) for r in rows], "count": len(rows)}
            except Exception as e:
                log.debug("drink_logs %s/%s/%s: %s", table, id_col, date_col, e)
                continue

    return {"data": [], "count": 0}


# ─── Sleep Logs ──────────────────────────────────────────────────────────────

@router.get("/users/{user_id}/sleep-logs")
def get_sleep_logs(user_id: str, filter: str = "all", db: Session = Depends(get_db)):
    start, end = _date_range(filter)
    date_cols = ["date_key", "created_at", "date"]

    attempts = [
        ("daily_logs", "user_id"),
        ("daily_logs", "profile_id"),
        ("sleep_logs", "user_id"),
        ("sleep_logs", "profile_id"),
    ]

    for table, id_col in attempts:
        for date_col in date_cols:
            try:
                params = {"uid": user_id}
                sql = f"SELECT * FROM {table} WHERE {id_col} = :uid"
                sql = _apply_date_filter(sql, params, date_col, start, end)
                sql += f" ORDER BY {date_col} DESC NULLS LAST"
                rows = db.execute(text(sql), params).mappings().all()
                return {"data": [dict(r) for r in rows], "count": len(rows)}
            except Exception as e:
                log.debug("sleep_logs %s/%s/%s: %s", table, id_col, date_col, e)
                continue

    return {"data": [], "count": 0}


# ─── Daily Logs (water + sleep combined) ────────────────────────────────────

@router.get("/users/{user_id}/daily-logs")
def get_daily_logs(user_id: str, db: Session = Depends(get_db)):
    attempts = [
        ("daily_logs", "user_id"),
        ("daily_logs", "profile_id"),
    ]
    for table, id_col in attempts:
        try:
            rows = db.execute(
                text(f"SELECT * FROM {table} WHERE {id_col} = :uid ORDER BY created_at DESC NULLS LAST"),
                {"uid": user_id},
            ).mappings().all()
            return {"data": [dict(r) for r in rows], "count": len(rows)}
        except Exception as e:
            log.debug("daily_logs %s/%s: %s", table, id_col, e)
    return {"data": [], "count": 0}


# ─── Courses ─────────────────────────────────────────────────────────────────

@router.get("/users/{user_id}/courses")
def get_courses(user_id: str, db: Session = Depends(get_db)):
    attempts = [
        ("user_courses", "user_id"),
        ("user_courses", "profile_id"),
        ("courses", "user_id"),
        ("courses", "profile_id"),
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
        ("reports", "profile_id"),
        ("user_reports", "user_id"),
        ("user_reports", "profile_id"),
        ("health_reports", "user_id"),
        ("health_reports", "profile_id"),
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
            continue
    return {"data": [], "count": 0}
