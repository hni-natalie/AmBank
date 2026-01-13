"""Test company identifier."""
import json
from agents.company_identifier import CompanyIdentifier


def test_company_identification():
    """Test company identification with various inputs."""
    identifier = CompanyIdentifier()
    
    test_cases = [
        "I want to invest in WASCO",
        "Buy shares of DELEUM",
        "What about DAYANG?",
        "Interested in KEYFIELD",
        "Stock in Wasco Energy",
        "Buy KEYFIELD shares",
        "What about Dayang Enterprise?",
        "Random text that doesn't mention a company"
    ]
    
    print("=" * 80)
    print("Company Identification Test")
    print("=" * 80 + "\n")
    
    for user_input in test_cases:
        print(f"User Input: {user_input}")
        print("-" * 80)
        
        result = identifier.identify_company(user_input)
        
        # Output clean JSON
        output = json.dumps(result, indent=2)
        print(output)
        print("\n")
    
    print("=" * 80)
    print("Test Complete")
    print("=" * 80)


if __name__ == "__main__":
    test_company_identification()

