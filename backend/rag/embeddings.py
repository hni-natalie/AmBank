"""Embedding generation for RAG."""
from typing import List, Union
import numpy as np


class EmbeddingModel:
    """Embedding model wrapper for generating embeddings."""
    
    def __init__(self, model_name: str = "all-MiniLM-L6-v2"):
        """
        Initialize embedding model.
        
        Args:
            model_name: Name of the sentence transformer model
        """
        self.model_name = model_name
        self._model = None
        self._tokenizer = None
    
    def _load_model(self):
        """Lazy load the embedding model."""
        if self._model is None:
            try:
                from sentence_transformers import SentenceTransformer
                self._model = SentenceTransformer(self.model_name)
            except ImportError:
                raise ImportError(
                    "sentence-transformers not installed. "
                    "Install with: pip install sentence-transformers"
                )
    
    def embed_text(self, text: Union[str, List[str]]) -> Union[List[float], List[List[float]]]:
        """
        Generate embeddings for text.
        
        Args:
            text: Single text string or list of texts
            
        Returns:
            Single embedding vector or list of embedding vectors
        """
        self._load_model()
        
        if isinstance(text, str):
            embedding = self._model.encode(text, convert_to_numpy=True, normalize_embeddings=True)
            return embedding.tolist()
        else:
            embeddings = self._model.encode(text, convert_to_numpy=True, normalize_embeddings=True)
            return embeddings.tolist()
    
    def embed_query(self, query: str) -> List[float]:
        """
        Generate embedding for a query (alias for embed_text).
        
        Args:
            query: Query text
            
        Returns:
            Query embedding vector
        """
        return self.embed_text(query)

