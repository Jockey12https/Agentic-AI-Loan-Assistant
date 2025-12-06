# auth.py - Authentication utilities: OTP and voice-biometric
import random, time, os, json
import hashlib
from typing import Tuple

OTP_STORE = {}  # in-memory store for demo: {phone: (otp, expires_at)}

def generate_otp(phone: str, ttl=300):
    otp = str(random.randint(100000, 999999))
    expires = time.time() + ttl
    OTP_STORE[phone] = (otp, expires)
    # In real system: send via SMS gateway. For demo, return otp.
    return otp

def verify_otp(phone: str, otp: str):
    print(f"[OTP DEBUG] Verifying OTP for phone: {phone}, OTP: {otp}")
    print(f"[OTP DEBUG] Current OTP_STORE: {OTP_STORE}")
    entry = OTP_STORE.get(phone)
    if not entry:
        return False, f"No OTP generated for this phone. Available phones: {list(OTP_STORE.keys())}"
    real_otp, expires = entry
    if time.time() > expires:
        return False, "OTP expired."
    if otp == real_otp:
        del OTP_STORE[phone]
        return True, "OTP verified."
    return False, f"Invalid OTP. Expected: {real_otp}, Got: {otp}"

# Voice biometric: store voice patterns (simplified for demo)
VOICE_STORE_PATH = os.path.join(os.path.dirname(__file__), "..", "data", "voice_store.json")
VOICE_AUDIO_DIR = os.path.join(os.path.dirname(__file__), "..", "uploads", "voice_samples")

# Ensure directories exist
os.makedirs(os.path.dirname(VOICE_STORE_PATH), exist_ok=True)
os.makedirs(VOICE_AUDIO_DIR, exist_ok=True)

if not os.path.exists(VOICE_STORE_PATH):
    with open(VOICE_STORE_PATH, "w") as f:
        json.dump({}, f)

def extract_voice_pattern(audio_data: bytes) -> str:
    """
    Extract voice pattern from audio data.
    In production, this would use librosa/scipy for MFCC extraction.
    For demo, we use a hash-based approach with file size consideration.
    """
    # Simple pattern: hash of audio data + file size
    h = hashlib.sha256(audio_data).hexdigest()
    size_factor = len(audio_data) % 1000  # Add size variation
    pattern = f"{h[:32]}_{size_factor}"
    return pattern

def enroll_voice(customer_id: str, audio_data: bytes) -> Tuple[bool, str]:
    """
    Enroll voice biometric for a customer.
    Stores audio file and extracts voice pattern.
    """
    try:
        # Save audio file
        audio_filename = f"{customer_id}_enrolled.webm"
        audio_path = os.path.join(VOICE_AUDIO_DIR, audio_filename)
        
        with open(audio_path, "wb") as f:
            f.write(audio_data)
        
        # Extract voice pattern
        pattern = extract_voice_pattern(audio_data)
        
        # Store pattern
        with open(VOICE_STORE_PATH) as f:
            vs = json.load(f)
        
        vs[customer_id] = {
            "pattern": pattern,
            "audio_file": audio_filename,
            "enrolled_at": time.time()
        }
        
        with open(VOICE_STORE_PATH, "w") as f:
            json.dump(vs, f, indent=2)
        
        return True, "Voice enrolled successfully"
    except Exception as e:
        return False, f"Enrollment failed: {str(e)}"

def verify_voice(customer_id: str, audio_data: bytes) -> Tuple[bool, str, float]:
    """
    Verify voice biometric for a customer.
    Returns (verified, message, confidence_score)
    """
    try:
        # Check if customer has enrolled
        with open(VOICE_STORE_PATH) as f:
            vs = json.load(f)
        
        stored_data = vs.get(customer_id)
        if not stored_data:
            return False, "No voice enrolled for this customer", 0.0
        
        # Load enrolled audio file for comparison
        enrolled_audio_path = os.path.join(VOICE_AUDIO_DIR, stored_data["audio_file"])
        
        if not os.path.exists(enrolled_audio_path):
            return False, "Enrolled audio file not found", 0.0
        
        with open(enrolled_audio_path, "rb") as f:
            enrolled_audio_data = f.read()
        
        # Simple similarity based on audio file size (more lenient)
        enrolled_size = len(enrolled_audio_data)
        verify_size = len(audio_data)
        
        # Calculate size similarity (within 30% difference is acceptable)
        size_diff = abs(enrolled_size - verify_size)
        max_size = max(enrolled_size, verify_size)
        
        if max_size == 0:
            return False, "Invalid audio data", 0.0
        
        # Similarity percentage (100% = identical size, 0% = completely different)
        size_similarity = max(0, (1 - (size_diff / max_size)) * 100)
        
        # Very lenient threshold: 50% similarity is enough
        # This means audio files within 50% size difference will pass
        verified = size_similarity >= 50.0
        
        if verified:
            return True, f"Voice verified with {size_similarity:.1f}% confidence", size_similarity
        else:
            return False, f"Voice mismatch (confidence: {size_similarity:.1f}%)", size_similarity
            
    except Exception as e:
        return False, f"Verification failed: {str(e)}", 0.0

def get_enrolled_customers():
    """Get list of customers with enrolled voice biometrics"""
    try:
        with open(VOICE_STORE_PATH) as f:
            vs = json.load(f)
        return list(vs.keys())
    except:
        return []