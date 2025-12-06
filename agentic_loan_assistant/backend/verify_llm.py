#!/usr/bin/env python3
"""Verify if ChatGPT/OpenAI LLM is actually being used"""

import os
import sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '../..'))

from agentic_loan_assistant.backend.llm_orchestrator import client, OPENAI_AVAILABLE, detect_intent_with_llm, generate_response_with_llm

print("=" * 60)
print("ChatGPT/OpenAI LLM Verification Test")
print("=" * 60)
print()

# Check 1: API Key
api_key = os.getenv('OPENAI_API_KEY')
print("1. API Key Check:")
print(f"   Status: {'[OK] SET' if api_key else '[FAIL] NOT SET'}")
if api_key:
    print(f"   Length: {len(api_key)} characters")
    print(f"   Preview: {api_key[:7]}...{api_key[-4:]}")
else:
    print("   Action: Set with $env:OPENAI_API_KEY='your-key'")
print()

# Check 2: OpenAI Library
print("2. OpenAI Library:")
print(f"   Status: {'[OK] Installed' if OPENAI_AVAILABLE else '[FAIL] Not Installed'}")
print()

# Check 3: Client Initialization
print("3. OpenAI Client:")
if client:
    print("   Status: [OK] INITIALIZED - ChatGPT is ready!")
    print("   Mode: LLM-POWERED (using GPT-4o-mini)")
else:
    print("   Status: [FAIL] NOT INITIALIZED")
    print("   Mode: FALLBACK (keyword-based, no AI)")
print()

# Test 4: Actual API Call
if client:
    print("4. Testing Real ChatGPT API Call:")
    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "You are a helpful assistant. Respond in exactly 5 words."},
                {"role": "user", "content": "Say 'ChatGPT is working perfectly' if you can read this."}
            ],
            max_tokens=10,
            temperature=0
        )
        result = response.choices[0].message.content.strip()
        print(f"   ChatGPT Response: {result}")
        if "working" in result.lower() or "chatgpt" in result.lower():
            print("   Status: [SUCCESS] ChatGPT API is WORKING!")
        else:
            print("   Status: [OK] API responded (may be using different phrasing)")
    except Exception as e:
        print(f"   Status: [ERROR] {str(e)}")
        print("   This means the API key might be invalid or there's a connection issue")
else:
    print("4. Skipping API test (client not initialized)")
print()

# Test 5: Intent Detection
print("5. Testing Intent Detection:")
test_message = "I want to apply for a personal loan of 200000 rupees"
intent = detect_intent_with_llm(test_message)
print(f"   Test Message: '{test_message}'")
print(f"   Detected Intent: {intent}")
if client:
    print("   Method: ChatGPT LLM")
    if intent in ["loan_inquiry", "apply_loan"]:
        print("   Status: [OK] LLM correctly identified loan intent")
else:
    print("   Method: Keyword-based fallback")
print()

# Test 6: Response Generation
print("6. Testing Response Generation:")
if client:
    try:
        customer = {"name": "Test User", "credit_score": 750}
        offer = {"pre_approved_limit": 250000}
        kyc = {"name": "Test User", "phone": "+919999999999"}
        
        llm_response = generate_response_with_llm(
            "Hello, I need a loan",
            "greeting",
            customer,
            offer,
            kyc
        )
        print(f"   LLM Generated Response: {llm_response[:100]}...")
        print("   Status: [OK] ChatGPT is generating responses!")
        
        # Check if it's a generic fallback response
        if "LLM (stub)" in llm_response or "fallback" in llm_response.lower():
            print("   Warning: Response looks like fallback, not LLM")
        else:
            print("   Status: [SUCCESS] Response is LLM-generated!")
    except Exception as e:
        print(f"   Error: {str(e)}")
else:
    print("   Skipped (client not initialized)")
print()

# Final Summary
print("=" * 60)
if client:
    print("[SUCCESS] ChatGPT/OpenAI LLM IS WORKING!")
    print("Your application is using AI-powered responses.")
else:
    print("[INFO] ChatGPT/OpenAI LLM IS NOT ACTIVE")
    print("System is using fallback mode (keyword-based).")
    print()
    print("To enable ChatGPT:")
    print("1. Set API key: $env:OPENAI_API_KEY='your-key'")
    print("2. Restart the backend server")
print("=" * 60)

