# session_manager.py - Manage conversation sessions and context
from typing import Dict, List, Optional
from datetime import datetime, timedelta
import json

class ConversationSession:
    """Represents a single conversation session for a customer"""
    
    def __init__(self, customer_id: str):
        self.customer_id = customer_id
        self.messages: List[Dict] = []
        self.created_at = datetime.now()
        self.last_activity = datetime.now()
        self.context: Dict = {}
        self.context["total_loan_amount"] = 0  # Track accumulated loan amount
        self.context["loan_history"] = []  # Track individual loan applications
        
    def add_message(self, role: str, content: str, metadata: Optional[Dict] = None):
        """Add a message to the conversation history"""
        message = {
            "role": role,
            "content": content,
            "timestamp": datetime.now().isoformat(),
            "metadata": metadata or {}
        }
        self.messages.append(message)
        self.last_activity = datetime.now()
        
    def get_recent_messages(self, count: int = 10) -> List[Dict]:
        """Get the most recent N messages"""
        return self.messages[-count:] if len(self.messages) > count else self.messages
    
    def get_context_summary(self) -> str:
        """Generate a summary of the conversation context"""
        if not self.messages:
            return "New conversation, no history."
        
        summary_parts = []
        summary_parts.append(f"Conversation started {self._format_time_ago(self.created_at)}")
        summary_parts.append(f"Total messages: {len(self.messages)}")
        
        # Extract key information from context
        if self.context.get("total_loan_amount"):
            summary_parts.append(f"Total loan amount: INR {self.context['total_loan_amount']:,}")
        elif self.context.get("requested_amount"):
            summary_parts.append(f"Requested loan amount: INR {self.context['requested_amount']:,}")
        if self.context.get("last_intent"):
            summary_parts.append(f"Last intent: {self.context['last_intent']}")
        
        return " | ".join(summary_parts)
    
    def update_context(self, key: str, value):
        """Update conversation context"""
        self.context[key] = value
        self.last_activity = datetime.now()
    
    def is_expired(self, timeout_minutes: int = 30) -> bool:
        """Check if session has expired"""
        return datetime.now() - self.last_activity > timedelta(minutes=timeout_minutes)
    
    def _format_time_ago(self, dt: datetime) -> str:
        """Format datetime as 'X minutes/hours ago'"""
        delta = datetime.now() - dt
        if delta.seconds < 60:
            return "just now"
        elif delta.seconds < 3600:
            minutes = delta.seconds // 60
            return f"{minutes} minute{'s' if minutes != 1 else ''} ago"
        elif delta.seconds < 86400:
            hours = delta.seconds // 3600
            return f"{hours} hour{'s' if hours != 1 else ''} ago"
        else:
            days = delta.days
            return f"{days} day{'s' if days != 1 else ''} ago"


class SessionManager:
    """Manages all conversation sessions"""
    
    def __init__(self):
        self.sessions: Dict[str, ConversationSession] = {}
        
    def get_or_create_session(self, customer_id: str) -> ConversationSession:
        """Get existing session or create new one"""
        # Clean up expired sessions first
        self._cleanup_expired_sessions()
        
        if customer_id not in self.sessions:
            self.sessions[customer_id] = ConversationSession(customer_id)
        
        return self.sessions[customer_id]
    
    def get_session(self, customer_id: str) -> Optional[ConversationSession]:
        """Get existing session, return None if not found"""
        return self.sessions.get(customer_id)
    
    def end_session(self, customer_id: str):
        """End a session and remove it"""
        if customer_id in self.sessions:
            del self.sessions[customer_id]
    
    def _cleanup_expired_sessions(self, timeout_minutes: int = 30):
        """Remove expired sessions"""
        expired = [
            cid for cid, session in self.sessions.items()
            if session.is_expired(timeout_minutes)
        ]
        for cid in expired:
            del self.sessions[cid]
    
    def get_active_sessions_count(self) -> int:
        """Get count of active sessions"""
        self._cleanup_expired_sessions()
        return len(self.sessions)
    
    def get_conversation_history_for_llm(self, customer_id: str, max_messages: int = 10) -> List[Dict]:
        """
        Get conversation history formatted for LLM context.
        Returns list of messages in OpenAI format: [{"role": "user/assistant", "content": "..."}]
        """
        session = self.get_session(customer_id)
        if not session:
            return []
        
        recent_messages = session.get_recent_messages(max_messages)
        llm_messages = []
        
        for msg in recent_messages:
            # Map our roles to OpenAI roles
            if msg["role"] == "user":
                llm_messages.append({"role": "user", "content": msg["content"]})
            elif msg["role"] in ["sales", "system", "verification", "underwriting"]:
                llm_messages.append({"role": "assistant", "content": msg["content"]})
        
        return llm_messages


# Global session manager instance
_session_manager = SessionManager()

def get_session_manager() -> SessionManager:
    """Get the global session manager instance"""
    return _session_manager
