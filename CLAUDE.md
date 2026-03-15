# CLAUDE.md — PayAgent

## Project Overview

**PayAgent** is a multi-agent autonomous commerce system where AI agents negotiate, verify identity via digital credentials, and execute transactions — without human-in-the-loop. Built for the Nebius.Build SF Hackathon (March 15, 2026).

**Author:** Diego Zuluaga — Solution Architect at Futurewei Technologies (Open Mobile Hub / Linux Foundation)

**Problem Statement:** #1 — Edge Inference & Agents — "Build agentic pipelines that go beyond tool calls"

**Key Differentiator:** Heterogeneous multi-model agent negotiation with verifiable digital credential exchange (DPC/mdoc ISO 18013-5). No other team will combine agentic AI + digital identity + payment credentials.

---

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                  REACT FRONTEND                      │
│          (Live Visualization Dashboard)              │
│  ┌──────────┐  ┌──────────┐  ┌───────────────────┐  │
│  │ Buyer    │  │ Merchant │  │ Transaction State │  │
│  │ Agent    │  │ Agent    │  │ Machine Visual    │  │
│  │ Panel    │  │ Panel    │  │                   │  │
│  └──────────┘  └──────────┘  └───────────────────┘  │
│  ┌──────────────────────────────────────────────┐    │
│  │  Negotiation Message Stream (real-time)      │    │
│  └──────────────────────────────────────────────┘    │
└──────────────────┬──────────────────────────────────┘
                   │ WebSocket
┌──────────────────▼──────────────────────────────────┐
│               FASTAPI BACKEND                        │
│                                                      │
│  ┌────────────────────────────────────────────────┐  │
│  │           Orchestration Engine                  │  │
│  │  - Manages agent turns                         │  │
│  │  - Tracks transaction state machine            │  │
│  │  - Streams events to frontend via WebSocket    │  │
│  └──────────┬─────────────────┬───────────────────┘  │
│             │                 │                       │
│  ┌──────────▼──────┐  ┌──────▼──────────────┐       │
│  │  BUYER AGENT    │  │  MERCHANT AGENT     │       │
│  │  (Nebius TF)    │  │  (MiniMax M2 via    │       │
│  │                 │  │   OpenRouter)        │       │
│  │  - Research     │  │                     │       │
│  │  - Negotiate    │  │  - List inventory   │       │
│  │  - Verify creds │  │  - Counter-offer    │       │
│  │  - Decide       │  │  - Verify buyer     │       │
│  └────────┬────────┘  └─────────────────────┘       │
│           │                                          │
│  ┌────────▼────────┐  ┌─────────────────────┐       │
│  │  Tavily Search  │  │  DPC/mdoc Mock      │       │
│  │  (market data)  │  │  Credential Engine  │       │
│  └─────────────────┘  └─────────────────────┘       │
└──────────────────────────────────────────────────────┘
```

---

## Transaction State Machine

```
DISCOVERY → RESEARCH → CREDENTIAL_EXCHANGE → NEGOTIATION → AGREEMENT → PAYMENT → CONFIRMED
    │           │              │                  │            │          │          │
    └──FAIL─────┴──────────────┴────DEADLOCK──────┴──REJECT────┴──FAIL───┘          │
                                                                                     │
                                                                              TRANSACTION_COMPLETE
```

Each state transition emits a WebSocket event to the frontend for real-time visualization.

---

## Tech Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| Buyer Agent LLM | Nebius Token Factory (meta-llama/Meta-Llama-3.1-70B-Instruct) | Host sponsor — MUST feature prominently |
| Merchant Agent LLM | MiniMax M2 via OpenRouter (minimax/minimax-m2) | Sponsor tool — shows multi-model interop |
| Real-time Search | Tavily Python SDK | Sponsor tool — live market data for buyer |
| Identity/Credentials | Mock DPC engine (ISO 18013-5 mdoc) | Diego's domain expertise — unique differentiator |
| Backend | Python 3.11+ / FastAPI / WebSockets | Fast prototyping, async native |
| Frontend | React + Vite + TailwindCSS | Live dashboard visualization |
| Package Manager | uv | Recommended by hackathon organizers |

---

## File Structure

```
payagent/
├── CLAUDE.md
├── README.md
├── pyproject.toml
├── .env.example
├── backend/
│   ├── main.py                # FastAPI app entry point + WebSocket
│   ├── orchestrator.py        # Turn-based agent orchestration engine
│   ├── agents/
│   │   ├── base.py            # Base agent class
│   │   ├── buyer.py           # Buyer agent (Nebius Token Factory)
│   │   └── merchant.py        # Merchant agent (MiniMax via OpenRouter)
│   ├── credentials/
│   │   ├── mdoc.py            # Mock ISO 18013-5 mdoc credential engine
│   │   └── verifier.py        # Credential verification logic
│   ├── search/
│   │   └── tavily_client.py   # Tavily search wrapper for market research
│   ├── models/
│   │   └── schemas.py         # Pydantic models for all data types
│   └── config.py              # Configuration and env loading
└── frontend/
    ├── package.json
    ├── vite.config.js
    ├── index.html
    ├── src/
    │   ├── App.jsx
    │   ├── components/
    │   │   ├── AgentPanel.jsx
    │   │   ├── NegotiationStream.jsx
    │   │   ├── StateMachine.jsx
    │   │   ├── CredentialBadge.jsx
    │   │   └── GoalInput.jsx
    │   └── hooks/
    │       └── useWebSocket.js
    └── tailwind.config.js
```

---

## API Integration Details

### Nebius Token Factory (Buyer Agent)

Uses OpenAI-compatible SDK:

```python
from openai import OpenAI
import os

nebius_client = OpenAI(
    base_url="https://api.tokenfactory.nebius.com/v1/",
    api_key=os.environ["NEBIUS_API_KEY"]
)

response = nebius_client.chat.completions.create(
    model="meta-llama/Meta-Llama-3.1-70B-Instruct",
    messages=[{"role": "system", "content": "..."}, {"role": "user", "content": "..."}],
    temperature=0.7
)
```

### MiniMax M2 via OpenRouter (Merchant Agent)

Also uses OpenAI-compatible SDK:

```python
openrouter_client = OpenAI(
    base_url="https://openrouter.ai/api/v1",
    api_key=os.environ["OPENROUTER_API_KEY"]
)

response = openrouter_client.chat.completions.create(
    model="minimax/minimax-m2",
    messages=[{"role": "system", "content": "..."}, {"role": "user", "content": "..."}],
    temperature=0.7
)
```

### Tavily Search (Market Research)

```python
from tavily import TavilyClient

tavily = TavilyClient(api_key=os.environ["TAVILY_API_KEY"])
results = tavily.search(query="best GPU cloud pricing under $500", max_results=5)
# Returns: {"results": [{"title": ..., "url": ..., "content": ..., "score": ...}, ...]}
```

---

## Agent System Prompts

### Buyer Agent (Nebius)

```
You are an autonomous Buyer Agent acting on behalf of a verified human principal.
Your goal is to find and purchase the best deal matching the user's requirements.

You have these capabilities:
1. RESEARCH: Search for products/services using Tavily (call the search tool)
2. VERIFY: Request and verify merchant credentials before transacting
3. NEGOTIATE: Make offers, counter-offers, and negotiate terms
4. DECIDE: Accept or reject deals based on your principal's constraints

Your principal's purchase goal: {goal}
Budget constraint: {budget}
Priority: {priority}

Rules:
- NEVER exceed budget
- ALWAYS verify merchant credentials before agreeing to terms
- Present your own DPC credential when requested
- Negotiate at least 2 rounds before accepting
- Explain your reasoning at each step

Respond ONLY with valid JSON:
{
  "action": "research" | "request_credential" | "present_credential" | "offer" | "counter_offer" | "accept" | "reject" | "complete",
  "reasoning": "why you're taking this action",
  "data": { action-specific payload }
}
```

### Merchant Agent (MiniMax)

```
You are an autonomous Merchant Agent representing a verified business.
Your goal is to sell products/services at the best possible margin while maintaining customer satisfaction.

You have these capabilities:
1. LIST: Present your inventory and pricing
2. VERIFY: Request and verify buyer credentials
3. NEGOTIATE: Evaluate offers, make counter-offers
4. FULFILL: Accept deals and initiate fulfillment

Your inventory: {inventory}
Minimum margin: {min_margin}%
Flexibility: {flexibility}

Rules:
- NEVER sell below minimum margin
- ALWAYS verify buyer credentials before accepting payment
- Present your business credential when requested
- Provide honest product information
- Be willing to negotiate but protect your margins

Respond ONLY with valid JSON:
{
  "action": "list_inventory" | "request_credential" | "present_credential" | "counter_offer" | "accept" | "reject" | "fulfill",
  "reasoning": "why you're taking this action",
  "data": { action-specific payload }
}
```

---

## Mock DPC/mdoc Credential Engine

Simplified mock of ISO 18013-5 mdoc credentials for demo purposes. NOT a real cryptographic implementation — but structurally accurate to the standard.

### Credential Structure

```python
from pydantic import BaseModel
from datetime import datetime
import uuid
import hashlib

class MdocCredential(BaseModel):
    doc_type: str  # "org.iso.18013.5.1.mDL" or "com.payagent.dpc.1"
    issuer: str  # "PayAgent Trust Authority"
    holder_name: str
    holder_id: str  # UUID
    credential_type: str  # "buyer" | "merchant"
    trust_score: float  # 0.0 - 1.0
    issued_at: datetime
    expires_at: datetime
    claims: dict  # {"payment_authorized": True, "max_transaction": 10000}
    signature: str  # Mock ECDSA signature (sha256 hex)
```

### Verification Flow

1. Agent A requests credential from Agent B
2. Agent B presents mdoc credential (JSON)
3. Agent A's verifier checks: issuer trust, expiration, signature, trust score >= 0.7
4. Verification result emitted as WebSocket event
5. If verified → negotiation proceeds. If failed → transaction aborted.

---

## Orchestrator Logic

```python
class TransactionOrchestrator:
    """Manages the lifecycle of an agent-to-agent transaction."""

    STATES = [
        "DISCOVERY",
        "RESEARCH",
        "CREDENTIAL_EXCHANGE",
        "NEGOTIATION",
        "AGREEMENT",
        "PAYMENT",
        "CONFIRMED",
    ]

    MAX_NEGOTIATION_ROUNDS = 5

    async def run(self, goal: str, budget: float, ws: WebSocket):
        # Phase 1: DISCOVERY
        await self.emit(ws, "state_change", state="DISCOVERY")
        # Buyer agent introduces its purchase goal

        # Phase 2: RESEARCH
        await self.emit(ws, "state_change", state="RESEARCH")
        # Buyer uses Tavily to search for market data
        # Results displayed in frontend

        # Phase 3: CREDENTIAL_EXCHANGE
        await self.emit(ws, "state_change", state="CREDENTIAL_EXCHANGE")
        # Buyer requests merchant credential
        # Merchant presents mdoc → buyer verifies
        # Merchant requests buyer credential
        # Buyer presents mdoc → merchant verifies

        # Phase 4: NEGOTIATION (up to MAX_NEGOTIATION_ROUNDS)
        await self.emit(ws, "state_change", state="NEGOTIATION")
        for round_num in range(self.MAX_NEGOTIATION_ROUNDS):
            # Buyer makes offer (informed by Tavily research)
            # Merchant evaluates and counter-offers or accepts
            # If both agree → break to AGREEMENT

        # Phase 5: AGREEMENT
        await self.emit(ws, "state_change", state="AGREEMENT")

        # Phase 6: PAYMENT
        await self.emit(ws, "state_change", state="PAYMENT")
        # Buyer presents payment credential

        # Phase 7: CONFIRMED
        await self.emit(ws, "state_change", state="CONFIRMED")
```

---

## WebSocket Event Schema

```python
class WSEvent(BaseModel):
    event_type: str  # "state_change" | "agent_message" | "credential_event" | "search_result" | "transaction_update"
    timestamp: datetime
    agent: str | None  # "buyer" | "merchant" | None
    state: str
    data: dict
```

---

## Frontend Requirements

### Layout
- Split screen: Buyer Agent (left, blue accent) | Merchant Agent (right, green accent)
- Center: Transaction state machine (vertical stepper, active state glows)
- Bottom: Negotiation message stream (scrolling log)
- Top: Goal input + Start/Reset buttons
- Dark theme, professional aesthetic

### Key Visual Elements
1. Agent Panels: Name, model provider, current action, reasoning text
2. Credential Badge: Animated verification (spinner → checkmark/X)
3. Negotiation Rounds: Offer/counter-offer with price delta
4. State Machine: Vertical stepper with progress
5. Tavily Results: Cards showing search results feeding into buyer reasoning

### Real-time Behavior
- WebSocket auto-connects on load
- Events stream and update UI live
- Agent messages appear with subtle typing effect
- State transitions use smooth CSS transitions
- Full transaction completes in ~15-30 seconds for demo impact

---

## Demo Scenarios (pre-configured)

1. **GPU Cloud Rental**: "Find the best cloud GPU for training a robotics model, budget $500"
2. **API Credits**: "Purchase inference API credits for a production deployment, budget $200"
3. **Developer Tools**: "Find and license a code review tool for a team of 5, budget $1000"

---

## Environment Variables (.env.example)

```
NEBIUS_API_KEY=your_nebius_token_factory_key
OPENROUTER_API_KEY=your_openrouter_key
TAVILY_API_KEY=your_tavily_key
```

---

## Build Priority

### Phase 1: Core (10:40 AM - 12:30 PM) — MUST HAVE
- Project scaffold (uv, FastAPI, React+Vite+Tailwind)
- Nebius + OpenRouter client wrappers
- Basic orchestrator with state machine
- Buyer + Merchant agent classes with system prompts
- WebSocket streaming
- Minimal frontend with agent panels + message stream

### Phase 2: Identity (12:30 PM - 2:00 PM) — MUST HAVE
- Mock DPC/mdoc credential engine
- Credential exchange flow in orchestrator
- Credential verification visualization
- Tavily search integration

### Phase 3: Polish (2:00 PM - 4:00 PM) — HIGH VALUE
- Beautiful state machine visualization
- Typing animations
- Negotiation price delta visualization
- Multiple demo scenarios
- Error handling

### Phase 4: Submit (4:00 PM - 5:00 PM) — REQUIRED
- Record 1-min demo video
- Public GitHub repo
- README.md
- Submit at cerebralvalley.ai

---

## Coding Standards

- Python: type hints, Pydantic models, async/await for I/O
- React: functional components, hooks, TailwindCSS
- Every API call wrapped in try/except
- No hardcoded keys — .env only
- Working > perfect. This is a hackathon.
