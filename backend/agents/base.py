from __future__ import annotations
import json
import re
import logging
from abc import ABC, abstractmethod

from openai import AsyncOpenAI

from backend.models.schemas import AgentMessage

logger = logging.getLogger(__name__)


class BaseAgent(ABC):
    name: str
    role: str  # "buyer" | "merchant"
    client: AsyncOpenAI
    model: str
    system_prompt: str
    conversation_history: list[dict[str, str]]

    def __init__(self, client: AsyncOpenAI, model: str, system_prompt: str, name: str, role: str):
        self.client = client
        self.model = model
        self.system_prompt = system_prompt
        self.name = name
        self.role = role
        self.conversation_history = [{"role": "system", "content": system_prompt}]

    async def send_message(self, user_message: str) -> AgentMessage:
        self.conversation_history.append({"role": "user", "content": user_message})

        try:
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=self.conversation_history,
                temperature=0.7,
                max_tokens=1024,
            )
            content = response.choices[0].message.content or ""
            self.conversation_history.append({"role": "assistant", "content": content})
            return self._parse_response(content)
        except Exception as e:
            logger.error(f"[{self.name}] LLM call failed: {e}")
            return AgentMessage(action="reject", reasoning=f"LLM error: {e}", data={})

    def _parse_response(self, content: str) -> AgentMessage:
        try:
            # Handle markdown code blocks
            if "```json" in content:
                content = content.split("```json")[1].split("```")[0]
            elif "```" in content:
                content = content.split("```")[1].split("```")[0]

            data = json.loads(content.strip())
            return AgentMessage(
                action=data.get("action", "reject"),
                reasoning=data.get("reasoning", ""),
                data=data.get("data", {}),
            )
        except (json.JSONDecodeError, IndexError):
            pass

        # Fallback: try to extract fields with regex from truncated/malformed JSON
        action_match = re.search(r'"action"\s*:\s*"(\w+)"', content)
        reasoning_match = re.search(r'"reasoning"\s*:\s*"((?:[^"\\]|\\.)*)"', content)
        price_match = re.search(r'"price"\s*:\s*(\d+(?:\.\d+)?)', content)
        item_match = re.search(r'"item"\s*:\s*"((?:[^"\\]|\\.)*)"', content)

        if action_match:
            action = action_match.group(1)
            reasoning = reasoning_match.group(1) if reasoning_match else ""
            data = {}
            if price_match:
                data["price"] = float(price_match.group(1))
            if item_match:
                data["item"] = item_match.group(1)
            logger.info(f"[{self.name}] Recovered from malformed JSON: action={action}")
            return AgentMessage(action=action, reasoning=reasoning, data=data)

        logger.warning(f"[{self.name}] Could not parse response, raw: {content[:200]}")
        return AgentMessage(
            action="offer",
            reasoning=f"Response parsing failed, retrying. Raw: {content[:200]}",
            data={},
        )

    @abstractmethod
    def build_system_prompt(self, **kwargs: object) -> str: ...
