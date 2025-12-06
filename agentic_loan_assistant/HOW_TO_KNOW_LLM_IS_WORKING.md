# How to Know ChatGPT/OpenAI is Working

## Quick Visual Test

### ✅ LLM IS WORKING (ChatGPT Active):
- **Responses are natural and conversational**
- **Handles variations in phrasing** (e.g., "I need money" vs "I want a loan" both work)
- **Context-aware responses** that reference customer data naturally
- **Different responses for similar queries** (not repetitive)
- **Understands complex sentences** like "I want to borrow some money for my business"

### ❌ LLM NOT WORKING (Fallback Mode):
- **Generic, template-like responses**
- **Only responds to exact keywords**
- **Same response for similar queries**
- **Doesn't understand variations** in phrasing
- **Response starts with "LLM (stub)"** or mentions "fallback"

## Test Examples

### Test 1: Natural Language Understanding
**Send:** "Hey, I'm interested in getting some credit"
- **LLM Working:** Understands "credit" = loan, responds naturally
- **Fallback:** May not understand, gives generic response

### Test 2: Complex Query
**Send:** "I need money for my daughter's wedding next month"
- **LLM Working:** Understands context, asks about amount needed
- **Fallback:** May only catch "money" keyword, generic response

### Test 3: Variation Test
**Send these three messages:**
1. "I want a loan"
2. "I need to borrow money"
3. "Can I get credit?"

- **LLM Working:** All three get appropriate, slightly different responses
- **Fallback:** Similar or identical responses to all three

## Technical Verification

### Method 1: Check Backend Logs
When you start the backend server, look for:
- ✅ `"OpenAI client initialized successfully"` = LLM is active
- ❌ `"Warning: OPENAI_API_KEY not set"` = Using fallback

### Method 2: Run Verification Script
```powershell
cd agentic_loan_assistant\backend
python verify_llm.py
```

This will show:
- API key status
- Client initialization status
- Actual ChatGPT API test
- Response generation test

### Method 3: Check Response Quality
**LLM responses are:**
- More conversational and natural
- Contextually relevant
- Vary based on input phrasing
- Show understanding of intent

**Fallback responses are:**
- Template-based
- Repetitive
- Only respond to specific keywords
- Less natural sounding

## Quick Test Commands

### Test if API Key is Set:
```powershell
python -c "import os; print('API Key:', 'SET' if os.getenv('OPENAI_API_KEY') else 'NOT SET')"
```

### Test if Client is Initialized:
```powershell
python -c "from agentic_loan_assistant.backend.llm_orchestrator import client; print('LLM Active:', 'YES' if client else 'NO')"
```

### Test Actual API Call:
```powershell
python agentic_loan_assistant\backend\test_openai.py
```

## What to Look For in Chat

### ✅ Signs LLM is Working:
1. **Natural greetings** - "Hello! How can I assist you with your loan needs today?"
2. **Context understanding** - Remembers you asked about loans
3. **Varied responses** - Different phrasings get different (but appropriate) responses
4. **Handles typos/misspellings** - Still understands intent
5. **Conversational flow** - Feels like talking to a person

### ❌ Signs Using Fallback:
1. **Template responses** - Always same format
2. **Keyword matching only** - "loan" triggers same response every time
3. **No context** - Doesn't remember previous messages
4. **Generic answers** - "Hello [name], your limit is [amount]"
5. **Repetitive** - Same response for similar queries

## Expected Behavior

### With LLM (ChatGPT):
```
You: "Hi, I'm looking for financial assistance"
Bot: "Hello! I'd be happy to help you with financial assistance. 
      I can help you with loan applications, checking your eligibility, 
      or answering questions about our loan products. What would you like to know?"
```

### Without LLM (Fallback):
```
You: "Hi, I'm looking for financial assistance"
Bot: "Hello [name], your pre-approved loan limit is INR [amount]. 
      How can I help you?"
```

## Summary

**The easiest way to know:** Run the verification script and check if responses feel natural and varied. If every response sounds different and contextual, ChatGPT is working!

