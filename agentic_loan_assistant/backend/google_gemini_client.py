# google_gemini_client.py - Official Google Gemini API integration
# Trigger reload
# Trigger reload for new API key
import os
from typing import List, Dict, Optional
from dotenv import load_dotenv

load_dotenv(override=True)

try:
    import google.generativeai as genai
    GEMINI_AVAILABLE = True
except ImportError:
    GEMINI_AVAILABLE = False
    print("Warning: google-generativeai not installed. Run: pip install google-generativeai")

class GoogleGeminiClient:
    """Client for Google's official Gemini API (Free tier available)"""
    
    def __init__(self):
        self.api_key = os.getenv("GOOGLE_GEMINI_API_KEY", "")
        self.model = None
        
        if GEMINI_AVAILABLE and self.api_key:
            try:
                genai.configure(api_key=self.api_key)
                
                # Dynamically find available models
                available_models = []
                try:
                    for m in genai.list_models():
                        if 'generateContent' in m.supported_generation_methods:
                            available_models.append(m.name)
                except Exception as e:
                    print(f"Error listing models: {e}")

                print(f"Available Gemini models: {available_models}")

                # Preference list - Prioritize stable models to avoid 429s from experimental quotas
                # Preference list - Prioritize stable models
                preferences = [
                    'gemini-flash-latest',
                    'gemini-2.0-flash',
                    'gemini-1.5-flash',
                    'gemini-1.5-pro',
                    'gemini-pro'
                ]
                
                selected_model_name = None
                
                # Strict selection logic
                for pref in preferences:
                    # 1. Exact match (handle 'models/' prefix)
                    exact = [m for m in available_models if m == pref or m == f"models/{pref}"]
                    if exact:
                        selected_model_name = exact[0]
                        break
                        
                    # 2. Substring match but EXCLUDE experimental if not requested
                    candidates = [m for m in available_models if pref in m]
                    if 'exp' not in pref:
                        candidates = [m for m in candidates if 'exp' not in m]
                    
                    if candidates:
                        selected_model_name = candidates[0]
                        break
                
                # Fallback to first available if no preference met
                if not selected_model_name and available_models:
                    selected_model_name = available_models[0]
                
                if selected_model_name:
                    print(f"Selected Gemini model: {selected_model_name}")
                    self.model = genai.GenerativeModel(selected_model_name)
                else:
                    print("❌ No suitable Gemini models found. Using default fallback.")
                    # Last ditch effort
                    self.model = genai.GenerativeModel('gemini-pro')
                    
            except Exception as e:
                print(f"Error initializing Gemini: {e}")
                self.model = None
        elif not self.api_key:
            print("ℹ️ GOOGLE_GEMINI_API_KEY not set in .env file")
            print("   Get your free API key from: https://makersuite.google.com/app/apikey")
        
    def chat_completion(
        self, 
        messages: List[Dict[str, str]], 
        temperature: float = 0.7,
        max_tokens: int = 500
    ) -> Optional[str]:
        """
        Send chat completion request to Google Gemini
        
        Args:
            messages: List of message dicts with 'role' and 'content'
            temperature: Sampling temperature (0.0 to 1.0)
            max_tokens: Maximum tokens in response
            
        Returns:
            Response text from Gemini or None if error
        """
        if not self.model:
            return None
        
        try:
            # Convert messages to Gemini format
            # Gemini uses a simpler format - just the conversation text
            conversation_text = self._format_messages(messages)
            
            # Configure generation parameters
            generation_config = genai.types.GenerationConfig(
                temperature=temperature,
                max_output_tokens=max_tokens,
            )
            
            # Generate response
            response = self.model.generate_content(
                conversation_text,
                generation_config=generation_config
            )
            
            if response and response.text:
                print("✓ Google Gemini API response received!")
                return response.text.strip()
            else:
                print("⚠️ Gemini returned empty response")
                return None
                
        except Exception as e:
            print(f"Google Gemini API error: {e}")
            return None
    
    def _format_messages(self, messages: List[Dict[str, str]]) -> str:
        """Convert OpenAI-style messages to Gemini prompt format"""
        formatted = []
        
        for msg in messages:
            role = msg.get('role', 'user')
            content = msg.get('content', '')
            
            if role == 'system':
                formatted.append(f"System Instructions: {content}")
            elif role == 'user':
                formatted.append(f"User: {content}")
            elif role == 'assistant':
                formatted.append(f"Assistant: {content}")
        
        return "\n\n".join(formatted)


# Global client instance
_google_gemini_client = None

def get_google_gemini_client() -> GoogleGeminiClient:
    """Get or create Google Gemini client instance"""
    global _google_gemini_client
    if _google_gemini_client is None:
        _google_gemini_client = GoogleGeminiClient()
    return _google_gemini_client
