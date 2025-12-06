# Simple test runner for test_master_chat.py
import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from test_master_chat import test_get_customer, test_master_chat_basic

def run_tests():
    print("Running tests...")
    print("=" * 50)
    
    try:
        print("\n1. Testing GET customer endpoint...")
        test_get_customer()
        print("   [PASS] test_get_customer passed")
    except Exception as e:
        print(f"   [FAIL] test_get_customer failed: {e}")
        return False
    
    try:
        print("\n2. Testing POST /master/chat endpoint...")
        test_master_chat_basic()
        print("   [PASS] test_master_chat_basic passed")
    except Exception as e:
        print(f"   [FAIL] test_master_chat_basic failed: {e}")
        return False
    
    print("\n" + "=" * 50)
    print("All tests passed!")
    return True

if __name__ == "__main__":
    success = run_tests()
    sys.exit(0 if success else 1)

