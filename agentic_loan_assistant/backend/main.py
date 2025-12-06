from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import json, uuid, os

from . import underwriter, utils, auth, llm_orchestrator
from fastapi.responses import FileResponse

app = FastAPI(title="Agentic Loan Assistant - Mock Backend")

# Add CORS middleware to allow frontend to access the API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for development
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

DATA_PATH = os.path.join(os.path.dirname(__file__), "..", "data", "customers.json")
with open(DATA_PATH) as f:
    CUSTOMERS = {c["id"]: c for c in json.load(f)}

class ChatRequest(BaseModel):
    customer_id: str
    message: str
    requested_amount: Optional[int] = None
    tenure_months: Optional[int] = None

# Intent detection is now handled by LLM orchestrator

@app.post("/master/chat")
async def master_chat(req: ChatRequest):
    """
    Master Agent - Orchestrates the entire loan sales conversation
    Coordinates with Worker Agents: Sales, Verification, Underwriting, Sanction Letter
    """
    customer = CUSTOMERS.get(req.customer_id)
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    # Get or create session for this customer
    from . import session_manager as sm
    session_mgr = sm.get_session_manager()
    session = session_mgr.get_or_create_session(req.customer_id)
    
    # Add user message to session
    session.add_message("user", req.message)
    
    # Get conversation history for LLM context
    conversation_history = session_mgr.get_conversation_history_for_llm(req.customer_id)
    
    response = {"messages": [], "orchestration": {}}
    
    # Get customer data
    offer = utils.get_offermart(customer["id"])
    kyc = utils.get_crm(customer["id"])
    
    # MASTER AGENT DECISION: Detect intent with conversation context
    customer_context = {
        "name": customer.get("name"),
        "credit_score": customer.get("credit_score"),
        "pre_approved_limit": offer.get("pre_approved_limit")
    }
    intent = llm_orchestrator.detect_intent_with_llm(
        req.message, 
        customer_context,
        conversation_history
    )
    
    # Update session context
    session.update_context("last_intent", intent)
    if req.requested_amount:
        session.update_context("requested_amount", req.requested_amount)
    
    # Track which agents are activated
    activated_agents = []
    
    # ORCHESTRATION LOGIC - Master Agent decides which Worker Agents to activate
    
    # Handle NEGATIVE intent (customer declining)
    if intent == "negative":
        activated_agents.append("sales")
        
        # Sales Agent: Handle objection gracefully
        sales_response = llm_orchestrator.generate_response_with_llm(
            req.message,
            intent,
            customer,
            offer,
            kyc,
            req.requested_amount,
            conversation_history,
            agent_role="sales"
        )
        
        response["messages"].append({
            "agent": "sales",
            "text": sales_response
        })
        session.add_message("sales", sales_response)
        
        # Offer to keep the option open
        followup = f"Your pre-approved offer of INR {offer['pre_approved_limit']:,} will remain valid for 30 days. Feel free to reach out anytime! 😊"
        response["messages"].append({
            "agent": "system",
            "text": followup
        })
        session.add_message("system", followup)
    
    # Handle LOAN APPLICATION (with amount)
    elif intent in ["loan_inquiry", "apply_loan", "affirmative"] and req.requested_amount:
        activated_agents = ["sales", "verification", "underwriting"]
        
        # WORKER AGENT 1: Sales Agent - Acknowledge and build excitement
        sales_response = llm_orchestrator.generate_response_with_llm(
            req.message,
            intent,
            customer,
            offer,
            kyc,
            req.requested_amount,
            conversation_history,
            agent_role="sales"
        )
        
        response["messages"].append({
            "agent": "sales",
            "text": sales_response
        })
        session.add_message("sales", sales_response)
        
        # WORKER AGENT 2: Verification Agent - Confirm KYC
        verification_response = llm_orchestrator.generate_response_with_llm(
            f"Verify KYC for {customer['name']}",
            "check_status",
            customer,
            offer,
            kyc,
            None,
            conversation_history,
            agent_role="verification"
        )
        
        verification_text = f"✓ KYC Verified: {kyc['name']}, {kyc['phone']}, PAN: {kyc.get('pan', 'N/A')}"
        response["messages"].append({
            "agent": "verification",
            "text": verification_text
        })
        session.add_message("verification", verification_text)
        
        # WORKER AGENT 3: Underwriting Agent - Evaluate loan
        uw_result = underwriter.evaluate(customer, offer, req.requested_amount, req.tenure_months or 60)
        
        underwriting_response = llm_orchestrator.generate_response_with_llm(
            f"Underwriting decision: {uw_result['decision']}",
            "check_status",
            customer,
            offer,
            kyc,
            req.requested_amount,
            conversation_history,
            agent_role="underwriting"
        )
        
        # Use the detailed message from underwriter
        underwriting_text = uw_result["message"]
        response["messages"].append({
            "agent": "underwriting",
            "text": underwriting_text,
            "decision": uw_result["decision"],
            "emi": uw_result.get("emi"),
            "credit_score": uw_result.get("credit_score")
        })
        session.add_message("underwriting", underwriting_text, {
            "decision": uw_result["decision"],
            "emi": uw_result.get("emi")
        })
        
        # Update session with decision
        session.update_context("last_decision", uw_result["decision"])
        session.update_context("emi", uw_result.get("emi"))
        session.update_context("credit_score", uw_result.get("credit_score"))
        
        # EDGE CASE 1: Salary slip required
        if uw_result.get("requires_salary_slip"):
            activated_agents.append("document_upload")
            salary_slip_text = "📄 Please upload your latest salary slip to complete the verification. You can upload it using the document upload feature."
            response["messages"].append({
                "agent": "system",
                "text": salary_slip_text,
                "action_required": "upload_salary_slip"
            })
            session.add_message("system", salary_slip_text)
        
        # EDGE CASE 2: Loan approved - Generate sanction letter
        elif uw_result["decision"] == "approved":
            activated_agents.append("sanction_letter")
            sanction_text = f"📜 Sanction letter is being generated! You can download it from /sanction/{customer['id']}"
            response["messages"].append({
                "agent": "sanction_letter",
                "text": sanction_text,
                "download_url": f"/sanction/{customer['id']}"
            })
            session.add_message("sanction_letter", sanction_text)
            
            # Sales Agent: Close the deal
            closing_text = f"🎊 Congratulations {customer['name']}! Welcome to the family! Your loan will be disbursed within 24 hours. Is there anything else I can help you with?"
            response["messages"].append({
                "agent": "sales",
                "text": closing_text
            })
            session.add_message("sales", closing_text)
        
        # EDGE CASE 3: Loan rejected - Offer alternatives
        elif uw_result["decision"] == "reject":
            alternatives = underwriter.generate_alternative_offers(customer, offer)
            if alternatives:
                alt_text = "💡 Here are some alternative options that might work better:\n\n"
                for i, alt in enumerate(alternatives, 1):
                    alt_text += f"{i}. INR {alt['amount']:,} - {alt['tagline']}\n"
                
                response["messages"].append({
                    "agent": "sales",
                    "text": alt_text,
                    "alternatives": alternatives
                })
                session.add_message("sales", alt_text)
    
    # Handle CHECK LIMIT
    elif intent == "check_limit":
        activated_agents = ["sales", "verification"]
        
        # Sales Agent: Present the limit persuasively
        sales_response = llm_orchestrator.generate_response_with_llm(
            req.message,
            intent,
            customer,
            offer,
            kyc,
            None,
            conversation_history,
            agent_role="sales"
        )
        
        response["messages"].append({
            "agent": "sales",
            "text": sales_response
        })
        session.add_message("sales", sales_response)
        
        # Verification: Quick KYC confirmation
        verification_text = f"✓ Verified: {kyc['name']}, {kyc['phone']}"
        response["messages"].append({
            "agent": "verification",
            "text": verification_text
        })
        session.add_message("verification", verification_text)
        
        # Proactive suggestions
        suggestions = llm_orchestrator.generate_proactive_suggestions(customer, offer, conversation_history)
        if suggestions:
            suggestions_text = "Quick actions: " + " | ".join(suggestions)
            response["messages"].append({
                "agent": "system",
                "text": suggestions_text
            })
            session.add_message("system", suggestions_text)
    
    # Handle CHECK STATUS
    elif intent == "check_status":
        activated_agents = ["system"]
        
        # Provide status update
        last_decision = session.context.get("last_decision")
        if last_decision:
            status_text = f"Your last application status: {last_decision.upper()}"
        else:
            status_text = "You haven't applied for a loan yet. Would you like to check your pre-approved limit?"
        
        response["messages"].append({
            "agent": "system",
            "text": status_text
        })
        session.add_message("system", status_text)
    
    # Handle GREETING, AFFIRMATIVE (no amount), GENERAL
    else:
        activated_agents = ["sales"]
        
        # Sales Agent: Engage and persuade
        sales_response = llm_orchestrator.generate_response_with_llm(
            req.message,
            intent,
            customer,
            offer,
            kyc,
            None,
            conversation_history,
            agent_role="sales"
        )
        
        response["messages"].append({
            "agent": "sales",
            "text": sales_response
        })
        session.add_message("sales", sales_response)
        
        # If affirmative without amount, provide quick options
        if intent == "affirmative" and not req.requested_amount:
            max_amount = offer['pre_approved_limit']
            suggestion1 = min(50000, max_amount)
            suggestion2 = min(100000, max_amount)
            suggestion3 = max_amount
            suggestions_text = f"💡 Popular choices: INR {suggestion1:,} | INR {suggestion2:,} | INR {suggestion3:,} (max). What works best for you?"
            response["messages"].append({
                "agent": "sales",
                "text": suggestions_text
            })
            session.add_message("sales", suggestions_text)
    
    # Add orchestration metadata
    response["orchestration"] = {
        "intent_detected": intent,
        "agents_activated": activated_agents,
        "session_id": customer["id"],
        "conversation_turn": len(session.messages)
    }
    
    return response

@app.get("/mock/crm/{customer_id}")
async def mock_crm(customer_id: str):
    if customer_id not in CUSTOMERS:
        raise HTTPException(status_code=404, detail="Customer not found")
    return CUSTOMERS[customer_id]

@app.get("/mock/offermart/{customer_id}")
async def mock_offermart(customer_id: str):
    return utils.get_offermart(customer_id)

@app.get("/mock/credit/{customer_id}")
async def mock_credit(customer_id: str):
    return utils.get_credit(customer_id)

UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "..", "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

@app.post("/upload/salary-slip")
async def upload_salary_slip(customer_id: str, file: UploadFile = File(...)):
    # Save file locally as a simulation
    filename = f"{customer_id}_{uuid.uuid4().hex}_{file.filename}"
    path = os.path.join(UPLOAD_DIR, filename)
    with open(path, "wb") as f:
        f.write(await file.read())
    # fake re-eval: call underwriter to re-check using a mocked salary (read from filename?)
    return {"status": "uploaded", "path": path}

@app.get("/sanction/{customer_id}")
async def sanction_letter(customer_id: str):
    if customer_id not in CUSTOMERS:
        raise HTTPException(status_code=404, detail="Customer not found")
    # generate sample pdf
    pdf_path = os.path.join(os.path.dirname(__file__), "..", "outputs", f"sanction_{customer_id}.pdf")
    os.makedirs(os.path.dirname(pdf_path), exist_ok=True)
    utils.generate_sample_sanction_pdf(CUSTOMERS[customer_id], pdf_path)
    return FileResponse(pdf_path, media_type='application/pdf', filename=os.path.basename(pdf_path))

@app.post("/auth/generate-otp")
async def api_generate_otp(customer_id: str):
    cust = CUSTOMERS.get(customer_id)
    if not cust:
        raise HTTPException(status_code=404, detail="Customer not found")
    otp = auth.generate_otp(cust["phone"])
    return {"phone": cust["phone"], "otp": otp, "note": "OTP returned for demo (do not do in production)."}

@app.post("/auth/verify-otp")
async def api_verify_otp(customer_id: str, otp: str):
    cust = CUSTOMERS.get(customer_id)
    if not cust:
        raise HTTPException(status_code=404, detail="Customer not found")
    ok, msg = auth.verify_otp(cust["phone"], otp)
    return {"verified": ok, "message": msg}

@app.post("/auth/enroll-voice")
async def enroll_voice(customer_id: str, sample_text: str):
    if customer_id not in CUSTOMERS:
        raise HTTPException(status_code=404, detail="Customer not found")
    ok = auth.enroll_voice(customer_id, sample_text)
    return {"enrolled": ok}

@app.post("/auth/verify-voice")
async def verify_voice(customer_id: str, sample_text: str):
    if customer_id not in CUSTOMERS:
        raise HTTPException(status_code=404, detail="Customer not found")
    ok, msg = auth.verify_voice(customer_id, sample_text)
    return {"verified": ok, "message": msg}

@app.post("/master/llm-assist")
async def master_llm_assist(customer_id: str, prompt: str):
    # Simple wrapper to demonstrate LLM orchestrator stub
    reply = llm_orchestrator.call_llm_system_prompt(prompt)
    return {"reply": reply}