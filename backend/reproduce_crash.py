import sys
import os

# Add backend directory to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

try:
    print("Step 1: Importing RAG modules...")
    from agents.macro_news_agent import MacroNewsAgent
    from agents.micro_news_agent import MicroNewsAgent
    from agents.company_identifier import CompanyIdentifier
    print("✅ Imports successful")
except Exception as e:
    print(f"❌ Import failed: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)

def test_rag_init():
    print("\nStep 2: Initializing Agents (which lazy loads RAG)...")
    try:
        macro_agent = MacroNewsAgent()
        # This init is cheap (doesn't load model yet)
        print("✅ MacroNewsAgent instantiated")
        
        # Trigger model loading
        print("\nStep 3: Triggering Embedding Model Load...")
        # We need to access the rag system inside agent
        if not hasattr(macro_agent, 'rag'):
            print("❌ MacroNewsAgent has no 'rag' attribute")
            return
            
        print("   Calling rag.embedding_model.embed_text('test')...")
        macro_agent.rag.embedding_model.embed_text("test")
        print("✅ Embedding Model loaded and ran successfully")
        
    except Exception as e:
        print(f"❌ RAG Init/Embedding Failed: {e}")
        import traceback
        traceback.print_exc()

def test_ollama():
    print("\nStep 4: Testing Ollama Connection...")
    try:
        from rag.llm_client import OllamaClient
        client = OllamaClient()
        health = client.check_health()
        if health:
            print(f"✅ Ollama is running and healthy at {client.base_url}")
        else:
            print(f"❌ Ollama check_health returned False at {client.base_url}")
    except Exception as e:
        print(f"❌ Ollama Check Failed: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_rag_init()
    test_ollama()
