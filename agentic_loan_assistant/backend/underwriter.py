# underwriter.py - Enhanced underwriting with real credit scores and loan calculations
import math
from typing import Dict, Any, Optional, List

# Import API clients
try:
    from . import api_clients
    API_AVAILABLE = True
except ImportError:
    API_AVAILABLE = False

def monthly_emi(principal, annual_rate_percent, months):
    """Calculate monthly EMI"""
    r = annual_rate_percent / 100 / 12
    if r == 0:
        return principal / months
    emi = principal * r * ((1+r)**months) / (((1+r)**months)-1)
    return emi

def evaluate(customer, offer, requested_amount, tenure_months):
    """
    Enhanced underwriting evaluation with real credit scores and accurate EMI calculation
    
    Returns:
        Dict with decision, message, emi, requires_salary_slip, and amortization_schedule
    """
    # Get real credit score from API
    if API_AVAILABLE:
        credit_client = api_clients.get_credit_client()
        credit_score = credit_client.get_credit_score(customer.get("id"))
        if credit_score:
            customer["credit_score"] = credit_score  # Update with real score
    
    credit_score = customer.get("credit_score", 0)
    pre_approved = offer.get("pre_approved_limit", 0)
    
    # Determine interest rate based on credit score
    if credit_score >= 800:
        annual_rate = 10.5  # Excellent credit
    elif credit_score >= 750:
        annual_rate = 11.5  # Very good credit
    elif credit_score >= 700:
        annual_rate = 12.5  # Good credit
    else:
        annual_rate = 14.0  # Fair credit
    
    # Calculate EMI using real API
    emi_data = None
    if API_AVAILABLE:
        loan_calc = api_clients.get_loan_calculator_client()
        emi_data = loan_calc.calculate_amortization(
            requested_amount,
            annual_rate,
            tenure_months
        )
    
    # Fallback to manual calculation if API fails
    if not emi_data:
        emi = monthly_emi(requested_amount, annual_rate, tenure_months)
        total_payment = emi * tenure_months
        total_interest = total_payment - requested_amount
        emi_data = {
            "monthly_payment": round(emi, 2),
            "total_payment": round(total_payment, 2),
            "total_interest": round(total_interest, 2)
        }
    
    emi = emi_data.get("monthly_payment", 0)
    
    # Estimated salary (in real scenario, would come from uploaded documents)
    salary = 50000  # Default assumption
    
    decision = "reject"
    message = ""
    requires_salary_slip = False
    
    # Underwriting logic
    if credit_score < 700:
        decision = "reject"
        message = f"❌ Unfortunately, we cannot approve your loan at this time. Your credit score ({credit_score}) is below our minimum requirement of 700. We recommend improving your credit score and reapplying in 3-6 months. 💡 Tip: Pay existing debts on time to boost your score!"
    
    elif requested_amount <= pre_approved:
        decision = "approved"
        message = f"🎉 Congratulations {customer.get('name')}! Your loan of INR {requested_amount:,} is INSTANTLY APPROVED! ✅\n\n💰 Monthly EMI: INR {emi:,.2f}\n📅 Tenure: {tenure_months} months\n📊 Interest Rate: {annual_rate}% p.a.\n💵 Total Payment: INR {emi_data.get('total_payment', 0):,.2f}\n\nYour excellent credit score ({credit_score}) qualified you for our best rates! 🌟"
    
    elif requested_amount <= 2 * pre_approved:
        requires_salary_slip = True
        # Check EMI to salary ratio
        if emi <= 0.5 * salary:
            decision = "approved_with_docs"
            message = f"✨ Great news {customer.get('name')}! Your loan of INR {requested_amount:,} can be approved!\n\n📄 We just need your latest salary slip for final verification.\n\n💰 Estimated EMI: INR {emi:,.2f}/month\n📅 Tenure: {tenure_months} months\n📊 Interest Rate: {annual_rate}% p.a.\n\nOnce we verify your salary, we'll process instant approval! 🚀"
        else:
            decision = "reject"
            message = f"We appreciate your interest, {customer.get('name')}. However, the EMI of INR {emi:,.2f} would be more than 50% of typical salary for this loan amount.\n\n💡 Alternative options:\n• Reduce loan amount to INR {int(pre_approved):,} for instant approval\n• Extend tenure to reduce EMI\n• Add a co-applicant to increase eligibility\n\nWe're here to help you find the right solution! 😊"
    
    else:
        decision = "reject"
        max_eligible = 2 * pre_approved
        message = f"Thank you for your interest, {customer.get('name')}. The requested amount of INR {requested_amount:,} exceeds our maximum lending limit.\n\n✅ You're pre-approved for: INR {pre_approved:,}\n📈 Maximum possible: INR {max_eligible:,} (with salary verification)\n\n💡 Recommendation: Start with INR {pre_approved:,} and build your credit history for higher limits in future!\n\nWould you like to proceed with a lower amount? 😊"
    
    return {
        "decision": decision,
        "message": message,
        "emi": emi,
        "annual_rate": annual_rate,
        "total_payment": emi_data.get("total_payment", 0),
        "total_interest": emi_data.get("total_interest", 0),
        "requires_salary_slip": requires_salary_slip,
        "credit_score": credit_score,
        "amortization_schedule": emi_data.get("schedule", [])
    }

def generate_alternative_offers(customer: Dict, offer: Dict) -> List[Dict]:
    """
    Generate alternative loan offers when primary request is rejected
    """
    pre_approved = offer.get("pre_approved_limit", 0)
    credit_score = customer.get("credit_score", 0)
    
    alternatives = []
    
    # Offer 1: Pre-approved amount
    if pre_approved >= 25000:
        rate = 11.5 if credit_score >= 750 else 12.5
        emi_24 = monthly_emi(pre_approved, rate, 24)
        emi_36 = monthly_emi(pre_approved, rate, 36)
        
        alternatives.append({
            "amount": pre_approved,
            "options": [
                {"tenure": 24, "emi": round(emi_24, 2), "rate": rate},
                {"tenure": 36, "emi": round(emi_36, 2), "rate": rate}
            ],
            "tagline": "✅ Instant Approval - Pre-approved amount"
        })
    
    # Offer 2: 75% of pre-approved (lower EMI)
    if pre_approved >= 50000:
        amount_75 = int(pre_approved * 0.75)
        rate = 11.0 if credit_score >= 750 else 12.0
        emi = monthly_emi(amount_75, rate, 36)
        
        alternatives.append({
            "amount": amount_75,
            "options": [{"tenure": 36, "emi": round(emi, 2), "rate": rate}],
            "tagline": "💡 Lower EMI option"
        })
    
    # Offer 3: 50% of pre-approved (minimal EMI)
    if pre_approved >= 100000:
        amount_50 = int(pre_approved * 0.5)
        rate = 10.5 if credit_score >= 750 else 11.5
        emi = monthly_emi(amount_50, rate, 24)
        
        alternatives.append({
            "amount": amount_50,
            "options": [{"tenure": 24, "emi": round(emi, 2), "rate": rate}],
            "tagline": "🎯 Quick repayment option"
        })
    
    return alternatives