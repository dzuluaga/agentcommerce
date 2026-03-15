from __future__ import annotations

import logging
import re

from tavily import TavilyClient

from backend.config import TAVILY_API_KEY

logger = logging.getLogger(__name__)

# Target official brand sites and major retailers for MSRP verification
RETAIL_DOMAINS = [
    "nike.com",
    "adidas.com",
    "asics.com",
    "patagonia.com",
    "lululemon.com",
    "garmin.com",
    "jbl.com",
    "hydroflask.com",
    "manduka.com",
    "rei.com",
    "dickssportinggoods.com",
    "runningwarehouse.com",
    "amazon.com",
]


def _extract_prices(text: str) -> list[str]:
    """Pull dollar amounts from text content."""
    # Match $140, $140.00, $1,299.99, etc.
    return re.findall(r"\$\d{1,4}(?:,\d{3})*(?:\.\d{2})?", text or "")


async def search_market(query: str, max_results: int = 5) -> list[dict]:
    """Search for product MSRP and retail pricing using Tavily."""
    try:
        client = TavilyClient(api_key=TAVILY_API_KEY)
        response = client.search(
            query=query,
            max_results=max_results,
            search_depth="advanced",
            include_domains=RETAIL_DOMAINS,
        )
        results = response.get("results", [])

        # Enrich results with extracted prices from both content and title
        for r in results:
            all_text = f"{r.get('title', '')} {r.get('content', '')}"
            prices = _extract_prices(all_text)
            if prices:
                r["prices_found"] = prices

        return results
    except Exception as e:
        logger.error(f"Tavily search failed: {e}")
        return [{"title": "Search unavailable", "content": str(e), "url": "", "score": 0}]
