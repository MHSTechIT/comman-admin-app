import logging
from sqlalchemy.orm import Session
from src.models.enrollment import Enrollment

logger = logging.getLogger(__name__)


class EnrollmentRepository:
    @staticmethod
    def create_enrollment(db: Session, name: str, phone: str, sugar_level: str = None,
                          age: int = None, location: str = None) -> Enrollment:
        try:
            enrollment = Enrollment(
                name=name.strip(),
                phone=phone.strip(),
                sugar_level=sugar_level.strip() if sugar_level else None,
                age=age,
                location=location.strip() if location else None,
            )
            db.add(enrollment)
            db.commit()
            db.refresh(enrollment)
            logger.info(f"Enrollment saved: {enrollment.id} - {enrollment.name}")
            return enrollment
        except Exception as e:
            db.rollback()
            logger.error(f"Error saving enrollment: {str(e)}")
            raise

    @staticmethod
    def get_all_enrollments(db: Session, limit: int = 100) -> list:
        return db.query(Enrollment).order_by(Enrollment.created_at.desc()).limit(limit).all()
