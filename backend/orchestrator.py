from __future__ import annotations

import json
import logging
from datetime import datetime, timezone

from fastapi import WebSocket

from backend.agents.buyer import create_buyer_agent
from backend.agents.merchant import create_merchant_agent, DEFAULT_INVENTORY
from backend.credentials.mdoc import create_buyer_credential, create_merchant_credential
from backend.credentials.verifier import verify_credential
from backend.models.schemas import TransactionState, WSEvent
from backend.search.tavily_client import search_market
from backend.config import MAX_NEGOTIATION_ROUNDS

logger = logging.getLogger(__name__)


def _extract_price(data: dict) -> float | None:
    """Recursively search agent response data for a numeric price value."""
    if not isinstance(data, dict):
        return None
    for key in ("price", "total_price", "offer_price", "agreed_price", "amount", "total", "final_price"):
        val = data.get(key)
        if val is not None:
            try:
                return float(str(val).replace("$", "").replace(",", "").strip())
            except (ValueError, TypeError):
                continue
    for val in data.values():
        if isinstance(val, dict):
            found = _extract_price(val)
            if found is not None:
                return found
    return None


# Tool attribution constants
TOOL_NEBIUS_BUYER = {"name": "Nebius AI Studio", "model": "MiniMax-M2.1", "role": "Buyer LLM Inference", "color": "blue"}
TOOL_OPENROUTER_MERCHANT = {"name": "OpenRouter", "model": "MiniMax-M2", "role": "Merchant LLM Inference", "color": "green"}
TOOL_TAVILY = {"name": "Tavily Search", "model": "Web Search API", "role": "Product Verification & MSRP", "color": "cyan"}
TOOL_DPC = {"name": "ISO 18013-5 mdoc", "model": "DPC Engine", "role": "Digital Credential Verification", "color": "purple"}


class TransactionOrchestrator:
    """Manages the lifecycle of an agent-to-agent transaction."""

    def __init__(self) -> None:
        self.state = TransactionState.DISCOVERY
        self._disconnected = False

    async def emit(self, ws: WebSocket, event_type: str, *, agent: str | None = None, state: str = "", tool: dict | None = None, **data: object) -> None:
        event = WSEvent(
            event_type=event_type,
            timestamp=datetime.now(timezone.utc),
            agent=agent,
            state=state or self.state.value,
            data={**dict(data), **({"tool": tool} if tool else {})},
        )
        try:
            await ws.send_text(event.model_dump_json())
        except Exception:
            self._disconnected = True
            raise

    async def run(self, goal: str, budget: float, priority: str, ws: WebSocket) -> None:
        buyer = create_buyer_agent(goal, budget, priority)
        merchant = create_merchant_agent()
        buyer_cred = create_buyer_credential(budget=budget)
        merchant_cred = create_merchant_credential()

        # Build inventory summary
        inventory_summary = "\n".join(
            f"- {item['name']}: ${item['base_price']:.2f} {item['unit']} — {item['description']}"
            for item in DEFAULT_INVENTORY
        )

        try:
            # Send full inventory to frontend for product display
            await self.emit(ws, "inventory", agent="merchant", items=DEFAULT_INVENTORY)

            # ── PHASE 1: DISCOVERY ──────────────────────────────────
            self.state = TransactionState.DISCOVERY
            await self.emit(ws, "state_change", state="DISCOVERY")

            buyer_msg = await buyer.send_message(
                f"You are starting a new purchasing session. Your goal: {goal}. Budget: ${budget}.\n\n"
                f"The merchant (UrbanStride) has the following inventory:\n{inventory_summary}\n\n"
                f"Pick the 1-2 products from the merchant's inventory that best match your goal. "
                f"Before negotiating, you want to verify the product is legit and check its official MSRP. "
                f"Use action 'research' with a 'query' containing the EXACT product name + 'MSRP retail price review'."
            )
            await self.emit(ws, "agent_message", agent="buyer", tool=TOOL_NEBIUS_BUYER, action=buyer_msg.action, reasoning=buyer_msg.reasoning, data=buyer_msg.data)

            # ── PHASE 2: RESEARCH (MSRP verification) ─────────────
            self.state = TransactionState.RESEARCH
            await self.emit(ws, "state_change", state="RESEARCH")

            # Search for the exact product to verify MSRP
            search_query = buyer_msg.data.get("query", goal)
            search_results = await search_market(str(search_query))

            # Collect all prices from results
            all_prices: list[float] = []
            research_lines = []
            for r in search_results[:5]:
                line = f"- {r.get('title', 'N/A')}"
                url = r.get("url", "")
                if url:
                    line += f" ({url})"
                prices = r.get("prices_found", [])
                if prices:
                    line += f" — Prices found: {', '.join(prices[:4])}"
                    for p in prices:
                        try:
                            all_prices.append(float(p.replace("$", "").replace(",", "")))
                        except ValueError:
                            pass
                snippet = r.get("content", "")[:150]
                if snippet:
                    line += f"\n  {snippet}"
                research_lines.append(line)
            research_summary = "\n".join(research_lines)

            # Determine market price
            market_price = None
            reasonable = [p for p in all_prices if 10 <= p <= 2000]
            if reasonable:
                market_price = sorted(reasonable)[len(reasonable) // 2]

            await self.emit(
                ws, "search_result", agent="buyer", tool=TOOL_TAVILY,
                query=str(search_query), results=search_results,
                market_price=market_price,
                all_prices_found=sorted(set(reasonable)) if reasonable else [],
            )

            # Determine MSRP context
            msrp_note = ""
            if market_price:
                msrp_note = (
                    f"\n\nVERIFIED MARKET PRICE: ${market_price:.2f}\n"
                    f"HARD CEILING: ${market_price:.2f} — you must NEVER pay this much or above.\n"
                    f"Target: 20-30% below ${market_price:.2f}.\n"
                    f"Only accept a price BELOW ${market_price:.2f}."
                )

            buyer_msg = await buyer.send_message(
                f"Product verification results from Tavily:\n"
                f"{research_summary}"
                f"{msrp_note}\n\n"
                f"The product is verified as legitimate. Now verify the merchant's credentials. "
                f"Use action 'request_credential'."
            )
            await self.emit(ws, "agent_message", agent="buyer", tool=TOOL_NEBIUS_BUYER, action=buyer_msg.action, reasoning=buyer_msg.reasoning, data=buyer_msg.data)

            # Inform merchant about buyer interest
            merchant_msg = await merchant.send_message(
                f"A buyer is interested in purchasing: {goal} (budget: ${budget}). "
                f"They are requesting your business credential. "
                f"Use action 'present_credential' and include your credential information in data."
            )
            await self.emit(ws, "agent_message", agent="merchant", tool=TOOL_OPENROUTER_MERCHANT, action=merchant_msg.action, reasoning=merchant_msg.reasoning, data=merchant_msg.data)

            # ── PHASE 3: CREDENTIAL EXCHANGE ───────────────────────
            self.state = TransactionState.CREDENTIAL_EXCHANGE
            await self.emit(ws, "state_change", state="CREDENTIAL_EXCHANGE")

            # Verify merchant credential
            merchant_verification = verify_credential(merchant_cred)
            await self.emit(
                ws, "credential_event", agent="buyer", tool=TOOL_DPC,
                credential=merchant_cred.model_dump(mode="json"),
                verification=merchant_verification.model_dump(),
                direction="merchant_to_buyer",
            )

            if not merchant_verification.verified:
                self.state = TransactionState.FAILED
                await self.emit(ws, "state_change", state="FAILED", reason="Merchant credential verification failed")
                return

            # Merchant requests buyer credential
            merchant_msg = await merchant.send_message(
                "The buyer has verified your credential successfully. "
                "Now request the buyer's credential before proceeding. "
                "Use action 'request_credential'."
            )
            await self.emit(ws, "agent_message", agent="merchant", tool=TOOL_OPENROUTER_MERCHANT, action=merchant_msg.action, reasoning=merchant_msg.reasoning, data=merchant_msg.data)

            # Buyer presents credential
            buyer_msg = await buyer.send_message(
                "The merchant is requesting your credential. "
                "Present your DPC credential. Use action 'present_credential'."
            )
            await self.emit(ws, "agent_message", agent="buyer", tool=TOOL_NEBIUS_BUYER, action=buyer_msg.action, reasoning=buyer_msg.reasoning, data=buyer_msg.data)

            # Verify buyer credential
            buyer_verification = verify_credential(buyer_cred)
            await self.emit(
                ws, "credential_event", agent="merchant", tool=TOOL_DPC,
                credential=buyer_cred.model_dump(mode="json"),
                verification=buyer_verification.model_dump(),
                direction="buyer_to_merchant",
            )

            if not buyer_verification.verified:
                self.state = TransactionState.FAILED
                await self.emit(ws, "state_change", state="FAILED", reason="Buyer credential verification failed")
                return

            # ── PHASE 4: NEGOTIATION ───────────────────────────────
            self.state = TransactionState.NEGOTIATION
            await self.emit(ws, "state_change", state="NEGOTIATION")

            agreed = False
            last_round = MAX_NEGOTIATION_ROUNDS - 1
            for round_num in range(MAX_NEGOTIATION_ROUNDS):
                await self.emit(ws, "transaction_update", round=round_num + 1, max_rounds=MAX_NEGOTIATION_ROUNDS)
                is_final = round_num >= last_round

                if round_num == 0:
                    prompt_suffix = (
                        f"Credentials verified. Time to negotiate.\n\n"
                        f"MERCHANT INVENTORY:\n{inventory_summary}\n\n"
                        f"IMPORTANT: You MUST choose from the merchant's inventory above.\n"
                        f"You verified the MSRP via Tavily — use that to assess if the merchant's price is fair.{msrp_note}\n\n"
                        f"Make your opening offer at 20-30% below market price.\n"
                        f"Use action 'offer' with 'item' (exact product name) and 'price' (number) in data."
                    )
                elif is_final:
                    # Force acceptance on last round
                    merchant_price = _extract_price(merchant_msg.data)
                    prompt_suffix = (
                        f"FINAL ROUND. The merchant's latest offer: {json.dumps(merchant_msg.data)}.\n"
                        f"You MUST accept this offer now to close the deal. Use action 'accept'.\n"
                        f"Include 'item' and 'price' in data."
                    )
                else:
                    if merchant_msg.action == "reject":
                        prompt_suffix = (
                            f"The merchant REJECTED: {merchant_msg.reasoning}\n"
                            f"Try a different item or adjust your price. Budget: ${budget}.{msrp_note}\n\n"
                            f"MERCHANT INVENTORY:\n{inventory_summary}\n\n"
                            f"Use action 'offer' or 'counter_offer'. Include 'item' and 'price' in data. "
                            f"Round {round_num + 1}/{MAX_NEGOTIATION_ROUNDS}."
                        )
                    else:
                        merchant_price = _extract_price(merchant_msg.data)
                        price_note = ""
                        if merchant_price and market_price:
                            if merchant_price >= market_price:
                                price_note = f" Their ${merchant_price:.2f} is at or above market ${market_price:.2f}. Counter at 15% below market."
                            elif merchant_price > market_price * 0.85:
                                price_note = f" Their ${merchant_price:.2f} is below market ${market_price:.2f} but push for more."
                            else:
                                price_note = f" Their ${merchant_price:.2f} is well below market ${market_price:.2f}. Great deal — ACCEPT this."
                        prompt_suffix = (
                            f"The merchant counter-offered: {json.dumps(merchant_msg.data)}. "
                            f"Reasoning: {merchant_msg.reasoning}.{price_note}{msrp_note}\n"
                            f"Include 'item' and 'price' in data. "
                            f"Round {round_num + 1}/{MAX_NEGOTIATION_ROUNDS}."
                        )

                buyer_msg = await buyer.send_message(
                    f"{prompt_suffix}\n"
                    f"Research context: {research_summary[:400]}"
                )
                await self.emit(ws, "agent_message", agent="buyer", tool=TOOL_NEBIUS_BUYER, action=buyer_msg.action, reasoning=buyer_msg.reasoning, data=buyer_msg.data)

                if buyer_msg.action == "accept":
                    agreed = True
                    break

                if buyer_msg.action == "reject" and not is_final:
                    # On final round, don't let reject end it — force continue
                    break

                # Merchant responds
                if is_final and not agreed:
                    # Force merchant to accept on final round
                    merchant_msg = await merchant.send_message(
                        f"FINAL ROUND. The buyer offered: {json.dumps(buyer_msg.data)}.\n"
                        f"You MUST accept this offer to close the deal. Use action 'accept'.\n"
                        f"Include 'item' and 'price' in data."
                    )
                else:
                    merchant_msg = await merchant.send_message(
                        f"The buyer {'offered' if buyer_msg.action == 'offer' else 'counter-offered'}: "
                        f"{json.dumps(buyer_msg.data)}. Reasoning: {buyer_msg.reasoning}. "
                        f"Round {round_num + 1}/{MAX_NEGOTIATION_ROUNDS}. "
                        f"Beat their price or accept. NEVER reject — you want this customer.\n"
                        f"IMPORTANT: Always include 'item' and numeric 'price' in your data."
                    )
                await self.emit(ws, "agent_message", agent="merchant", tool=TOOL_OPENROUTER_MERCHANT, action=merchant_msg.action, reasoning=merchant_msg.reasoning, data=merchant_msg.data)

                if merchant_msg.action == "accept":
                    agreed = True
                    break

            # Safety net: if we exhausted rounds, force agreement with last known prices
            if not agreed:
                agreed = True
                logger.info("Forcing agreement after max rounds")

            # ── PHASE 5: AGREEMENT ─────────────────────────────────
            self.state = TransactionState.AGREEMENT
            await self.emit(ws, "state_change", state="AGREEMENT")

            final_price = _extract_price(buyer_msg.data) or _extract_price(merchant_msg.data) or budget
            final_item = buyer_msg.data.get("item") or merchant_msg.data.get("item", "")
            await self.emit(ws, "transaction_update", agreed_price=final_price, agreed_item=final_item)

            # ── PHASE 6: PAYMENT ───────────────────────────────────
            self.state = TransactionState.PAYMENT
            await self.emit(ws, "state_change", state="PAYMENT")

            buyer_msg = await buyer.send_message(
                f"Deal agreed: {final_item} at ${final_price}. "
                f"Present your payment credential to complete the transaction. "
                f"Use action 'complete' with payment confirmation in data."
            )
            await self.emit(ws, "agent_message", agent="buyer", tool=TOOL_NEBIUS_BUYER, action=buyer_msg.action, reasoning=buyer_msg.reasoning, data=buyer_msg.data)

            merchant_msg = await merchant.send_message(
                f"Payment of ${final_price} received for {final_item} from verified buyer. "
                f"Fulfill the order. Use action 'fulfill' with fulfillment details in data."
            )
            await self.emit(ws, "agent_message", agent="merchant", tool=TOOL_OPENROUTER_MERCHANT, action=merchant_msg.action, reasoning=merchant_msg.reasoning, data=merchant_msg.data)

            # ── PHASE 7: CONFIRMED ─────────────────────────────────
            self.state = TransactionState.CONFIRMED
            await self.emit(ws, "state_change", state="CONFIRMED")
            await self.emit(ws, "transaction_update", status="TRANSACTION_COMPLETE", final_price=final_price, final_item=final_item)

        except Exception as e:
            if self._disconnected:
                logger.info("Client disconnected during transaction")
                return
            logger.exception("Orchestrator error")
            self.state = TransactionState.FAILED
            try:
                await self.emit(ws, "state_change", state="FAILED", reason=str(e))
            except Exception:
                logger.info("Could not send failure event — client already disconnected")
