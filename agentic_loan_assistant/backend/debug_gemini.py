# Test script to debug Gemini API responses
import os
import sys
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

os.environ["RAPIDAPI_KEY"] = "6d999d9074msh16cc732e16846fbp1da672jsn5d3f544a90c5"

from backend.api_clients import get_gemini_client

def test_gemini_detailed():
    print("Testing Gemini API with detailed output...")
    
    gemini = get_gemini_client()
    
    messages = [
        {"role": "system", "content": "You are a helpful loan assistant. Be friendly and persuasive."},
        {"role": "user", "content": "Hello, I need a loan of 100000"}
    ]
    
    print(f"\nSending messages: {messages}")
    
    response = gemini.chat_completion(messages, temperature=0.7, max_tokens=200)
    
    print(f"\nResponse type: {type(response)}")
    print(f"Response: {response}")
    
    if response:
        print("\n✓ SUCCESS: Gemini returned a response!")
        print(f"Length: {len(response)} characters")
    else:
        print("\n✗ FAILED: Gemini returned None")
    
    return response

if __name__ == "__main__":
    test_gemini_detailed()
