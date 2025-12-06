# Agentic AI Loan Assistant - Starter Scaffold

This scaffold implements a prototype backend with mock APIs and a simple Master Agent orchestration flow for loan enquiries (focused on personal loans).

## What's included
- FastAPI backend exposing:
  - /master/chat  (simple orchestration endpoint for conversation intents)
  - /mock/crm/{customer_id} (returns KYC)
  - /mock/offermart/{customer_id} (returns pre-approved limit)
  - /mock/credit/{customer_id} (returns mock credit score)
  - /upload/salary-slip (file upload simulation)
  - /sanction/{customer_id} (generate sample PDF sanction letter)
- Synthetic customer data (10 entries)
- Underwriting logic implemented in `underwriter.py`
- Sample conversation payloads in `examples/`

## How to run
1. Install dependencies (recommended in a virtualenv):
   ```bash
   pip install fastapi uvicorn pydantic reportlab python-multipart
   ```
2. Start the server:
   ```bash
   uvicorn backend.main:app --reload --port 8000
   ```
3. Open http://localhost:8000/docs for interactive API docs.

This is a demo scaffold: in production replace mock services with secure APIs, add authentication, secure storage, and integrate real ASR/TTS and LLM orchestrator.

## Additional Components Added

- `backend/llm_orchestrator.py`: LLM orchestration stub
- `backend/auth.py`: OTP and voice-biometric mock functions and new endpoints
- `frontend/`: simple static demo UI (index.html + app.js) using Web Speech API. Serve via a static file server or from the backend.
- `scripts/demo_flow.py`: Demo script that simulates OTP, voice enroll, master chat and file upload.
- `tests/`: simple pytest integration tests (requires server running).

### Running the frontend locally
You can serve the `frontend/` folder with a simple static server. From the project root run:
```
python -m http.server 3000 --directory frontend
```
Then open http://localhost:3000 in your browser. Ensure backend is running on http://localhost:8000 and CORS is configured in production.

### Running the demo script
Start the backend (uvicorn backend.main:app --reload --port 8000)
Then run:
```
python scripts/demo_flow.py
```

### Running tests
Ensure the server is running, then:
```
pip install pytest requests
pytest tests
```
