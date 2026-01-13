"""Enhanced vector store with FAISS for fast similarity search."""
import numpy as np
import faiss
from typing import List, Dict, Optional


class VectorStore:
    """In-memory vector store with FAISS for fast similarity search."""
    
    def __init__(self, dimension: Optional[int] = None):
        """
        Initialize FAISS vector store.
        
        Args:
            dimension: Embedding dimension (auto-detected from first vector if None)
        """
        self.dimension = dimension
        self.index: Optional[faiss.Index] = None
        self.metadata: List[Dict] = []
        self.id_to_index: Dict[str, int] = {}
        self.index_to_id: Dict[int, str] = {}
        self._next_id = 0
    
    def _ensure_index(self, dimension: int):
        """
        Create or ensure FAISS index exists with correct dimension.
        
        Args:
            dimension: Embedding dimension
        """
        if self.index is None or self.dimension != dimension:
            self.dimension = dimension
            # Use IndexFlatIP (Inner Product) for cosine similarity with normalized vectors
            # Since vectors are normalized, inner product = cosine similarity
            self.index = faiss.IndexFlatIP(dimension)
    
    def add_vector(self, vector: List[float], metadata: Dict, vector_id: Optional[str] = None) -> str:
        """
        Add a vector to the store.
        
        Args:
            vector: Embedding vector
            metadata: Associated metadata (must include 'text' or 'content')
            vector_id: Optional custom ID, otherwise auto-generated
            
        Returns:
            Vector ID
        """
        if vector_id is None:
            vector_id = f"vec_{self._next_id}"
        
        if vector_id in self.id_to_index:
            raise ValueError(f"Vector ID {vector_id} already exists")
        
        # Convert to numpy array
        vec_array = np.array(vector, dtype=np.float32).reshape(1, -1)
        dimension = vec_array.shape[1]
        
        # Normalize vector for cosine similarity
        faiss.normalize_L2(vec_array)
        
        # Ensure index exists with correct dimension
        self._ensure_index(dimension)
        
        # Add to FAISS index
        self.index.add(vec_array)
        
        # Store metadata
        index_pos = len(self.metadata)
        self.metadata.append(metadata)
        self.id_to_index[vector_id] = index_pos
        self.index_to_id[index_pos] = vector_id
        self._next_id += 1
        
        return vector_id
    
    def search(self, query_vector: List[float], top_k: int = 5, min_score: float = 0.0) -> List[Dict]:
        """
        Search for similar vectors using FAISS.
        
        Args:
            query_vector: Query embedding
            top_k: Number of results to return
            min_score: Minimum similarity score threshold
            
        Returns:
            List of similar vectors with metadata and scores, sorted by similarity
        """
        if self.index is None or self.index.ntotal == 0:
            return []
        
        # Convert query to numpy array and normalize
        query_array = np.array(query_vector, dtype=np.float32).reshape(1, -1)
        faiss.normalize_L2(query_array)
        
        # Search using FAISS
        scores, indices = self.index.search(query_array, min(top_k, self.index.ntotal))
        
        # Build results
        results = []
        for score, idx in zip(scores[0], indices[0]):
            if idx == -1:  # FAISS returns -1 for invalid indices
                break
            
            score_float = float(score)
            if score_float >= min_score:
                vector_id = self.index_to_id.get(idx, f"vec_{idx}")
                result = {
                    'id': vector_id,
                    'score': score_float,
                    'metadata': self.metadata[idx].copy(),
                    'vector': None  # Don't reconstruct - not needed and IndexFlatIP doesn't support it
                }
                results.append(result)
        
        return results
    
    def get_by_id(self, vector_id: str) -> Optional[Dict]:
        """Get vector and metadata by ID."""
        if vector_id not in self.id_to_index:
            return None
        
        idx = self.id_to_index[vector_id]
        
        result = {
            'id': vector_id,
            'metadata': self.metadata[idx].copy()
        }
        
        # Try to reconstruct vector if index supports it
        if self.index is not None and hasattr(self.index, 'reconstruct'):
            try:
                result['vector'] = self.index.reconstruct(idx).tolist()
            except:
                result['vector'] = None
        else:
            result['vector'] = None
        
        return result
    
    def clear(self):
        """Clear all vectors and metadata."""
        self.index = None
        self.metadata = []
        self.id_to_index = {}
        self.index_to_id = {}
        self._next_id = 0
        self.dimension = None
    
    def size(self) -> int:
        """Get number of vectors in store."""
        if self.index is None:
            return 0
        return self.index.ntotal

