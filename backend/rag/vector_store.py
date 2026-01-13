"""Enhanced vector store with FAISS for fast similarity search."""
import numpy as np
import faiss
import os
import json
import pickle
from typing import List, Dict, Optional
from pathlib import Path


class VectorStore:
    """Vector store with FAISS for fast similarity search, with optional persistence."""
    
    def __init__(self, dimension: Optional[int] = None, persist: bool = False, db_path: Optional[str] = None):
        """
        Initialize FAISS vector store.
        
        Args:
            dimension: Embedding dimension (auto-detected from first vector if None)
            persist: Whether to persist the vector database to disk
            db_path: Path to store the vector database (required if persist=True)
        """
        self.dimension = dimension
        self.index: Optional[faiss.Index] = None
        self.metadata: List[Dict] = []
        self.id_to_index: Dict[str, int] = {}
        self.index_to_id: Dict[int, str] = {}
        self._next_id = 0
        self.persist = persist
        self.db_path = db_path
        
        if persist and db_path:
            self._load_from_disk()
    
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
        
        # Auto-save if persistence is enabled
        if self.persist:
            self.save_to_disk()
        
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
        
        # Remove persisted files if they exist
        if self.persist and self.db_path and os.path.exists(self.db_path):
            try:
                index_path = os.path.join(self.db_path, "index.faiss")
                metadata_path = os.path.join(self.db_path, "metadata.json")
                mappings_path = os.path.join(self.db_path, "mappings.json")
                
                if os.path.exists(index_path):
                    os.remove(index_path)
                if os.path.exists(metadata_path):
                    os.remove(metadata_path)
                if os.path.exists(mappings_path):
                    os.remove(mappings_path)
            except Exception as e:
                print(f"Warning: Could not remove persisted files: {e}")
    
    def size(self) -> int:
        """Get number of vectors in store."""
        if self.index is None:
            return 0
        return self.index.ntotal
    
    def save_to_disk(self):
        """Save vector store to disk."""
        if not self.persist or not self.db_path:
            return
        
        # Create directory if it doesn't exist
        Path(self.db_path).mkdir(parents=True, exist_ok=True)
        
        # Save FAISS index
        if self.index is not None:
            index_path = os.path.join(self.db_path, "index.faiss")
            faiss.write_index(self.index, index_path)
        
        # Save metadata and mappings
        metadata_path = os.path.join(self.db_path, "metadata.json")
        mappings_path = os.path.join(self.db_path, "mappings.json")
        
        with open(metadata_path, 'w', encoding='utf-8') as f:
            json.dump(self.metadata, f, ensure_ascii=False, indent=2)
        
        mappings_data = {
            'id_to_index': self.id_to_index,
            'index_to_id': {str(k): v for k, v in self.index_to_id.items()},  # Convert int keys to str for JSON
            'next_id': self._next_id,
            'dimension': self.dimension
        }
        
        with open(mappings_path, 'w', encoding='utf-8') as f:
            json.dump(mappings_data, f, ensure_ascii=False, indent=2)
    
    def _load_from_disk(self):
        """Load vector store from disk."""
        if not self.db_path or not os.path.exists(self.db_path):
            return
        
        index_path = os.path.join(self.db_path, "index.faiss")
        metadata_path = os.path.join(self.db_path, "metadata.json")
        mappings_path = os.path.join(self.db_path, "mappings.json")
        
        # Load FAISS index
        if os.path.exists(index_path):
            try:
                self.index = faiss.read_index(index_path)
            except Exception as e:
                print(f"Warning: Could not load FAISS index: {e}")
                self.index = None
        
        # Load metadata
        if os.path.exists(metadata_path):
            try:
                with open(metadata_path, 'r', encoding='utf-8') as f:
                    self.metadata = json.load(f)
            except Exception as e:
                print(f"Warning: Could not load metadata: {e}")
                self.metadata = []
        
        # Load mappings
        if os.path.exists(mappings_path):
            try:
                with open(mappings_path, 'r', encoding='utf-8') as f:
                    mappings_data = json.load(f)
                    self.id_to_index = mappings_data.get('id_to_index', {})
                    # Convert str keys back to int for index_to_id
                    self.index_to_id = {int(k): v for k, v in mappings_data.get('index_to_id', {}).items()}
                    self._next_id = mappings_data.get('next_id', 0)
                    self.dimension = mappings_data.get('dimension', None)
            except Exception as e:
                print(f"Warning: Could not load mappings: {e}")
                self.id_to_index = {}
                self.index_to_id = {}
                self._next_id = 0

