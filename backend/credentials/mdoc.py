from __future__ import annotations

from backend.models.schemas import MdocCredential


def create_buyer_credential(holder_name: str = "Diego Zuluaga", budget: float = 1000.0) -> MdocCredential:
    return MdocCredential(
        doc_type="org.iso.18013.5.1.mDL",
        holder_name=holder_name,
        credential_type="buyer",
        trust_score=0.92,
        claims={
            "payment_authorized": True,
            "max_transaction": budget,
            "identity_verified": True,
            "jurisdiction": "US-CA",
        },
    )


def create_merchant_credential(holder_name: str = "UrbanStride") -> MdocCredential:
    return MdocCredential(
        doc_type="com.agentcommerce.dpc.1",
        holder_name=holder_name,
        credential_type="merchant",
        trust_score=0.88,
        claims={
            "business_registered": True,
            "business_type": "technology_services",
            "dispute_resolution": True,
            "refund_policy": "30_day",
        },
    )
