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
    if engine is not None:
        Base.metadata.create_all(bind=engine)
    else:
        log.warning("Skipping init_db — no database engine")
