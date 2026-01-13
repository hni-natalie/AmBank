"""RAG API routes."""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional, Dict
from rag.rag_system import get_rag_system, clear_rag_system

router = APIRouter()


class DocumentRequest(BaseModel):
    """Request to add documents."""
    documents: List[str]
    metadata: Optional[List[Dict]] = None
    chunk: bool = False
    chunk_size: int = 500
    chunk_overlap: int = 50


class QueryRequest(BaseModel):
    """Request to query RAG system."""
    query: str
    top_k: int = 5
    min_score: float = 0.3
    include_context: bool = True
    temperature: Optional[float] = None
    top_p: Optional[float] = None


@router.post("/rag/documents")
async def add_documents(request: DocumentRequest):
    """
    Add documents to the RAG system.
    
    - If chunk=True, documents will be automatically chunked
    - Otherwise, each document is added as-is
    """
    try:
        rag = get_rag_system()
        
        if request.chunk:
            rag.add_documents_chunked(
                request.documents,
                chunk_size=request.chunk_size,
                chunk_overlap=request.chunk_overlap,
                metadata=request.metadata
            )
        else:
            rag.add_documents(request.documents, metadata=request.metadata)
        
        stats = rag.get_stats()
        return {
            "status": "success",
            "message": f"Added {len(request.documents)} document(s)",
            "stats": stats
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/rag/query")
async def query_rag(request: QueryRequest):
    """
    Query the RAG system.
    
    Returns answer with context and sources.
    """
    try:
        rag = get_rag_system()
        
        # Prepare LLM kwargs
        llm_kwargs = {}
        if request.temperature is not None:
            llm_kwargs['temperature'] = request.temperature
        if request.top_p is not None:
            llm_kwargs['top_p'] = request.top_p
        
        result = rag.query(
            query=request.query,
            top_k=request.top_k,
            min_score=request.min_score,
            include_context=request.include_context,
            **llm_kwargs
        )
        
        return result
    except ConnectionError as e:
        raise HTTPException(
            status_code=503,
            detail=f"Ollama not available: {str(e)}"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/rag/stats")
async def get_rag_stats():
    """Get RAG system statistics."""
    try:
        rag = get_rag_system()
        return rag.get_stats()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/rag/clear")
async def clear_rag():
    """Clear all documents from RAG system."""
    try:
        clear_rag_system()
        return {"status": "success", "message": "RAG system cleared"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/rag/health")
async def check_rag_health():
    """Check RAG system health (Ollama connection)."""
    try:
        rag = get_rag_system()
        is_healthy = rag.llm_client.check_health()
        
        if is_healthy:
            models = rag.llm_client.list_models()
            return {
                "status": "healthy",
                "ollama_connected": True,
                "available_models": models,
                "current_model": rag.llm_client.model
            }
        else:
            return {
                "status": "unhealthy",
                "ollama_connected": False,
                "message": "Ollama is not running or not accessible"
            }
    except Exception as e:
        return {
            "status": "error",
            "ollama_connected": False,
            "error": str(e)
        }

