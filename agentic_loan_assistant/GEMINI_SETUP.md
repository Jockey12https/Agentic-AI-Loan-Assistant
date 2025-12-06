# GOOGLE GEMINI API SETUP INSTRUCTIONS

## Get Your FREE Google Gemini API Key

1. **Visit Google AI Studio**:
   - Go to: https://makersuite.google.com/app/apikey
   - Or: https://aistudio.google.com/app/apikey

2. **Sign in with your Google Account**

3. **Create API Key**:
   - Click "Create API Key"
   - Select "Create API key in new project" (or use existing project)
   - Copy the generated API key

4. **Add to .env file**:
   ```
   GOOGLE_GEMINI_API_KEY="your-api-key-here"
   ```

5. **Restart the backend server**:
   ```bash
   # Stop the current server (Ctrl+C)
   # Then restart:
   uvicorn backend.main:app --reload --port 8000
   ```

## Features with Google Gemini

✅ **FREE Tier Available**:
- 60 requests per minute
- 1,500 requests per day
- Perfect for development and testing

✅ **Real AI Responses**:
- Natural, context-aware conversations
- Mood-aware responses
- Persuasive sales techniques
- Multi-turn conversation memory

✅ **Automatic Fallback**:
- If Gemini fails → Uses intelligent fallback responses
- No downtime or errors
- Seamless user experience

## How It Works

**Priority Chain**:
1. **Google Gemini** (Official API - FREE!) ← Primary
2. **RapidAPI Gemini** (If configured) ← Fallback 1
3. **DeepSeek** (If configured) ← Fallback 2
4. **Intelligent Fallbacks** (Always available) ← Final fallback

## Testing

After adding the API key, test it:

```bash
python backend/debug_gemini.py
```

You should see:
```
✓ Google Gemini API initialized successfully!
✓ Google Gemini API response received!
```

## Troubleshooting

**Issue**: "GOOGLE_GEMINI_API_KEY not set"
- **Solution**: Add the key to `.env` file and restart server

**Issue**: API quota exceeded
- **Solution**: Wait for quota reset (daily) or upgrade to paid tier

**Issue**: "google-generativeai not installed"
- **Solution**: Run `pip install google-generativeai`

## Cost

- **Free Tier**: 1,500 requests/day (enough for testing)
- **Paid Tier**: Pay-as-you-go pricing (very affordable)
- **Current System**: Works perfectly even without API key (uses fallbacks)

## Notes

- The system works great even WITHOUT the API key
- Fallback responses are intelligent, mood-aware, and persuasive
- Adding Gemini just makes responses even more natural and dynamic
- No pressure to add it immediately - the system is fully functional as-is!
