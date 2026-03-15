from __future__ import annotations

import hashlib
from datetime import datetime, timezone

from backend.models.schemas import CredentialVerificationResult, MdocCredential


def verify_credential(credential: MdocCredential) -> CredentialVerificationResult:
    issues: list[str] = []

    # Check issuer
    if credential.issuer != "AgentCommerce Trust Authority":
        issues.append(f"Untrusted issuer: {credential.issuer}")

    # Check expiration
    if credential.expires_at.replace(tzinfo=timezone.utc) < datetime.now(timezone.utc):
        issues.append("Credential has expired")

    # Verify signature
    expected_payload = f"{credential.doc_type}:{credential.holder_id}:{credential.issuer}:{credential.credential_type}"
    expected_sig = hashlib.sha256(expected_payload.encode()).hexdigest()
    if credential.signature != expected_sig:
        issues.append("Invalid signature")

    # Check trust score
    if credential.trust_score < 0.7:
        issues.append(f"Trust score too low: {credential.trust_score}")

    return CredentialVerificationResult(
        verified=len(issues) == 0,
        credential_type=credential.credential_type,
        holder_name=credential.holder_name,
        trust_score=credential.trust_score,
        issues=issues,
    )
