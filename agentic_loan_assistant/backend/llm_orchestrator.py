# llm_orchestrator.py - Gemini-powered LLM orchestration with persuasive sales capabilities
import os
from typing import Dict, Any, Optional, List
from datetime import datetime
import json

# Import Google Gemini client (official API - FREE!)
try:
    from . import google_gemini_client
    GOOGLE_GEMINI_AVAILABLE = True
except ImportError:
    GOOGLE_GEMINI_AVAILABLE = False
    print("Warning: google_gemini_client not available")

# Import RapidAPI clients as fallback
try:
    from . import api_clients
    RAPIDAPI_AVAILABLE = True
except ImportError:
    RAPIDAPI_AVAILABLE = False
    print("Warning: api_clients not available. Using fallback responses.")

def get_time_based_greeting() -> str:
    """Generate greeting based on time of day"""
    hour = datetime.now().hour
    if 5 <= hour < 12:
        return "Good morning"
    elif 12 <= hour < 17:
        return "Good afternoon"
    elif 17 <= hour < 21:
        return "Good evening"
    else:
        return "Hello"

def detect_mood(message: str) -> str:
    """
    Detect user mood from message
    Returns: happy, frustrated, anxious, confused, neutral
    """
    message_lower = message.lower()
    
    # Frustrated indicators
    if any(word in message_lower for word in ["urgent", "asap", "quickly", "frustrated", "annoyed", "problem"]):
        return "frustrated"
    
    # Anxious indicators
    if any(word in message_lower for word in ["worried", "concerned", "nervous", "afraid", "unsure", "help"]):
        return "anxious"
    
    # Happy indicators
    if any(word in message_lower for word in ["great", "excellent", "perfect", "wonderful", "thanks", "thank you"]):
        return "happy"
    
    # Confused indicators
    if any(word in message_lower for word in ["confused", "don't understand", "unclear", "what", "how", "?"]):
        return "confused"
    
    return "neutral"

def detect_intent_with_llm(
    user_message: str, 
    customer_context: Optional[Dict] = None,
    conversation_history: Optional[List[Dict]] = None
) -> str:
    """
    Use Google Gemini (or fallback LLMs) to detect user intent from their message.
    Priority: Google Gemini > RapidAPI Gemini > DeepSeek > Fallback
    Returns one of: greeting, check_limit, loan_inquiry, apply_loan, check_status, affirmative, negative, general
    """
    
    system_prompt = """You are an intent classifier for a loan assistant chatbot. 
Analyze the user's message and classify it into one of these intents:
- greeting: User is greeting (hello, hi, good morning, etc.)
- check_limit: User wants to know their loan limit or eligibility
- loan_inquiry: User is asking about loans, wants to borrow, needs money
- apply_loan: User wants to apply for a loan
- check_status: User wants to check application or account status
- affirmative: User is confirming/agreeing (yes, ok, sure, proceed, etc.)
- negative: User is declining/rejecting (no, not interested, maybe later, etc.)
- general: General questions or unclear intent

Consider the conversation context if provided. Respond with ONLY the intent name, nothing else."""

    messages = [{"role": "system", "content": system_prompt}]
    
    # Add conversation history for context
    if conversation_history:
        messages.extend(conversation_history[-3:])
    
    messages.append({"role": "user", "content": user_message})

    # Try 1: Google Gemini (Official API - FREE!)
    if GOOGLE_GEMINI_AVAILABLE:
        try:
            google_gemini = google_gemini_client.get_google_gemini_client()
            response = google_gemini.chat_completion(messages, temperature=0.3, max_tokens=10)
            
            if response:
                intent = response.strip().lower()
                valid_intents = ["greeting", "check_limit", "loan_inquiry", "apply_loan", "check_status", "affirmative", "negative", "general"]
                if intent in valid_intents:
                    print(f"✓ Intent detected by Google Gemini: {intent}")
                    return intent
        except Exception as e:
            print(f"Google Gemini intent detection error: {e}")
    
    # Try 2: RapidAPI Gemini (fallback)
    if RAPIDAPI_AVAILABLE:
        try:
            gemini = api_clients.get_gemini_client()
            response = gemini.chat_completion(messages, temperature=0.3, max_tokens=10)
            
            if response:
                intent = response.strip().lower()
                valid_intents = ["greeting", "check_limit", "loan_inquiry", "apply_loan", "check_status", "affirmative", "negative", "general"]
                if intent in valid_intents:
                    print(f"✓ Intent detected by RapidAPI Gemini: {intent}")
                    return intent
        except Exception as e:
            print(f"RapidAPI Gemini intent detection error: {e}")
        
        # Try 3: DeepSeek (fallback)
        try:
            deepseek = api_clients.get_deepseek_client()
            response = deepseek.chat_completion(messages, temperature=0.3)
            if response:
                intent = response.strip().lower()
                valid_intents = ["greeting", "check_limit", "loan_inquiry", "apply_loan", "check_status", "affirmative", "negative", "general"]
                if intent in valid_intents:
                    print(f"✓ Intent detected by DeepSeek: {intent}")
                    return intent
        except Exception as e:
            print(f"DeepSeek intent detection error: {e}")
    
    # Fallback to keyword-based detection
    print("Using fallback keyword-based intent detection")
    return _fallback_intent_detection(user_message)

def generate_response_with_llm(
    user_message: str,
    intent: str,
    customer: Dict,
    offer: Dict,
    kyc: Dict,
    requested_amount: Optional[int] = None,
    conversation_history: Optional[List[Dict]] = None,
    agent_role: str = "sales"
) -> str:
    """
    Use Google Gemini (or fallback LLMs) to generate natural, persuasive responses.
    Priority: Google Gemini > RapidAPI Gemini > DeepSeek > Fallback
    """
    
    # Detect user mood
    mood = detect_mood(user_message)
    
    # Build context for LLM
    greeting = get_time_based_greeting()
    context = f"""Customer Information:
- Name: {customer.get('name', 'N/A')}
- Pre-approved Loan Limit: INR {offer.get('pre_approved_limit', 0):,}
- Credit Score: {customer.get('credit_score', 'N/A')}
- City: {customer.get('city', 'N/A')}
- Current Loans: INR {customer.get('current_loans', 0):,}
- Age: {customer.get('age', 'N/A')}
- KYC Status: Verified ✓
"""
    
    if requested_amount:
        context += f"- Requested Loan Amount: INR {requested_amount:,}\n"
    
    # Mood-based response adjustment
    mood_guidance = {
        "frustrated": "The customer seems frustrated. Be extra empathetic, apologize for any inconvenience, and assure them you'll resolve things quickly.",
        "anxious": "The customer seems anxious or worried. Be reassuring, patient, and explain things clearly to build confidence.",
        "happy": "The customer seems happy and positive. Match their enthusiasm and energy!",
        "confused": "The customer seems confused. Be extra clear, break things down step-by-step, and ask if they need clarification.",
        "neutral": "Maintain a professional, friendly, and helpful tone."
    }
    
    # Agent-specific personality
    agent_personalities = {
        "sales": """You are a charismatic, persuasive sales executive at a leading financial institution.
Your goal is to:
- Build rapport and trust with the customer
- Understand their financial needs and goals
- Highlight the benefits of taking a personal loan (financial freedom, achieving dreams, etc.)
- Create urgency without being pushy
- Use storytelling and emotional appeal
- Address objections gracefully
- Guide them towards saying 'yes'

Sales techniques to use:
- Ask open-ended questions to understand needs
- Use social proof ("Many customers like you have benefited...")
- Highlight limited-time offers or special rates
- Paint a picture of how the loan will improve their life
- Use positive, confident language
- Create FOMO (fear of missing out) subtly""",
        
        "verification": """You are a professional verification specialist.
Your role is to:
- Confirm customer identity and KYC details
- Be thorough but friendly
- Explain why verification is important (security, compliance)
- Make the customer feel safe and protected""",
        
        "underwriting": """You are a credit analyst and underwriting specialist.
Your role is to:
- Explain the loan approval process clearly
- Communicate decisions (approval/rejection) professionally
- If approved: Congratulate and explain next steps
- If rejected: Be empathetic, explain reasons, suggest alternatives
- Always maintain customer dignity""",
        
        "system": """You are a helpful system assistant providing information and guidance."""
    }
    
    system_prompt = f"""You are {agent_role.upper()} AGENT for a premier NBFC (Non-Banking Financial Company).

{agent_personalities.get(agent_role, agent_personalities['system'])}

{context}

Current Situation:
- User's mood: {mood}
- {mood_guidance[mood]}
- Greeting to use: "{greeting}"
- Detected intent: {intent}

Guidelines:
- Be conversational and human-like, not robotic
- Use the customer's name naturally
- Keep responses concise (2-4 sentences max)
- Use emojis appropriately to add warmth
- Be persuasive but genuine
- Show enthusiasm about helping them
- If sales agent: Focus on benefits, not just features
- Build emotional connection
- Make them feel valued and special

CRITICAL: You are a SALES PROFESSIONAL. Your job is to convince customers to take loans by understanding their needs and showing how a loan can help them achieve their goals. Be persuasive, empathetic, and solution-oriented."""

    messages = [{"role": "system", "content": system_prompt}]
    
    # Add conversation history for context
    if conversation_history:
        messages.extend(conversation_history[-5:])
    
    user_prompt = f"""User's message: "{user_message}"

Generate a persuasive, natural response that:
1. Addresses their message directly
2. Builds rapport and trust
3. Moves the conversation towards loan approval
4. Feels human and conversational"""
    
    messages.append({"role": "user", "content": user_prompt})

    # Try 1: Google Gemini (Official API - FREE!)
    if GOOGLE_GEMINI_AVAILABLE:
        try:
            google_gemini = google_gemini_client.get_google_gemini_client()
            response = google_gemini.chat_completion(messages, temperature=0.8, max_tokens=300)
            
            if response:
                print(f"✓ Response generated by Google Gemini")
                return response.strip()
        except Exception as e:
            print(f"Google Gemini response generation error: {e}")
    
    # Try 2: RapidAPI Gemini (fallback)
    if RAPIDAPI_AVAILABLE:
        try:
            gemini = api_clients.get_gemini_client()
            response = gemini.chat_completion(messages, temperature=0.8, max_tokens=300)
            
            if response:
                print(f"✓ Response generated by RapidAPI Gemini")
                return response.strip()
        except Exception as e:
            print(f"RapidAPI Gemini response generation error: {e}")
        
        # Try 3: DeepSeek (fallback)
        try:
            deepseek = api_clients.get_deepseek_client()
            response = deepseek.chat_completion(messages, temperature=0.8)
            if response:
                print(f"✓ Response generated by DeepSeek")
                return response.strip()
        except Exception as e:
            print(f"DeepSeek response generation error: {e}")
    
    # Fallback to intelligent pre-designed responses
    print("Using fallback persuasive response")
    return _fallback_response(intent, customer, offer, kyc, requested_amount, agent_role)

def generate_proactive_suggestions(
    customer: Dict,
    offer: Dict,
    conversation_history: Optional[List[Dict]] = None
) -> List[str]:
    """
    Generate proactive, persuasive suggestions based on customer profile.
    """
    suggestions = []
    
    pre_approved = offer.get('pre_approved_limit', 0)
    credit_score = customer.get('credit_score', 0)
    current_loans = customer.get('current_loans', 0)
    
    # Persuasive suggestions
    if conversation_history is None or len(conversation_history) < 2:
        suggestions.append(f"💰 You're pre-approved for INR {pre_approved:,}!")
    
    if credit_score >= 750:
        suggestions.append(f"⭐ Excellent credit! Get lowest interest rates")
    
    if current_loans == 0:
        suggestions.append("🎯 No existing loans? Perfect time to invest in yourself!")
    
    # Emotional appeal suggestions
    suggestions.append("✨ Achieve your dreams faster with instant approval")
    
    return suggestions[:3]

def generate_personalized_loan_offers(customer: Dict, offer: Dict) -> List[Dict]:
    """
    Generate persuasive, personalized loan offers.
    """
    pre_approved = offer.get('pre_approved_limit', 0)
    credit_score = customer.get('credit_score', 0)
    
    offers = []
    
    # Small loan - positioned as "starter" or "emergency fund"
    if pre_approved >= 50000:
        offers.append({
            "amount": min(50000, pre_approved),
            "tenure": 24,
            "rate": 10.5 if credit_score >= 750 else 11.5,
            "purpose": "Emergency fund or quick needs",
            "tagline": "Perfect for immediate needs! 🚀",
            "emi": None
        })
    
    # Medium loan - positioned as "life goals"
    if pre_approved >= 100000:
        offers.append({
            "amount": min(100000, pre_approved),
            "tenure": 36,
            "rate": 11.0 if credit_score >= 750 else 12.0,
            "purpose": "Education, wedding, or home renovation",
            "tagline": "Most popular choice! ⭐",
            "emi": None
        })
    
    # Large loan - positioned as "dream achiever"
    if pre_approved >= 150000:
        offers.append({
            "amount": pre_approved,
            "tenure": 60,
            "rate": 11.5 if credit_score >= 750 else 12.5,
            "purpose": "Big dreams deserve big support",
            "tagline": "Maximum approved amount! 💎",
            "emi": None
        })
    
    return offers

# Fallback functions when Gemini is not available
def _fallback_intent_detection(message: str) -> str:
    """Simple keyword-based intent detection as fallback"""
    message_lower = message.lower().strip()
    words = message_lower.split()
    
    # Negative indicators
    negative_words = ["no", "not interested", "maybe later", "don't want", "cancel", "stop"]
    if any(word in message_lower for word in negative_words):
        return "negative"
    
    affirmative_words = ["yes", "yeah", "yep", "ok", "okay", "sure", "proceed", "interested"]
    if any(message_lower.startswith(word + " ") or message_lower == word for word in affirmative_words) or (len(words) <= 3 and any(word in affirmative_words for word in words)):
        return "affirmative"
    
    if any(word in message_lower for word in ["hello", "hi", "hey", "good morning", "good afternoon", "good evening"]):
        return "greeting"
    if any(word in message_lower for word in ["limit", "eligible", "how much can i", "pre-approved"]):
        return "check_limit"
    if any(word in message_lower for word in ["loan", "borrow", "need money", "want money", "need funds"]):
        return "loan_inquiry"
    if any(word in message_lower for word in ["apply", "application", "get loan"]):
        return "apply_loan"
    if any(word in message_lower for word in ["status", "track", "check application"]):
        return "check_status"
    
    return "general"

def _fallback_response(
    intent: str, 
    customer: Dict, 
    offer: Dict, 
    kyc: Dict, 
    requested_amount: Optional[int] = None,
    agent_role: str = "sales"
) -> str:
    """Generate persuasive fallback response when Gemini is not available"""
    name = customer.get('name', 'Customer')
    limit = offer.get('pre_approved_limit', 0)
    greeting = get_time_based_greeting()
    
    if intent == "greeting":
        return f"{greeting} {name}! 👋 I'm thrilled to help you explore our exclusive loan offers today. You're pre-approved for up to INR {limit:,}! How can I help you achieve your financial goals?"
    elif intent == "check_limit":
        return f"{greeting} {name}! 🎉 Great news! You're pre-approved for INR {limit:,} with instant approval. Many customers like you have used this to achieve their dreams. Would you like to know more?"
    elif intent == "loan_inquiry":
        if requested_amount:
            return f"Excellent choice, {name}! 💰 INR {requested_amount:,} can really help you achieve your goals. With your excellent profile, we can get this approved right away. Shall we proceed?"
        return f"{greeting} {name}! I'd love to help you get the funds you need. With your pre-approved limit of INR {limit:,}, we can make it happen quickly. What amount would work best for your needs?"
    elif intent == "affirmative":
        return f"Fantastic, {name}! 🎯 I'm excited to help you move forward. Your pre-approved limit is INR {limit:,}. What amount would you like to start with? We can get instant approval!"
    elif intent == "negative":
        return f"I completely understand, {name}. No pressure at all! 😊 Just remember, your pre-approved offer of INR {limit:,} is waiting whenever you're ready. Is there anything else I can help clarify?"
    else:
        return f"{greeting} {name}! 😊 I'm here to help you with any questions about our personal loan offers. You have a pre-approved limit of INR {limit:,} ready to use. What would you like to know?"
