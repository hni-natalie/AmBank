"""Test RAG agents - Macro and Micro news agents."""
from agents.macro_news_agent import MacroNewsAgent
from agents.micro_news_agent import MicroNewsAgent
from rag.rag_system import RAGSystem


def print_section(title: str):
    """Print a formatted section header."""
    print("\n" + "=" * 80)
    print(f"  {title}")
    print("=" * 80 + "\n")


def print_signal_result(title: str, result: dict):
    """Print formatted signal result."""
    print(f"\n📊 {title}")
    print("-" * 80)
    
    # Main signal
    stance = result.get('macro_stance') or result.get('sector_stance', 'N/A')
    confidence = result.get('confidence', 0.0)
    
    print(f"Signal: {stance.upper()}")
    print(f"Confidence: {confidence:.2%}")
    print(f"\nSummary: {result.get('summary', 'N/A')}")
    
    # Key points
    if result.get('key_points'):
        print(f"\n🔑 Key Points:")
        for point in result['key_points'][:3]:
            print(f"   • {point}")
    
    # Statistics
    print(f"\n📈 Statistics:")
    print(f"   Articles analyzed: {result.get('articles_count', 0)}")
    context_count = result.get('retrieved_context_count', 0)
    print(f"   Context retrieved: {context_count} documents")
    if context_count == 0:
        print("   ⚠️  WARNING: No context retrieved - RAG may not be working properly!")
    
    # RAG answer (truncated)
    if 'rag_answer' in result:
        answer = result['rag_answer']
        if len(answer) > 300:
            answer = answer[:300] + "..."
        print(f"\n🤖 LLM Analysis (excerpt):")
        print(f"   {answer}")
    
    # Top articles
    if result.get('details'):
        print(f"\n📰 Top Articles:")
        for i, article in enumerate(result['details'][:3], 1):
            print(f"   {i}. {article['title']}")
            print(f"      Source: {article.get('source', 'Unknown')}")
            print(f"      Link: {article['link']}")
            if article.get('date'):
                print(f"      Date: {article['date']}")
        print()


def main():
    """Test macro and micro news agents."""
    print_section("RAG News Agents Test")
    
    # Check Ollama
    print("🔍 Checking Ollama connection...")
    rag = RAGSystem()
    if not rag.llm_client.check_health():
        print("⚠️  Warning: Ollama is not running!")
        print("Please start Ollama and pull the model:")
        print("  ollama serve")
        print("  ollama pull llama3.1:8b")
        return
    
    print("✅ Ollama is running")
    print(f"   Available models: {rag.llm_client.list_models()}")
    print(f"   Using model: {rag.llm_client.model}\n")
    
    # Initialize agents
    print("🚀 Initializing agents...")
    macro_agent = MacroNewsAgent()
    micro_agent = MicroNewsAgent()
    print("✅ Agents initialized\n")
    
    # Test Macro News Agent
    print_section("MACRO NEWS AGENT")
    print("Generating macro economic/market signal...")
    
    try:
        macro_result = macro_agent.generate_signal(limit=20)
        print_signal_result("Macro Signal Result", macro_result)
    except Exception as e:
        print(f"❌ Error in macro agent: {str(e)}")
        import traceback
        traceback.print_exc()
    
    # Test Micro News Agent (for each sector)
    print_section("MICRO NEWS AGENT")
    
    sectors = ['technology', 'finance', 'healthcare']
    
    for sector in sectors:
        print(f"\n🔍 Analyzing {sector.upper()} sector...")
        try:
            micro_result = micro_agent.generate_signal(sector=sector, limit=20)
            print_signal_result(f"{sector.capitalize()} Sector Signal", micro_result)
        except Exception as e:
            print(f"❌ Error analyzing {sector} sector: {str(e)}")
            import traceback
            traceback.print_exc()
    
    # Summary
    print_section("SUMMARY")
    print("✅ All agents completed analysis")
    print("\n💡 Next steps:")
    print("   - Review the signals and confidence scores")
    print("   - Check the LLM analysis for reasoning")
    print("   - Use these signals in the decision-making pipeline")
    
    # Cleanup
    print("\n🧹 Cleaning up...")
    macro_agent.clear()
    micro_agent.clear()
    print("✅ Done!")


if __name__ == "__main__":
    main()

