
import firebase_admin
from firebase_admin import credentials, firestore
import os

db = None

def initialize_firebase():
    global db
    try:
        # Check if already initialized
        if not firebase_admin._apps:
            # Look for serviceAccountKey.json in backend directory or parent
            current_dir = os.path.dirname(__file__)
            key_path = os.path.join(current_dir, "serviceAccountKey.json")
            
            if not os.path.exists(key_path):
                 # Try parent dir
                 key_path = os.path.join(current_dir, "..", "serviceAccountKey.json")

            if os.path.exists(key_path):
                cred = credentials.Certificate(key_path)
                firebase_admin.initialize_app(cred)
                print(f"✅ Firebase Admin initialized with key: {key_path}")
            else:
                print("⚠️ Service account key not found. Trying default credentials...")
                # Fallback to default credentials (works on GCP, or if GOOGLE_APPLICATION_CREDENTIALS is set)
                firebase_admin.initialize_app()
                print("✅ Firebase Admin initialized with default credentials")
        
        db = firestore.client()
        return True
    except Exception as e:
        print(f"❌ Error initializing Firebase Admin: {e}")
        return False

def get_user_by_customer_id(customer_id):
    """
    Fetch user document from Firestore by customerId field.
    """
    global db
    if not db:
        if not initialize_firebase():
            return None
            
    try:
        # Query users collection where customerId == customer_id
        users_ref = db.collection('users')
        query = users_ref.where('customerId', '==', customer_id).limit(1)
        results = query.stream()
        
        for doc in results:
            user_data = doc.to_dict()
            user_data['uid'] = doc.id
            return user_data
            
        return None
    except Exception as e:
        print(f"❌ Error fetching user by customer ID: {e}")
        return None
