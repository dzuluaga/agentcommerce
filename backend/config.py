import os
from pathlib import Path
from dotenv import load_dotenv

# Load .env from project root regardless of CWD
_project_root = Path(__file__).resolve().parent.parent
load_dotenv(_project_root / ".env")

NEBIUS_API_KEY = os.environ.get("NEBIUS_API_KEY", "")
OPENROUTER_API_KEY = os.environ.get("OPENROUTER_API_KEY", "")
TAVILY_API_KEY = os.environ.get("TAVILY_API_KEY", "")

# Buyer Agent — Nebius AI Studio
NEBIUS_BASE_URL = "https://api.studio.nebius.ai/v1/"
NEBIUS_MODEL = "MiniMaxAI/MiniMax-M2.1"

# Merchant Agent — OpenRouter
OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1"
OPENROUTER_MODEL = "minimax/minimax-m2"

MAX_NEGOTIATION_ROUNDS = 5
