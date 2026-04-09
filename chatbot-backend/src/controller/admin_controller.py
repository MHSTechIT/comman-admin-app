import os
import logging
from fastapi import APIRouter, File, UploadFile, Form, HTTPException
from pydantic import BaseModel
from src.repository.admin_repo import AdminRepository
from src.repository.enrollment_repo import EnrollmentRepository
from src.database import SessionLocal
from src.services.DocumentIngestionService import DocumentIngestionService

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/admin", tags=["Admin"])

admin_repo = AdminRepository()
try:
    ingestion_service = DocumentIngestionService()
except Exception as e:
    logger.warning(f"Document ingestion service not available: {str(e)}")
    ingestion_service = None


class LinkRequest(BaseModel):
    title: str
    url: str


class EnrollmentRequest(BaseModel):
    name: str
    phone: str
    sugar_level: str = None
    age: int = None
    location: str = None


@router.post("/upload")
async def upload_document(file: UploadFile = File(...), title: str = Form(...)):
    """Upload a document (PDF, TXT, DOCX)"""
    if not title.strip():
        raise HTTPException(status_code=400, detail="Title required")
    try:
        upload_dir = "uploads"
        os.makedirs(upload_dir, exist_ok=True)
        file_path = os.path.join(upload_dir, file.filename)
        content = await file.read()
        with open(file_path, "wb") as f:
            f.write(content)
        logger.info(f"File uploaded: {file.filename}")
        doc_id = admin_repo.add_document(
            title=title,
            file_name=file.filename,
            file_path=file_path,
            type="document"
        )
        if ingestion_service:
            try:
                ingestion_service.ingest_document(
                    file_path=file_path,
                    file_name=file.filename,
                    title=title,
                    doc_type="document"
                )
            except Exception as e:
                logger.error(f"Error indexing document: {str(e)}")
        return {"success": True, "id": doc_id, "message": "Document uploaded"}
    except Exception as e:
        logger.error(f"Upload error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/add-link")
async def add_link(request: LinkRequest):
    """Add a reference link"""
    if not request.title.strip() or not request.url.strip():
        raise HTTPException(status_code=400, detail="Title and URL required")
    try:
        doc_id = admin_repo.add_document(
            title=request.title,
            url=request.url,
            type="link"
        )
        if ingestion_service:
            try:
                ingestion_service.ingest_link(url=request.url, title=request.title)
            except Exception as e:
                logger.error(f"Error indexing link: {str(e)}")
        logger.info(f"Link added: {request.title}")
        return {"success": True, "id": doc_id, "message": "Link added"}
    except Exception as e:
        logger.error(f"Link error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/documents")
async def get_documents():
    """Get all uploaded documents and links"""
    try:
        documents = admin_repo.get_all_documents()
        return {"success": True, "documents": documents, "count": len(documents)}
    except Exception as e:
        logger.error(f"Error fetching documents: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/documents/{doc_id}")
async def delete_document(doc_id: str):
    """Delete a document or link"""
    try:
        success = admin_repo.delete_document(doc_id)
        if success:
            return {"success": True, "message": "Document deleted"}
        raise HTTPException(status_code=404, detail="Document not found")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Delete error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/documents/search")
async def search_documents(query: str):
    """Search documents by title"""
    try:
        results = admin_repo.search_documents(query)
        return {"success": True, "results": results}
    except Exception as e:
        logger.error(f"Search error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/submit-enrollment")
async def submit_enrollment(request: EnrollmentRequest):
    """Submit enrollment form"""
    db = SessionLocal()
    try:
        if not request.name.strip() or not request.phone.strip():
            raise HTTPException(status_code=400, detail="Name and phone are required")
        enrollment = EnrollmentRepository.create_enrollment(
            db,
            name=request.name.strip(),
            phone=request.phone.strip(),
            sugar_level=request.sugar_level.strip() if request.sugar_level else None,
            age=request.age,
            location=request.location.strip() if request.location else None,
        )
        return {
            "success": True,
            "id": str(enrollment.id),
            "message": "Enrollment submitted successfully"
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Enrollment error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        db.close()


@router.get("/leads")
async def get_enrollment_leads():
    """Get all enrollment leads"""
    db = SessionLocal()
    try:
        enrollments = EnrollmentRepository.get_all_enrollments(db)
        leads = [
            {
                "id": str(e.id),
                "name": e.name,
                "phone": e.phone,
                "sugar_level": e.sugar_level or "",
                "age": e.age,
                "location": e.location or "",
                "created_at": e.created_at.isoformat() if hasattr(e.created_at, "isoformat") else str(e.created_at)
            }
            for e in enrollments
        ]
        return {"success": True, "leads": leads, "count": len(leads)}
    except Exception as e:
        logger.error(f"Error fetching leads: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        db.close()
