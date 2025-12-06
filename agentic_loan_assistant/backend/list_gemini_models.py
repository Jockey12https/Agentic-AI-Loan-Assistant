# List available Gemini models
import os
from dotenv import load_dotenv

load_dotenv()

try:
    import google.generativeai as genai
    
    genai.configure(api_key=os.environ["GOOGLE_GEMINI_API_KEY"])
    
    print("Listing available Gemini models...")
    print("=" * 60)
    
    for model in genai.list_models():
        if 'generateContent' in model.supported_generation_methods:
            print(f"✓ {model.name}")
            print(f"  Description: {model.description}")
            print(f"  Methods: {model.supported_generation_methods}")
            print()
    
except Exception as e:
    print(f"Error: {e}")
