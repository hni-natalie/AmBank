"""Example usage of the RAG system."""
import sys
import os

# Add parent directory to path to allow imports
backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

try:
    from rag.rag_system import RAGSystem
except ImportError:
    # Try relative import if running from rag directory
    from .rag_system import RAGSystem


def main():
    """Example RAG usage."""
    # Initialize RAG system
    print("Initializing RAG system...")
    rag = RAGSystem()
    
    # Check if Ollama is running
    if not rag.llm_client.check_health():
        print("⚠️  Warning: Ollama is not running!")
        print("Please start Ollama and pull the model:")
        print("  ollama serve")
        print("  ollama pull llama3.1:8b")
        return
    
    print("✅ Ollama is running")
    print(f"Available models: {rag.llm_client.list_models()}")
    
    # Add some investment-related documents
    print("\n📚 Adding documents...")
    documents = [
        "Ray Dalio's investment principle: Diversify across different asset classes and sectors to reduce risk.",
        "Risk management rule: Always set a stop loss at 5% below your entry price to limit potential losses.",
        "Market analysis: The technology sector has shown strong growth in Q4 2024, with AI companies leading the way.",
        "Portfolio allocation: For balanced risk, allocate 60% to stocks, 30% to bonds, and 10% to alternative investments.",
        "Entry strategy: Enter positions gradually using dollar-cost averaging rather than lump sum investments.",
        "Profit taking: Set profit targets at 20% gain for growth stocks and 10% for value stocks."
    ]
    
    rag.add_documents(documents)
    print(f"✅ Added {len(documents)} documents")
    print(f"Vector store size: {rag.get_stats()['document_count']}")
    
    # Query examples
    queries = [
        "What are the investment principles?",
        "How should I manage risk?",
        "What is the recommended portfolio allocation?",
        "What entry strategy should I use?"
    ]
    
    print("\n🔍 Querying RAG system...\n")
    for query in queries:
        print(f"Q: {query}")
        result = rag.query(query, top_k=3, min_score=0.3)
        print(f"A: {result['answer']}")
        print(f"   (Retrieved {result['retrieved_count']} relevant documents)")
        print()
    
    # Clear when done
    print("🧹 Clearing RAG system...")
    rag.clear()
    print("✅ Done!")


if __name__ == "__main__":
    main()

