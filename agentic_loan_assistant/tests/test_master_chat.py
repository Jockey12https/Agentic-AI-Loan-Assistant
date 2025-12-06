# tests/test_master_chat.py - simple integration tests (assumes server running on localhost:8000)
import requests
import json

BASE = "http://localhost:8000"

def test_get_customer():
    r = requests.get(f"{BASE}/mock/crm/cust004")
    assert r.status_code == 200
    data = r.json()
    assert data["name"] == "S J Jithin"

def test_master_chat_basic():
    payload = {"customer_id":"cust004", "message":"I want to check loan", "requested_amount":150000, "tenure_months":60}
    r = requests.post(f"{BASE}/master/chat", json=payload)
    assert r.status_code == 200
    js = r.json()
    assert "messages" in js