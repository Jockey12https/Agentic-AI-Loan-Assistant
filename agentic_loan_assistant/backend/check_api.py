import os
from agentic_loan_assistant.backend.llm_orchestrator import client, OPENAI_AVAILABLE

print("=== API Key Status ===")
key = os.getenv('OPENAI_API_KEY')
print(f"API Key: {'SET' if key else 'NOT SET'}")
if key:
    print(f"Key Length: {len(key)} characters")
print(f"OpenAI Library: {'Available' if OPENAI_AVAILABLE else 'Not Available'}")
print(f"Client Initialized: {'YES - LLM Active!' if client else 'NO - Using Fallback'}")
if client:
    print("\n[SUCCESS] OpenAI API is configured and ready!")
else:
    print("\n[INFO] System is using fallback mode (keyword-based)")

