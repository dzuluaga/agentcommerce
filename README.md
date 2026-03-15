# AgentCommerce

**Autonomous Multi-Agent Commerce with Verifiable Digital Credentials**

Built by [Diego Zuluaga](https://github.com/dzuluaga) — Solution Architect at Futurewei Technologies (Open Mobile Hub / Linux Foundation)

> Nebius.Build SF Hackathon 2026 | Problem Statement #1: Edge Inference & Agents

---

## What is AgentCommerce?

Every online purchase requires a human in the loop — browsing, comparing prices, checking if a seller is legit, negotiating. AgentCommerce eliminates that entirely.

Two AI agents — a **Buyer** and a **Merchant** — negotiate purchases end-to-end with zero human intervention. The Buyer researches real-time market prices, verifies the merchant's identity through digital credentials, and negotiates the best deal below market price. The Merchant responds with counter-offers, price-matches competitors, and closes the sale — all in under 60 seconds.

## What Makes This Different

| Feature | Description |
|---------|-------------|
| **Heterogeneous Multi-Model Negotiation** | Buyer runs on Nebius AI Studio (MiniMax-M2.1), Merchant runs on OpenRouter (MiniMax-M2). Two different providers, one seamless transaction. |
| **Verifiable Digital Identity** | Both agents exchange and verify ISO 18013-5 mdoc credentials — the same standard behind mobile driver's licenses — before any transaction. |
| **Real-Time Price Intelligence** | Tavily Search pulls live pricing from nike.com, garmin.com, rei.com, and other retailers. The buyer never pays above market price. |
| **Live Visualization** | Every step streams via WebSocket to a React dashboard showing the full negotiation arc in real-time. |

## Architecture

```
                          REACT FRONTEND
                    (Live Dashboard via WebSocket)
                              |
                          WebSocket
                              |
                       FASTAPI BACKEND
                     Orchestration Engine
                    /                    \
           BUYER AGENT              MERCHANT AGENT
        Nebius AI Studio            OpenRouter
        MiniMax-M2.1                MiniMax-M2
               |                         |
         Tavily Search          ISO 18013-5 mdoc
      (Market Price Data)     (Credential Verification)
```

## Transaction State Machine

```
DISCOVERY → RESEARCH → CREDENTIAL_EXCHANGE → NEGOTIATION → AGREEMENT → PAYMENT → CONFIRMED
```

Each state transition emits a WebSocket event for real-time visualization.

## Demo

**Example Transaction:**
- Garmin Forerunner 265 GPS Watch listed at **$450**
- Tavily verifies market price at **$349.99**
- Agents negotiate over 3 rounds
- Deal closed at **$315** — 10% below market price
- Both identities verified via ISO 18013-5 mdoc credentials

## Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Buyer Agent LLM | Nebius AI Studio (MiniMax-M2.1) | Hackathon host sponsor |
| Merchant Agent LLM | OpenRouter (MiniMax-M2) | Multi-provider interop |
| Market Research | Tavily Search API | Real-time price verification |
| Identity | ISO 18013-5 mdoc / DPC mock engine | Digital credential exchange |
| Backend | Python 3.11+ / FastAPI / WebSockets | Async orchestration |
| Frontend | React + Vite + TailwindCSS | Live dashboard |
| Package Manager | uv | Python dependency management |

## Quick Start

### Prerequisites

- Python 3.11+
- Node.js 18+
- [uv](https://github.com/astral-sh/uv) package manager

### Setup

```bash
# Clone
git clone https://github.com/dzuluaga/agentcommerce.git
cd agentcommerce

# Environment variables
cp .env.example .env
# Edit .env with your API keys:
#   NEBIUS_API_KEY=your_nebius_ai_studio_key
#   OPENROUTER_API_KEY=your_openrouter_key
#   TAVILY_API_KEY=your_tavily_key

# Backend
uv sync
uv run uvicorn backend.main:app --reload --port 8000

# Frontend (new terminal)
cd frontend
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) and click a preset to start a transaction.

## How It Works

1. **Discovery** — Buyer agent identifies products from merchant inventory matching the purchase goal
2. **Research** — Tavily searches official retailer sites for verified market prices (MSRP)
3. **Credential Exchange** — Both agents present and verify ISO 18013-5 mdoc digital credentials
4. **Negotiation** — Up to 5 rounds of offers and counter-offers, informed by real market data
5. **Agreement** — Agents converge on a price below market value
6. **Payment** — Buyer presents payment credential
7. **Confirmed** — Transaction complete with full audit trail

## Sponsor Tool Usage

- **Nebius AI Studio** — Powers the Buyer agent's LLM inference (MiniMax-M2.1)
- **OpenRouter** — Powers the Merchant agent's LLM inference (MiniMax-M2)
- **Tavily Search** — Provides real-time market price data from official retailer websites

## License

MIT

---

*Built for the [Nebius.Build SF Hackathon](https://nebius.com/events/nebius-build-sf) — March 15, 2026*
