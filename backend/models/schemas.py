from __future__ import annotations
from datetime import datetime
from enum import Enum
from typing import Any
import hashlib
import uuid

from pydantic import BaseModel, Field


# ── Transaction States ──────────────────────────────────────────

class TransactionState(str, Enum):
    DISCOVERY = "DISCOVERY"
    RESEARCH = "RESEARCH"
    CREDENTIAL_EXCHANGE = "CREDENTIAL_EXCHANGE"
    NEGOTIATION = "NEGOTIATION"
    AGREEMENT = "AGREEMENT"
    PAYMENT = "PAYMENT"
    CONFIRMED = "CONFIRMED"
    FAILED = "FAILED"


# ── WebSocket Events ────────────────────────────────────────────

class WSEvent(BaseModel):
    event_type: str  # state_change | agent_message | credential_event | search_result | transaction_update
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    agent: str | None = None  # "buyer" | "merchant" | None
    state: str = ""
    data: dict[str, Any] = Field(default_factory=dict)


# ── Agent Messages ──────────────────────────────────────────────

class AgentAction(str, Enum):
    RESEARCH = "research"
    REQUEST_CREDENTIAL = "request_credential"
    PRESENT_CREDENTIAL = "present_credential"
    LIST_INVENTORY = "list_inventory"
    OFFER = "offer"
    COUNTER_OFFER = "counter_offer"
    ACCEPT = "accept"
    REJECT = "reject"
    COMPLETE = "complete"
    FULFILL = "fulfill"


class AgentMessage(BaseModel):
    action: str
    reasoning: str = ""
    data: dict[str, Any] = Field(default_factory=dict)


# ── DPC / mdoc Credentials ─────────────────────────────────────

class MdocCredential(BaseModel):
    doc_type: str = "com.agentcommerce.dpc.1"
    issuer: str = "AgentCommerce Trust Authority"
    holder_name: str
    holder_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    credential_type: str  # "buyer" | "merchant"
    trust_score: float = 0.85
    issued_at: datetime = Field(default_factory=datetime.utcnow)
    expires_at: datetime = Field(default_factory=lambda: datetime(2027, 12, 31))
    claims: dict[str, Any] = Field(default_factory=dict)
    signature: str = ""

    def model_post_init(self, __context: Any) -> None:
        if not self.signature:
            payload = f"{self.doc_type}:{self.holder_id}:{self.issuer}:{self.credential_type}"
            self.signature = hashlib.sha256(payload.encode()).hexdigest()


class CredentialVerificationResult(BaseModel):
    verified: bool
    credential_type: str
    holder_name: str
    trust_score: float
    issues: list[str] = Field(default_factory=list)


# ── Goal Input ──────────────────────────────────────────────────

class GoalInput(BaseModel):
    goal: str
    budget: float
    priority: str = "best_value"


# ── Merchant Inventory ──────────────────────────────────────────

class InventoryItem(BaseModel):
    name: str
    description: str
    base_price: float
    min_price: float
    category: str
