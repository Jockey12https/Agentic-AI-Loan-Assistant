# auth.py - Mock authentication utilities: OTP and voice-biometric
import random, time, os, json

OTP_STORE = {}  # in-memory store for demo: {phone: (otp, expires_at)}

def generate_otp(phone: str, ttl=300):
    otp = str(random.randint(100000, 999999))
    expires = time.time() + ttl
    OTP_STORE[phone] = (otp, expires)
    # In real system: send via SMS gateway. For demo, return otp.
    return otp

def verify_otp(phone: str, otp: str):
    entry = OTP_STORE.get(phone)
    if not entry:
        return False, "No OTP generated for this phone."
    real_otp, expires = entry
    if time.time() > expires:
        return False, "OTP expired."
    if otp == real_otp:
        del OTP_STORE[phone]
        return True, "OTP verified."
    return False, "Invalid OTP."

# Voice biometric mock: store simple voice "hashes" (not real biometric)
VOICE_STORE_PATH = os.path.join(os.path.dirname(__file__), "..", "data", "voice_store.json")
if not os.path.exists(VOICE_STORE_PATH):
    with open(VOICE_STORE_PATH, "w") as f:
        json.dump({}, f)

def enroll_voice(customer_id: str, voice_sample_text: str):
    # For demo, store a simple deterministic hash (not secure)
    import hashlib
    h = hashlib.sha256(voice_sample_text.encode()).hexdigest()
    with open(VOICE_STORE_PATH) as f:
        vs = json.load(f)
    vs[customer_id] = h
    with open(VOICE_STORE_PATH, "w") as f:
        json.dump(vs, f)
    return True

def verify_voice(customer_id: str, voice_sample_text: str):
    import hashlib
    h = hashlib.sha256(voice_sample_text.encode()).hexdigest()
    with open(VOICE_STORE_PATH) as f:
        vs = json.load(f)
    stored = vs.get(customer_id)
    if not stored:
        return False, "No voice enrolled."
    # Simulate match if first 8 chars match
    if stored[:8] == h[:8]:
        return True, "Voice matched (mock)."
    return False, "Voice did not match."