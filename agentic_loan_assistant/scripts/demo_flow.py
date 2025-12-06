# demo_flow.py - Simulate an end-to-end flow using the mock backend.
import requests, time, json, os

BASE = os.getenv("DEMO_BASE", "http://localhost:8000")

def run_demo(customer_id="cust004", amount=150000):
    print("Starting demo for", customer_id)
    # 1) Generate OTP (demo)
    r = requests.post(f"{BASE}/auth/generate-otp", params={"customer_id": customer_id})
    print("Generate OTP:", r.json())
    otp = r.json().get("otp")
    # 2) Verify OTP
    r = requests.post(f"{BASE}/auth/verify-otp", params={"customer_id": customer_id, "otp": otp})
    print("Verify OTP:", r.json())
    # 3) Enroll voice sample (mock)
    r = requests.post(f"{BASE}/auth/enroll-voice", params={"customer_id": customer_id, "sample_text":"hello this is my voice sample"})
    print("Enroll voice:", r.json())
    # 4) Master chat: ask for loan
    payload = {"customer_id": customer_id, "message": "I want a personal loan", "requested_amount": amount, "tenure_months": 60}
    r = requests.post(f"{BASE}/master/chat", json=payload)
    print("Master chat response:")
    print(json.dumps(r.json(), indent=2))
    # 5) If requires salary slip, upload dummy file
    for m in r.json().get("messages", []):
        if m.get("decision") and m.get("decision") in ["approved_with_docs"] or m.get("text","").lower().find("upload salary")>=0:
            files = {"file": ("salary.pdf", b"%PDF-1.4 Dummy PDF content")}
            r2 = requests.post(f"{BASE}/upload/salary-slip", params={"customer_id": customer_id}, files=files)
            print("Uploaded salary slip:", r2.json())
            # call sanction
            r3 = requests.get(f"{BASE}/sanction/{customer_id}")
            if r3.status_code == 200:
                print("Sanction letter PDF available (binary). Length:", len(r3.content))
    print("Demo complete.")

if __name__ == '__main__':
    run_demo()