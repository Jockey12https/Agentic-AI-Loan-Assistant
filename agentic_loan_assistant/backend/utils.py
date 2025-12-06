import os, json, random
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas

DATA_PATH = os.path.join(os.path.dirname(__file__), "..", "data", "customers.json")
with open(DATA_PATH) as f:
    CUSTOMERS = {c["id"]: c for c in json.load(f)}

def get_offermart(customer_id):
    c = CUSTOMERS.get(customer_id)
    if not c:
        return {"customer_id": customer_id, "pre_approved_limit": 0}
    return {"customer_id": customer_id, "pre_approved_limit": c.get("pre_approved_limit", 0)}

def get_crm(customer_id):
    return CUSTOMERS.get(customer_id, {})

def get_credit(customer_id):
    return {"customer_id": customer_id, "credit_score": CUSTOMERS.get(customer_id, {}).get("credit_score", 0)}

def generate_sample_sanction_pdf(customer, path):
    c = canvas.Canvas(path, pagesize=A4)
    c.setFont("Helvetica-Bold", 14)
    c.drawString(50, 800, "Tata Capital - Personal Loan Sanction Letter (Sample)")
    c.setFont("Helvetica", 12)
    c.drawString(50, 770, f"Customer Name: {customer.get('name')}")
    c.drawString(50, 750, f"Customer ID: {customer.get('id', 'N/A')}")
    c.drawString(50, 730, f"Pre-approved Limit: INR {customer.get('pre_approved_limit')}")
    c.drawString(50, 710, "Loan Amount: INR - [To be filled]")
    c.drawString(50, 690, "Interest Rate: [Example] 12% per annum")
    c.drawString(50, 670, "Tenure: [To be filled] months")
    c.drawString(50, 650, "This is a system-generated sample sanction letter for demo purposes.")
    c.showPage()
    c.save()