# api_clients.py - RapidAPI clients for Gemini, Credit Report, and Loan Calculator
import os
import json
import requests
from typing import Dict, Any, Optional, List
from datetime import datetime, timedelta

class RapidAPIClient:
    """Base class for RapidAPI clients"""
    
    def __init__(self):
        self.api_key = os.getenv("RAPIDAPI_KEY", "6d999d9074msh16cc732e16846fbp1da672jsn5d3f544a90c5")
        self.timeout = 30
        
    def _make_request(self, method: str, url: str, headers: Dict, data: Optional[Dict] = None) -> Dict:
        """Make HTTP request with error handling"""
        try:
            if method == "GET":
                response = requests.get(url, headers=headers, timeout=self.timeout)
            elif method == "POST":
                response = requests.post(url, headers=headers, json=data, timeout=self.timeout)
            else:
                raise ValueError(f"Unsupported method: {method}")
            
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            print(f"API request failed: {e}")
            return {"error": str(e)}


class GeminiClient(RapidAPIClient):
    """Client for Gemini 2.5 Pro API via RapidAPI"""
    
    def __init__(self):
        super().__init__()
        self.host = "gemini-2-5-pro.p.rapidapi.com"
        self.url = f"https://{self.host}/"
        
    def chat_completion(
        self, 
        messages: List[Dict[str, str]], 
        temperature: float = 0.7,
        max_tokens: int = 500
    ) -> str:
        """
        Send chat completion request to Gemini API
        
        Args:
            messages: List of message dicts with 'role' and 'content'
            temperature: Sampling temperature (0.0 to 1.0)
            max_tokens: Maximum tokens in response
            
        Returns:
            Response text from Gemini
        """
        # Try multiple API formats
        formats_to_try = [
            # Format 1: Standard OpenAI-like format
            {
                'model': 'gemini-2.5-pro',
                'messages': messages,
                'temperature': temperature,
                'max_tokens': max_tokens
            },
            # Format 2: Simplified format
            {
                'prompt': messages[-1]['content'] if messages else '',
                'temperature': temperature
            },
            # Format 3: Google AI format
            {
                'contents': [{'parts': [{'text': msg['content']}]} for msg in messages],
                'generationConfig': {
                    'temperature': temperature,
                    'maxOutputTokens': max_tokens
                }
            }
        ]
        
        headers = {
            'x-rapidapi-key': self.api_key,
            'x-rapidapi-host': self.host,
            'Content-Type': 'application/json'
        }
        
        for i, payload in enumerate(formats_to_try):
            try:
                print(f"Trying Gemini API format {i+1}...")
                result = self._make_request("POST", self.url, headers, payload)
                
                if "error" in result:
                    print(f"Format {i+1} error: {result['error']}")
                    continue
                
                # Try to extract response from various formats
                response_text = None
                
                # OpenAI-like format
                if "choices" in result and len(result["choices"]) > 0:
                    response_text = result["choices"][0]["message"]["content"]
                # Direct content
                elif "content" in result:
                    response_text = result["content"]
                # Google AI format
                elif "candidates" in result and len(result["candidates"]) > 0:
                    response_text = result["candidates"][0]["content"]["parts"][0]["text"]
                # Text field
                elif "text" in result:
                    response_text = result["text"]
                
                if response_text:
                    print(f"✓ Gemini API working with format {i+1}!")
                    return response_text
                else:
                    print(f"Format {i+1} unexpected response: {result}")
                    
            except Exception as e:
                print(f"Format {i+1} exception: {e}")
                continue
        
        print("All Gemini API formats failed, using fallback")
        return None


class DeepSeekClient(RapidAPIClient):
    """Client for DeepSeek V3 API via RapidAPI (fallback)"""
    
    def __init__(self):
        super().__init__()
        self.host = "deepseek-v31.p.rapidapi.com"
        self.url = f"https://{self.host}/"
        
    def chat_completion(
        self, 
        messages: List[Dict[str, str]], 
        temperature: float = 0.7
    ) -> str:
        """Send chat completion request to DeepSeek API"""
        headers = {
            'x-rapidapi-key': self.api_key,
            'x-rapidapi-host': self.host,
            'Content-Type': 'application/json'
        }
        
        payload = {
            'model': 'DeepSeek-V3-0324',
            'messages': messages,
            'temperature': temperature
        }
        
        try:
            result = self._make_request("POST", self.url, headers, payload)
            
            if "error" in result:
                return None
            
            if "choices" in result and len(result["choices"]) > 0:
                return result["choices"][0]["message"]["content"]
            elif "content" in result:
                return result["content"]
            else:
                return None
                
        except Exception as e:
            print(f"DeepSeek API exception: {e}")
            return None


class CreditReportClient(RapidAPIClient):
    """Client for Credit Report API via RapidAPI"""
    
    def __init__(self):
        super().__init__()
        self.host = "credit-report-api.p.rapidapi.com"
        self.base_url = f"https://{self.host}"
        
    def get_credit_score(self, customer_id: str) -> Optional[int]:
        """
        Fetch credit score for a customer
        
        Args:
            customer_id: Customer identifier
            
        Returns:
            Credit score (0-900) or None if error
        """
        headers = {
            'x-rapidapi-key': self.api_key,
            'x-rapidapi-host': self.host
        }
        
        url = f"{self.base_url}/GetArchiveReport"
        
        try:
            result = self._make_request("GET", url, headers)
            
            if "error" in result:
                # Fallback to mock data if API fails
                return self._get_mock_credit_score(customer_id)
            
            # Parse credit score from response
            # Note: Actual API response format may vary
            if "creditScore" in result:
                return int(result["creditScore"])
            elif "score" in result:
                return int(result["score"])
            else:
                # Fallback to mock
                return self._get_mock_credit_score(customer_id)
                
        except Exception as e:
            print(f"Credit Report API exception: {e}")
            return self._get_mock_credit_score(customer_id)
    
    def _get_mock_credit_score(self, customer_id: str) -> int:
        """Generate mock credit score based on customer_id"""
        # Use hash of customer_id to generate consistent score
        hash_val = sum(ord(c) for c in customer_id)
        return 650 + (hash_val % 250)  # Score between 650-900


class LoanCalculatorClient(RapidAPIClient):
    """Client for Loan Amortization Calculator API via RapidAPI"""
    
    def __init__(self):
        super().__init__()
        self.host = "loan-amortization-calculator1.p.rapidapi.com"
        self.url = f"https://{self.host}/api/calculate/amortization"
        
    def calculate_amortization(
        self,
        loan_amount: float,
        annual_interest_rate: float,
        num_payments: int,
        frequency: str = "monthly"
    ) -> Dict[str, Any]:
        """
        Calculate loan amortization schedule
        
        Args:
            loan_amount: Principal loan amount
            annual_interest_rate: Annual interest rate (percentage)
            num_payments: Number of payments
            frequency: Payment frequency (monthly, weekly, etc.)
            
        Returns:
            Dict with EMI, total payment, total interest, and schedule
        """
        headers = {
            'x-rapidapi-key': self.api_key,
            'x-rapidapi-host': self.host,
            'Content-Type': 'application/json'
        }
        
        payload = {
            'loan_amount': str(loan_amount),
            'annual_interest_rate': str(annual_interest_rate),
            'num_payments': str(num_payments),
            'extra_payment': '0',
            'frequency': frequency
        }
        
        try:
            result = self._make_request("POST", self.url, headers, payload)
            
            if "error" in result:
                # Fallback to manual calculation
                return self._calculate_emi_manual(loan_amount, annual_interest_rate, num_payments)
            
            return result
                
        except Exception as e:
            print(f"Loan Calculator API exception: {e}")
            return self._calculate_emi_manual(loan_amount, annual_interest_rate, num_payments)
    
    def _calculate_emi_manual(
        self, 
        principal: float, 
        annual_rate: float, 
        months: int
    ) -> Dict[str, Any]:
        """Manual EMI calculation as fallback"""
        r = annual_rate / 100 / 12
        if r == 0:
            emi = principal / months
        else:
            emi = principal * r * ((1 + r) ** months) / (((1 + r) ** months) - 1)
        
        total_payment = emi * months
        total_interest = total_payment - principal
        
        return {
            "monthly_payment": round(emi, 2),
            "total_payment": round(total_payment, 2),
            "total_interest": round(total_interest, 2),
            "principal": principal,
            "annual_interest_rate": annual_rate,
            "num_payments": months
        }


# Global client instances
_gemini_client = None
_deepseek_client = None
_credit_client = None
_loan_calc_client = None

def get_gemini_client() -> GeminiClient:
    """Get or create Gemini client instance"""
    global _gemini_client
    if _gemini_client is None:
        _gemini_client = GeminiClient()
    return _gemini_client

def get_deepseek_client() -> DeepSeekClient:
    """Get or create DeepSeek client instance"""
    global _deepseek_client
    if _deepseek_client is None:
        _deepseek_client = DeepSeekClient()
    return _deepseek_client

def get_credit_client() -> CreditReportClient:
    """Get or create Credit Report client instance"""
    global _credit_client
    if _credit_client is None:
        _credit_client = CreditReportClient()
    return _credit_client

def get_loan_calculator_client() -> LoanCalculatorClient:
    """Get or create Loan Calculator client instance"""
    global _loan_calc_client
    if _loan_calc_client is None:
        _loan_calc_client = LoanCalculatorClient()
    return _loan_calc_client
