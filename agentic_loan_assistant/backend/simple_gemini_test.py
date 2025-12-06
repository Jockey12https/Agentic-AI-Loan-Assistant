# Simple direct test of Gemini API
import os
os.environ["GOOGLE_GEMINI_API_KEY"] = "AIzaSyDZqS4186G3uvuL4wIzQhIkx-hKeJkvfdw"

import google.generativeai as genai

print("Configuring Gemini...")
genai.configure(api_key=os.environ["GOOGLE_GEMINI_API_KEY"])

print("Creating model...")
model = genai.GenerativeModel('gemini-pro')

print("Sending test prompt...")
try:
    response = model.generate_content("Say 'Hello, I am Gemini!' in a friendly way.")
    print(f"\n✅ SUCCESS!\nResponse: {response.text}")
except Exception as e:
    print(f"\n❌ ERROR: {e}")
    print(f"Error type: {type(e)}")
    
    # Try to get more details
    if hasattr(e, 'args'):
        print(f"Error args: {e.args}")
