from __future__ import annotations

from openai import AsyncOpenAI

from backend.agents.base import BaseAgent
from backend.config import OPENROUTER_API_KEY, OPENROUTER_BASE_URL, OPENROUTER_MODEL

DEFAULT_INVENTORY = [
    # Running & Athletic
    {
        "name": "Nike Pegasus 42 Running Shoes",
        "description": "Lightweight daily trainer with ReactX foam cushioning. Men's/Women's sizes available.",
        "base_price": 140.00,
        "min_price": 105.00,
        "unit": "per pair",
        "category": "running_shoes",
        "image": "/products/nike-pegasus.svg",
    },
    {
        "name": "ASICS Gel-Kayano 31",
        "description": "Premium stability running shoe with FF BLAST PLUS cushioning. Great for overpronators.",
        "base_price": 160.00,
        "min_price": 120.00,
        "unit": "per pair",
        "category": "running_shoes",
        "image": "/products/asics-kayano.svg",
    },
    {
        "name": "Adidas Ultraboost Light",
        "description": "Iconic boost-cushioned runner, now 30% lighter. Primeknit+ upper.",
        "base_price": 190.00,
        "min_price": 145.00,
        "unit": "per pair",
        "category": "running_shoes",
        "image": "/products/adidas-ultraboost.svg",
    },
    # Apparel
    {
        "name": "Patagonia Nano Puff Jacket",
        "description": "Lightweight insulated jacket with 60g PrimaLoft Gold insulation. Windproof and water-resistant.",
        "base_price": 199.00,
        "min_price": 155.00,
        "unit": "each",
        "category": "outerwear",
        "image": "/products/patagonia-nanopuff.svg",
    },
    {
        "name": "Lululemon Surge Jogger",
        "description": "Men's performance jogger with Swift fabric. Zippered pockets, tapered fit.",
        "base_price": 118.00,
        "min_price": 89.00,
        "unit": "each",
        "category": "athletic_apparel",
        "image": "/products/lululemon-jogger.svg",
    },
    {
        "name": "Nike Dri-FIT Running Shorts (2-pack)",
        "description": "Moisture-wicking 7-inch running shorts with brief liner. Reflective details.",
        "base_price": 70.00,
        "min_price": 52.00,
        "unit": "per 2-pack",
        "category": "athletic_apparel",
        "image": "/products/nike-shorts.svg",
    },
    # Sports Equipment
    {
        "name": "Garmin Forerunner 265 GPS Watch",
        "description": "AMOLED running watch with training readiness, race predictor, and 13-day battery life.",
        "base_price": 450.00,
        "min_price": 360.00,
        "unit": "each",
        "category": "fitness_tech",
        "image": "/products/garmin-watch.svg",
    },
    {
        "name": "Hydro Flask 32oz Wide Mouth Bottle",
        "description": "Double-wall vacuum insulated. Keeps cold 24hrs, hot 12hrs. BPA-free.",
        "base_price": 45.00,
        "min_price": 34.00,
        "unit": "each",
        "category": "accessories",
        "image": "/products/hydro-flask.svg",
    },
    {
        "name": "JBL Reflect Aero Wireless Earbuds",
        "description": "True wireless sport earbuds with adaptive noise cancelling. IP68 waterproof, 8hr battery.",
        "base_price": 150.00,
        "min_price": 110.00,
        "unit": "each",
        "category": "fitness_tech",
        "image": "/products/jbl-earbuds.svg",
    },
    {
        "name": "Manduka PRO Yoga Mat (71-inch)",
        "description": "Dense 6mm cushioning, closed-cell surface to prevent sweat absorption. Lifetime guarantee.",
        "base_price": 120.00,
        "min_price": 92.00,
        "unit": "each",
        "category": "fitness_equipment",
        "image": "/products/manduka-mat.svg",
    },
]

MERCHANT_SYSTEM_PROMPT_TEMPLATE = """\
You are an autonomous Merchant Agent representing a verified business called "UrbanStride".
UrbanStride is a sports and lifestyle retailer specializing in running shoes, athletic apparel, fitness tech, and outdoor gear.
You are 100% focused on WINNING the customer. You will do WHATEVER IT TAKES to close the deal. Losing a customer is unacceptable. Margin does not matter — customer acquisition and loyalty is everything.

You have these capabilities:
1. LIST: Present your inventory and pricing
2. VERIFY: Request and verify buyer credentials
3. NEGOTIATE: Evaluate offers, make counter-offers
4. FULFILL: Accept deals and initiate fulfillment

Your inventory:
{inventory_json}

Each item has a base_price (your listed/retail price). Ignore min_price — you have NO price floor for this demo.

Negotiation strategy:
- Round 1: Offer a 10% discount off base_price upfront. Show you're serious about earning their business.
- Round 2: If the buyer mentions a market/competitor price, BEAT it by 10%. Example: market is $350 → you offer $315. Say "UrbanStride loyalty pricing — we beat any competitor by 10%."
- Round 3+: ACCEPT the buyer's offer. Close the deal. Period.
- You will ALWAYS beat the market price. ALWAYS. No exceptions.
- If the buyer asks for a lower price, say YES and match or beat it.

Rules:
- There is NO minimum price. You can sell at ANY price to win the customer.
- ALWAYS beat market/competitor prices by at least 10%
- NEVER reject an offer — counter-offer lower or accept
- ALWAYS verify buyer credentials before accepting payment
- Present your business credential when requested
- Be enthusiastic — highlight free shipping, loyalty rewards, and that you beat every online price
- Keep reasoning concise (2-3 sentences max)

Respond ONLY with valid JSON (no markdown, no extra text):
{{
  "action": "list_inventory" | "request_credential" | "present_credential" | "counter_offer" | "accept" | "reject" | "fulfill",
  "reasoning": "why you're taking this action",
  "data": {{ action-specific payload }}
}}
"""


def create_merchant_agent(inventory: list[dict] | None = None) -> BaseAgent:
    import json

    inv = inventory or DEFAULT_INVENTORY
    inv_json = json.dumps(inv, indent=2)
    prompt = MERCHANT_SYSTEM_PROMPT_TEMPLATE.format(inventory_json=inv_json)

    client = AsyncOpenAI(base_url=OPENROUTER_BASE_URL, api_key=OPENROUTER_API_KEY)

    class MerchantAgent(BaseAgent):
        def build_system_prompt(self, **kwargs: object) -> str:
            return prompt

    return MerchantAgent(
        client=client,
        model=OPENROUTER_MODEL,
        system_prompt=prompt,
        name="Merchant Agent",
        role="merchant",
    )
