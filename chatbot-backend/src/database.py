import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

import logging

log = logging.getLogger(__name__)

DATABASE_URL = os.getenv("DB_CONNECTION")

engine = None
SessionLocal = None
Base = declarative_base()

if DATABASE_URL:
    engine = create_engine(
        DATABASE_URL,
        pool_pre_ping=True,
        pool_recycle=3600,
        echo=False
    )
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
else:
    log.warning("DB_CONNECTION not set — database features disabled")


def get_db():
    if SessionLocal is None:
        raise RuntimeError("Database not configured (DB_CONNECTION not set)")
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    if engine is None:
        log.warning("Skipping init_db — no database engine")
        return
    from sqlalchemy import text
    Base.metadata.create_all(bind=engine)
    # Add columns that may be missing from older schema
    with engine.connect() as conn:
        for stmt in [
            "ALTER TABLE enrollments ADD COLUMN IF NOT EXISTS age INTEGER",
            "ALTER TABLE enrollments ADD COLUMN IF NOT EXISTS location VARCHAR(255)",
        ]:
            try:
                conn.execute(text(stmt))
            except Exception:
                pass
        conn.commit()
