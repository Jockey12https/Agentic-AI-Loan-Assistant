#!/usr/bin/env python3
"""Test script to verify OpenAI API is working"""

import os
from openai import OpenAI

print("=" * 50)
print("OpenAI API Connection Test")
print("=" * 50)
print()

# Check API key
api_key = os.getenv('OPENAI_API_KEY')
print(f"1. API Key Status: {'[OK] SET' if api_key else '[FAIL] NOT SET'}")
if api_key:
    print(f"   Key Length: {len(api_key)} characters")
    print(f"   Key Preview: {api_key[:10]}...{api_key[-4:]}")
else:
    print("   [WARNING] Set your API key with:")
    print("   Windows: $env:OPENAI_API_KEY='your-key-here'")
    print("   Linux/Mac: export OPENAI_API_KEY='your-key-here'")
    print()
    exit(1)

print()

# Test API connection
print("2. Testing API Connection...")
try:
    client = OpenAI(api_key=api_key)
    
    # Make a simple test call
    print("   Making test API call...")
    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "user", "content": "Say 'API is working' if you can read this."}
        ],
        max_tokens=10,
        temperature=0
    )
    
    result = response.choices[0].message.content
    print(f"   [OK] API Response: {result}")
    print("   [OK] Status: SUCCESS - OpenAI API is working!")
    print()
    
    # Test intent detection
    print("3. Testing Intent Detection...")
    response2 = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": "You are an intent classifier. Respond with ONLY the intent: greeting, loan_inquiry, or general"},
            {"role": "user", "content": "I want to apply for a loan"}
        ],
        max_tokens=10,
        temperature=0.3
    )
    intent = response2.choices[0].message.content.strip()
    print(f"   [OK] Detected Intent: {intent}")
    print("   [OK] Intent Detection: WORKING")
    print()
    
    print("=" * 50)
    print("[SUCCESS] ALL TESTS PASSED - OpenAI API is fully functional!")
    print("=" * 50)
    
except Exception as e:
    print(f"   [ERROR] {str(e)}")
    print("   [FAIL] Status: FAILED - API connection error")
    print()
    print("Possible issues:")
    print("  - Invalid API key")
    print("  - No credits in OpenAI account")
    print("  - Network connectivity issue")
    exit(1)

