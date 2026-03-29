"""Stub for document ingestion - RAG indexing. Replace with actual LangChain/vector implementation."""
import logging
logger = logging.getLogger(__name__)


class DocumentIngestionService:
    """Placeholder for RAG document indexing. Extend with LangChain + pgvector."""

    def ingest_document(self, file_path: str, file_name: str, title: str, doc_type: str = "document") -> bool:
        """Index document into vector store. Currently a no-op."""
        logger.info(f"Document ingestion stub: {title} ({file_path})")
        return True

    def ingest_link(self, url: str, title: str) -> bool:
        """Index link into vector store. Currently a no-op."""
        logger.info(f"Link ingestion stub: {title} ({url})")
        return True
