# RAG System Documentation

## Overview

This RAG (Retrieval-Augmented Generation) system uses:
- **Embeddings**: Sentence Transformers (all-MiniLM-L6-v2)
- **Vector Store**: In-memory with cosine similarity search
- **LLM**: Llama 3.1 8B via Ollama (local)

## Setup

### 1. Install Dependencies

```bash
pip install -r requirements.txt
```

### 2. Install and Run Ollama

**Install Ollama:**
- macOS: `brew install ollama` or download from https://ollama.ai
- Linux: `curl -fsSL https://ollama.ai/install.sh | sh`
- Windows: Download from https://ollama.ai

**Start Ollama:**
```bash
ollama serve
```

**Pull Llama 3.1 8B model:**
```bash
ollama pull llama3.1:8b
```

### 3. Verify Setup

Check if Ollama is running:
```bash
curl http://localhost:11434/api/tags
```

## Usage

### Python API

```python
from rag.rag_system import RAGSystem

# Initialize RAG system
rag = RAGSystem()

# Add documents
rag.add_documents([
    "Investment principle: Diversify across sectors",
    "Risk management: Set stop loss at 5% below entry",
    "Market analysis: Technology sector shows strong growth"
])

# Query
result = rag.query("What are the investment principles?")
print(result['answer'])
print(f"Retrieved {result['retrieved_count']} documents")
```

### REST API

**Add documents:**
```bash
curl -X POST http://localhost:8000/api/rag/documents \
  -H "Content-Type: application/json" \
  -d '{
    "documents": [
      "Investment principle: Diversify across sectors",
      "Risk management: Set stop loss at 5% below entry"
    ],
    "chunk": false
  }'
```

**Query:**
```bash
curl -X POST http://localhost:8000/api/rag/query \
  -H "Content-Type: application/json" \
  -d '{
    "query": "What are the investment principles?",
    "top_k": 5,
    "min_score": 0.3
  }'
```

**Check health:**
```bash
curl http://localhost:8000/api/rag/health
```

## API Endpoints

- `POST /api/rag/documents` - Add documents to RAG system
- `POST /api/rag/query` - Query the RAG system
- `GET /api/rag/stats` - Get RAG system statistics
- `POST /api/rag/clear` - Clear all documents
- `GET /api/rag/health` - Check Ollama connection

## Features

- **Automatic Chunking**: Documents can be automatically chunked with overlap
- **Cosine Similarity**: Efficient similarity search using normalized vectors
- **Context-Aware Generation**: LLM receives relevant context from retrieved documents
- **Session-Based**: Vector store is session-only (cleared on session end)

## Configuration

You can customize the RAG system:

```python
rag = RAGSystem(
    embedding_model="all-MiniLM-L6-v2",  # Embedding model
    ollama_url="http://localhost:11434",  # Ollama URL
    llm_model="llama3.1:8b"  # LLM model name
)
```

## Notes

- The vector store is in-memory and session-only
- Embeddings are generated using sentence-transformers
- First run will download the embedding model (~80MB)
- Make sure Ollama is running before querying

