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
    c.setFont("Helvetica-Bold", 16)
    c.drawString(50, 800, "Tata Capital - Personal Loan Sanction Letter")
    
    c.setFont("Helvetica", 12)
    c.drawString(50, 770, f"Dear {customer.get('name', 'Valued Customer')},")
    c.drawString(50, 750, "We are pleased to inform you that your loan application has been APPROVED!")
    
    c.setFont("Helvetica-Bold", 12)
    c.drawString(50, 720, "Loan Details:")
    
    c.setFont("Helvetica", 11)
    c.drawString(70, 700, f"Customer ID: {customer.get('id', 'N/A')}")
    c.drawString(70, 680, f"Customer Name: {customer.get('name', 'N/A')}")
    c.drawString(70, 660, f"Loan Amount: INR {customer.get('loan_amount', 0):,}")
    c.drawString(70, 640, f"Monthly EMI: INR {customer.get('emi', 0):,.2f}")
    c.drawString(70, 620, f"Tenure: {customer.get('tenure_months', 60)} months")
    c.drawString(70, 600, f"Interest Rate: 12% per annum")
    c.drawString(70, 580, f"Credit Score: {customer.get('credit_score', 'N/A')}")
    
    c.setFont("Helvetica", 10)
    c.drawString(50, 550, "This sanction letter is valid for 30 days from the date of issue.")
    c.drawString(50, 530, "Please contact us for loan disbursement procedures.")
    
    c.setFont("Helvetica-Oblique", 9)
    c.drawString(50, 500, "This is a system-generated sanction letter for demo purposes.")
    
    c.showPage()
    c.save()