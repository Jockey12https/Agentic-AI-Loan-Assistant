# Test Google Gemini API integration
import os
import sys
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Set API key
os.environ["GOOGLE_GEMINI_API_KEY"] = "AIzaSyDZqS4186G3uvuL4wIzQhIkx-hKeJkvfdw"

from backend.google_gemini_client import get_google_gemini_client

def test_google_gemini():
    print("=" * 60)
    print("Testing Google Gemini API Integration")
    print("=" * 60)
    
    client = get_google_gemini_client()
    
    if not client.model:
        print("❌ Google Gemini client not initialized")
        return False
    
    print("\n✅ Google Gemini client initialized successfully!")
    
    # Test 1: Simple greeting
    print("\n" + "=" * 60)
    print("Test 1: Intent Detection")
    print("=" * 60)
    
    messages = [
        {"role": "system", "content": "You are an intent classifier. Classify this as: greeting, loan_inquiry, or general. Respond with ONLY the intent name."},
        {"role": "user", "content": "Hello, I need a loan"}
    ]
    
    response = client.chat_completion(messages, temperature=0.3, max_tokens=10)
    
    if response:
        print(f"✅ Intent Detection Response: {response}")
    else:
        print("❌ No response from Gemini")
        return False
    
    # Test 2: Persuasive response
    print("\n" + "=" * 60)
    print("Test 2: Persuasive Sales Response")
    print("=" * 60)
    
    messages = [
        {"role": "system", "content": "You are a charismatic loan sales agent. Be persuasive and friendly."},
        {"role": "user", "content": "I'm interested in a personal loan of 100000"}
    ]
    
    response = client.chat_completion(messages, temperature=0.7, max_tokens=150)
    
    if response:
        print(f"✅ Sales Response:\n{response}")
    else:
        print("❌ No response from Gemini")
        return False
    
    print("\n" + "=" * 60)
    print("✅ ALL TESTS PASSED! Google Gemini is working perfectly!")
    print("=" * 60)
    return True

if __name__ == "__main__":
    success = test_google_gemini()
    if success:
        print("\n🎉 Your agentic AI loan assistant is now powered by Google Gemini!")
        print("   Restart the backend server to activate real AI responses.")
    else:
        print("\n⚠️ Gemini API test failed. System will use intelligent fallbacks.")
