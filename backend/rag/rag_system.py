"""RAG (Retrieval-Augmented Generation) system."""
from typing import List, Dict, Optional, Union
from .vector_store import VectorStore
from .embeddings import EmbeddingModel
from .llm_client import OllamaClient


class RAGSystem:
    """Complete RAG system with retrieval and generation."""
    
    def __init__(
        self,
        embedding_model: str = "all-MiniLM-L6-v2",
        ollama_url: str = "http://localhost:11434",
        llm_model: str = "llama3.1:8b",
        persist: bool = False,
        db_path: Optional[str] = None
    ):
        """
        Initialize RAG system.
        
        Args:
            embedding_model: Sentence transformer model name for embeddings
            ollama_url: Ollama API base URL
            llm_model: LLM model name
            persist: Whether to persist vector database to disk
            db_path: Path to store vector database (required if persist=True)
        """
        self.vector_store = VectorStore(persist=persist, db_path=db_path)
        self.embedding_model = EmbeddingModel(embedding_model)
        self.llm_client = OllamaClient(ollama_url, llm_model)
        self.persist = persist
        self.db_path = db_path
    
    def add_documents(self, documents: Union[str, List[str]], metadata: Optional[List[Dict]] = None):
        """
        Add documents to the vector store.
        
        Args:
            documents: Single document or list of documents
            metadata: Optional metadata for each document
        """
        if isinstance(documents, str):
            documents = [documents]
        
        if metadata is None:
            metadata = [{}] * len(documents)
        elif len(metadata) != len(documents):
            raise ValueError("metadata length must match documents length")
        
        # Generate embeddings for all documents
        # Limit batch size to prevent memory issues
        max_batch_size = 50
        all_embeddings = []
        
        for i in range(0, len(documents), max_batch_size):
            batch_docs = documents[i:i + max_batch_size]
            batch_embeddings = self.embedding_model.embed_text(batch_docs)
            all_embeddings.extend(batch_embeddings)
        
        embeddings = all_embeddings
        
        # Add to vector store
        for doc, emb, meta in zip(documents, embeddings, metadata):
            meta_with_text = meta.copy()
            meta_with_text['text'] = doc
            self.vector_store.add_vector(emb, meta_with_text)
    
    def add_documents_chunked(
        self,
        documents: List[str],
        chunk_size: int = 500,
        chunk_overlap: int = 50,
        metadata: Optional[List[Dict]] = None
    ):
        """
        Add documents with automatic chunking.
        
        Args:
            documents: List of documents to chunk and add
            chunk_size: Maximum characters per chunk
            chunk_overlap: Characters to overlap between chunks
            metadata: Optional metadata for each document
        """
        if metadata is None:
            metadata = [{}] * len(documents)
        
        chunked_docs = []
        chunked_metadata = []
        
        for doc, meta in zip(documents, metadata):
            chunks = self._chunk_text(doc, chunk_size, chunk_overlap)
            chunked_docs.extend(chunks)
            # Add chunk index to metadata
            for i, chunk in enumerate(chunks):
                chunk_meta = meta.copy()
                chunk_meta['chunk_index'] = i
                chunk_meta['total_chunks'] = len(chunks)
                chunked_metadata.append(chunk_meta)
        
        self.add_documents(chunked_docs, chunked_metadata)
    
    def _chunk_text(self, text: str, chunk_size: int, chunk_overlap: int) -> List[str]:
        """
        Split text into overlapping chunks.
        
        Args:
            text: Text to chunk
            chunk_size: Maximum characters per chunk
            chunk_overlap: Characters to overlap
            
        Returns:
            List of text chunks
        """
        if len(text) <= chunk_size:
            return [text]
        
        # Safety check: ensure overlap is less than chunk_size
        if chunk_overlap >= chunk_size:
            chunk_overlap = max(1, chunk_size // 4)  # Default to 25% overlap
        
        chunks = []
        start = 0
        max_iterations = len(text) // max(1, chunk_size - chunk_overlap) + 10  # Safety limit
        iteration = 0
        
        while start < len(text) and iteration < max_iterations:
            iteration += 1
            end = start + chunk_size
            chunk = text[start:end]
            
            # Try to break at sentence boundary
            if end < len(text):
                # Look for sentence endings
                for punct in ['. ', '.\n', '! ', '!\n', '? ', '?\n']:
                    last_punct = chunk.rfind(punct)
                    if last_punct > chunk_size * 0.5:  # Only break if not too early
                        chunk = chunk[:last_punct + 1]
                        end = start + last_punct + 1
                        break
            
            chunks.append(chunk.strip())
            
            # Ensure we always advance
            new_start = end - chunk_overlap
            if new_start <= start:
                new_start = start + 1  # Force advancement
            
            start = new_start
        
        return chunks
    
    def query(
        self,
        query: str,
        top_k: int = 5,
        min_score: float = 0.2,  # Lower threshold to ensure retrieval
        include_context: bool = True,
        **llm_kwargs
    ) -> Dict:
        """
        Query the RAG system.
        
        Args:
            query: User query
            top_k: Number of relevant documents to retrieve
            min_score: Minimum similarity score threshold (lowered to 0.2 for better retrieval)
            include_context: Whether to include retrieved context in LLM prompt
            **llm_kwargs: Additional LLM parameters (temperature, top_p, etc.)
            
        Returns:
            Dictionary with answer, context, and metadata
        """
        # Check if vector store has documents
        if self.vector_store.size() == 0:
            return {
                'answer': 'No documents in vector store.',
                'context': [],
                'sources': [],
                'retrieved_count': 0
            }
        
        # Generate query embedding
        query_embedding = self.embedding_model.embed_query(query)
        
        # Retrieve relevant documents - try with lower threshold first
        results = self.vector_store.search(query_embedding, top_k=top_k, min_score=min_score)
        
        # If no results with threshold, try with even lower threshold
        if not results and min_score > 0.1:
            results = self.vector_store.search(query_embedding, top_k=top_k, min_score=0.1)
        
        if not results:
            # Still no results - return top documents anyway (might be all we have)
            results = self.vector_store.search(query_embedding, top_k=min(top_k, self.vector_store.size()), min_score=0.0)
        
        if not results:
            # No documents found at all
            # Extract temperature and top_p from llm_kwargs if provided
            llm_options = {}
            if 'temperature' in llm_kwargs:
                llm_options['temperature'] = llm_kwargs.pop('temperature')
            if 'top_p' in llm_kwargs:
                llm_options['top_p'] = llm_kwargs.pop('top_p')
            answer = self.llm_client.generate(
                query,
                options=llm_options if llm_options else None,
                **llm_kwargs
            )
            return {
                'answer': answer,
                'context': [],
                'sources': [],
                'retrieved_count': 0
            }
        
        # Build context from retrieved documents
        context_texts = []
        sources = []
        
        for result in results:
            text = result['metadata'].get('text', '')
            if text:  # Only add if text exists
                context_texts.append(text)
                sources.append({
                    'score': result['score'],
                    'metadata': result['metadata']
                })
        
        if not context_texts:
            # No valid context texts
            # Extract temperature, top_p, and seed from llm_kwargs if provided
            llm_options = {}
            temp_kwargs = llm_kwargs.copy()
            if 'temperature' in temp_kwargs:
                llm_options['temperature'] = temp_kwargs.pop('temperature')
            if 'top_p' in temp_kwargs:
                llm_options['top_p'] = temp_kwargs.pop('top_p')
            if 'seed' in temp_kwargs:
                llm_options['seed'] = temp_kwargs.pop('seed')
            answer = self.llm_client.generate(
                query,
                options=llm_options if llm_options else None,
                **temp_kwargs
            )
            return {
                'answer': answer,
                'context': [],
                'sources': [],
                'retrieved_count': 0
            }
        
        # Limit context length to prevent overly long prompts
        max_context_length = 5000  # characters
        context = "\n\n---\n\n".join(context_texts)
        if len(context) > max_context_length:
            # Truncate context but keep it meaningful
            context = context[:max_context_length] + "\n\n[Context truncated...]"
        
        # Generate answer with context and deterministic settings
        # Extract temperature, top_p, and seed from llm_kwargs if provided
        llm_options = {}
        temp_kwargs = llm_kwargs.copy()
        if 'temperature' in temp_kwargs:
            llm_options['temperature'] = temp_kwargs.pop('temperature')
        if 'top_p' in temp_kwargs:
            llm_options['top_p'] = temp_kwargs.pop('top_p')
        if 'seed' in temp_kwargs:
            llm_options['seed'] = temp_kwargs.pop('seed')
        
        try:
            if include_context:
                answer = self.llm_client.generate(
                    query, 
                    context=context,
                    options=llm_options if llm_options else None,
                    **temp_kwargs
                )
            else:
                answer = self.llm_client.generate(
                    query,
                    options=llm_options if llm_options else None,
                    **temp_kwargs
                )
        except Exception as e:
            # Fallback if LLM generation fails
            return {
                'answer': f'Error generating response: {str(e)}',
                'context': context_texts,
                'sources': sources,
                'retrieved_count': len(results)
            }
        
        return {
            'answer': answer,
            'context': context_texts,
            'sources': sources,
            'retrieved_count': len(results)
        }
    
    def clear(self):
        """Clear all documents from the vector store."""
        self.vector_store.clear()
    
    def get_stats(self) -> Dict:
        """Get statistics about the vector store."""
        return {
            'document_count': self.vector_store.size(),
            'embedding_dimension': len(self.embedding_model.embed_text("test")) if self.vector_store.size() > 0 else 0
        }


# Global RAG instance (session-only)
_rag_instance: Optional[RAGSystem] = None


def get_rag_system() -> RAGSystem:
    """Get or create global RAG system instance."""
    global _rag_instance
    if _rag_instance is None:
        _rag_instance = RAGSystem()
    return _rag_instance


def clear_rag_system():
    """Clear the global RAG system."""
    global _rag_instance
    if _rag_instance is not None:
        _rag_instance.clear()
        _rag_instance = None

