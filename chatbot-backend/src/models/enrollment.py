from sqlalchemy import Column, Integer, String, DateTime, func
from src.database import Base


class Enrollment(Base):
    __tablename__ = "enrollments"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False, index=True)
    email = Column(String(255), nullable=True, index=True)
    phone = Column(String(20), nullable=False, index=True)
    sugar_level = Column(String(50), nullable=True)
    age = Column(Integer, nullable=True)
    location = Column(String(255), nullable=True)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
