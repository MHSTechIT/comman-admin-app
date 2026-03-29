import os
import logging
import uuid
from datetime import datetime
from typing import List, Dict, Optional

logger = logging.getLogger(__name__)


class AdminRepository:
    """Manage documents and links for RAG"""

    def __init__(self):
        self.documents = {}
        self.load_documents()

    def load_documents(self):
        """Load documents from file storage"""
        db_file = "data/documents.json"
        if os.path.exists(db_file):
            import json
            try:
                with open(db_file, 'r') as f:
                    self.documents = json.load(f)
            except Exception:
                self.documents = {}

    def save_documents(self):
        """Save documents to file"""
        os.makedirs("data", exist_ok=True)
        import json
        with open("data/documents.json", 'w') as f:
            json.dump(self.documents, f, indent=2)

    def add_document(
        self,
        title: str,
        type: str = "document",
        file_name: str = None,
        file_path: str = None,
        url: str = None
    ) -> str:
        """Add document or link"""
        doc_id = str(uuid.uuid4())
        self.documents[doc_id] = {
            "id": doc_id,
            "title": title,
            "type": type,
            "file_name": file_name,
            "file_path": file_path,
            "url": url,
            "uploaded_at": datetime.now().isoformat()
        }
        self.save_documents()
        logger.info(f"Document added: {doc_id} - {title}")
        return doc_id

    def get_all_documents(self) -> List[Dict]:
        """Get all documents"""
        docs = []
        for doc in self.documents.values():
            docs.append({
                "id": doc["id"],
                "title": doc["title"],
                "type": doc["type"],
                "file_name": doc.get("file_name"),
                "url": doc.get("url"),
                "uploaded_at": doc["uploaded_at"]
            })
        return docs

    def get_document_by_id(self, doc_id: str) -> Optional[Dict]:
        """Get document by ID"""
        return self.documents.get(doc_id)

    def delete_document(self, doc_id: str) -> bool:
        """Delete document"""
        if doc_id not in self.documents:
            return False
        doc = self.documents[doc_id]
        if doc.get("file_path") and os.path.exists(doc["file_path"]):
            try:
                os.remove(doc["file_path"])
            except Exception:
                pass
        del self.documents[doc_id]
        self.save_documents()
        logger.info(f"Document deleted: {doc_id}")
        return True

    def search_documents(self, query: str) -> List[Dict]:
        """Search documents by title"""
        query_lower = query.lower()
        results = []
        for doc in self.documents.values():
            if query_lower in doc["title"].lower():
                results.append({
                    "id": doc["id"],
                    "title": doc["title"],
                    "type": doc["type"],
                    "url": doc.get("url")
                })
        return results
