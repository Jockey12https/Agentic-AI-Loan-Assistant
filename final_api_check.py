
import requests

url = "http://127.0.0.1:8000/master/chat"
payload = {
    "customer_id": "cust001",
    "message": "Are you connected to Gemini?",
    "user_data": {"name": "Test User", "phone": "+919876543210"}
}

try:
    print(f"Testing Backend API at {url}...")
    response = requests.post(url, json=payload, timeout=10)
    print(f"Status Code: {response.status_code}")
    if response.status_code == 200:
        print("Response Content:")
        print(response.json().get("response", "No response text found"))
        print("\n✅ API Verified Successfully!")
    else:
        print(f"❌ API Failed with Status {response.status_code}")
        print(response.text)
except Exception as e:
    print(f"❌ Connection Error: {e}")
