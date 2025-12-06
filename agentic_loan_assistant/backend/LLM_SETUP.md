# LLM/GEN AI Setup Guide

The loan assistant now uses OpenAI's GPT models for intelligent intent detection and natural response generation.

## Setup Instructions

### 1. Install Dependencies

```bash
pip install -r requirements.txt
```

This will install the `openai` package along with other dependencies.

### 2. Get OpenAI API Key

1. Go to [OpenAI Platform](https://platform.openai.com/)
2. Sign up or log in
3. Navigate to API Keys section
4. Create a new API key
5. Copy the API key

### 3. Set Environment Variable

**Windows (PowerShell):**
```powershell
$env:OPENAI_API_KEY="your-api-key-here"
```

**Windows (Command Prompt):**
```cmd
set OPENAI_API_KEY=your-api-key-here
```

**Linux/Mac:**
```bash
export OPENAI_API_KEY="your-api-key-here"
```

**Permanent Setup (Windows):**
1. Open System Properties → Environment Variables
2. Add new User Variable: `OPENAI_API_KEY` = `your-api-key-here`

**Permanent Setup (Linux/Mac):**
Add to `~/.bashrc` or `~/.zshrc`:
```bash
export OPENAI_API_KEY="your-api-key-here"
```

### 4. Verify Setup

The server will automatically detect if the API key is set. When you start the server, you should see:
- `OpenAI client initialized successfully` - if API key is set
- `Warning: OPENAI_API_KEY not set...` - if API key is missing (will use fallback)

## Features

### With OpenAI API Key:
- ✅ Intelligent intent detection using GPT-4o-mini
- ✅ Natural, contextual response generation
- ✅ Better understanding of user queries
- ✅ More conversational and human-like responses

### Without API Key (Fallback Mode):
- ✅ Still works with keyword-based intent detection
- ✅ Uses predefined responses
- ✅ All business logic (underwriting, verification) still functions

## Model Used

- **Model**: `gpt-4o-mini` (cost-effective, fast)
- **Temperature**: 0.3 for intent detection, 0.7 for responses
- **Max Tokens**: 10 for intent, 200 for responses

## Cost Considerations

- GPT-4o-mini is very cost-effective (~$0.15 per 1M input tokens, ~$0.60 per 1M output tokens)
- Typical conversation: ~100-200 tokens per request
- Estimated cost: < $0.01 per 100 conversations

## Testing

Test the LLM integration:
```bash
# Test with API key set
python -c "from agentic_loan_assistant.backend.llm_orchestrator import detect_intent_with_llm; print(detect_intent_with_llm('I want a loan of 100000'))"
```

## Troubleshooting

**Issue**: "OpenAI library not installed"
- **Solution**: Run `pip install openai`

**Issue**: "OPENAI_API_KEY not set"
- **Solution**: Set the environment variable as shown above

**Issue**: API errors
- **Solution**: Check your API key is valid and you have credits in your OpenAI account

