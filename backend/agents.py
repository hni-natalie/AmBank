"""Agents module - combines macro/sector/Bursa agents + in-memory vector store."""
from typing import List, Dict, Optional
from schemas.signals import MacroSignal


# ============================================================================
# In-Memory Vector Store (Session Only)
# ============================================================================

class SessionVectorStore:
    """In-memory vector store that clears on session end."""
    
    def __init__(self):
        """Initialize empty vector store."""
        self.vectors: List[Dict] = []
        self.metadata: Dict[str, any] = {}
    
    def add_vector(self, vector: List[float], metadata: Dict) -> str:
        """
        Add a vector to the store.
        
        Args:
            vector: Embedding vector
            metadata: Associated metadata
            
        Returns:
            Vector ID
        """
        vector_id = f"vec_{len(self.vectors)}"
        self.vectors.append({
            "id": vector_id,
            "vector": vector,
            "metadata": metadata
        })
        return vector_id
    
    def search(self, query_vector: List[float], top_k: int = 5) -> List[Dict]:
        """
        Search for similar vectors (stub - returns empty).
        
        Args:
            query_vector: Query embedding
            top_k: Number of results
            
        Returns:
            List of similar vectors
        """
        # Stub implementation - no actual similarity search
        return []
    
    def clear(self):
        """Clear all vectors and metadata (called on session end)."""
        self.vectors = []
        self.metadata = {}


# Global session store (cleared per session)
_session_store: Optional[SessionVectorStore] = None


def get_session_store() -> SessionVectorStore:
    """Get or create session vector store."""
    global _session_store
    if _session_store is None:
        _session_store = SessionVectorStore()
    return _session_store


def clear_session_store():
    """Clear session vector store."""
    global _session_store
    if _session_store is not None:
        _session_store.clear()
        _session_store = None


# ============================================================================
# Agents
# ============================================================================

def get_macro_signal(preferences: dict) -> MacroSignal:
    """
    Generate mocked macro signal based on preferences.
    
    Args:
        preferences: User preferences dict
        
    Returns:
        MacroSignal with mocked data
    """
    # Stub implementation - returns hardcoded signal
    return MacroSignal(
        macro_stance="risk_on",
        confidence=0.72,
        summary="Inflation easing with stable growth."
    )


def get_sector_signal(preferences: dict) -> dict:
    """
    Generate mocked sector signal (stub).
    
    Args:
        preferences: User preferences dict
        
    Returns:
        Sector signal dict
    """
    # Stub implementation
    return {
        "sector_stance": "neutral",
        "confidence": 0.65,
        "summary": "Sector analysis pending."
    }


def get_bursa_signal(preferences: dict) -> dict:
    """
    Generate mocked Bursa signal (stub).
    
    Args:
        preferences: User preferences dict
        
    Returns:
        Bursa signal dict
    """
    # Stub implementation
    return {
        "bursa_stance": "neutral",
        "confidence": 0.60,
        "summary": "Bursa analysis pending."
    }

