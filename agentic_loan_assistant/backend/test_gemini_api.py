# test_gemini_api.py - Test Gemini API integration
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend import api_clients

def test_gemini():
    """Test Gemini API"""
    print("Testing Gemini API...")
    
    gemini = api_clients.get_gemini_client()
    
    messages = [
        {"role": "system", "content": "You are a helpful loan assistant."},
        {"role": "user", "content": "Hello, I need a loan"}
    ]
    
    response = gemini.chat_completion(messages, temperature=0.7)
    
    if response:
        print(f"✓ Gemini API working!")
        print(f"Response: {response}")
        return True
    else:
        print("✗ Gemini API failed")
        return False

def test_credit_api():
    """Test Credit Report API"""
    print("\nTesting Credit Report API...")
    
    credit_client = api_clients.get_credit_client()
    score = credit_client.get_credit_score("cust004")
    
    if score:
        print(f"✓ Credit API working!")
        print(f"Credit Score: {score}")
        return True
    else:
        print("✗ Credit API failed")
        return False

def test_loan_calculator():
    """Test Loan Calculator API"""
    print("\nTesting Loan Calculator API...")
    
    calc = api_clients.get_loan_calculator_client()
    result = calc.calculate_amortization(100000, 12.0, 60)
    
    if result:
        print(f"✓ Loan Calculator working!")
        print(f"Monthly EMI: INR {result.get('monthly_payment', 0):,.2f}")
        print(f"Total Payment: INR {result.get('total_payment', 0):,.2f}")
        return True
    else:
        print("✗ Loan Calculator failed")
        return False

if __name__ == "__main__":
    print("=" * 50)
    print("API Integration Tests")
    print("=" * 50)
    
    results = []
    results.append(("Gemini API", test_gemini()))
    results.append(("Credit Report API", test_credit_api()))
    results.append(("Loan Calculator API", test_loan_calculator()))
    
    print("\n" + "=" * 50)
    print("Test Results Summary")
    print("=" * 50)
    
    for name, passed in results:
        status = "✓ PASS" if passed else "✗ FAIL"
        print(f"{name}: {status}")
    
    all_passed = all(result[1] for result in results)
    print("\n" + ("All tests passed! 🎉" if all_passed else "Some tests failed ⚠️"))
