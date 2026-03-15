from __future__ import annotations

import json
import logging

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

from backend.orchestrator import TransactionOrchestrator

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(name)s %(levelname)s %(message)s")
logger = logging.getLogger(__name__)

app = FastAPI(title="AgentCommerce", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}


@app.websocket("/ws/transaction")
async def transaction_ws(ws: WebSocket) -> None:
    await ws.accept()
    logger.info("WebSocket client connected")
    try:
        # Wait for goal message from client
        raw = await ws.receive_text()
        data = json.loads(raw)

        goal = data.get("goal", "Find the best cloud GPU deal")
        budget = float(data.get("budget", 500))
        priority = data.get("priority", "best_value")

        logger.info(f"Starting transaction: goal={goal}, budget={budget}")

        orchestrator = TransactionOrchestrator()
        await orchestrator.run(goal, budget, priority, ws)

    except WebSocketDisconnect:
        logger.info("WebSocket client disconnected")
    except RuntimeError as e:
        if "close message" in str(e):
            logger.info("WebSocket client disconnected during send")
        else:
            logger.exception("WebSocket runtime error")
    except Exception as e:
        logger.exception("WebSocket error")
        try:
            await ws.send_text(json.dumps({"event_type": "error", "data": {"message": str(e)}}))
        except Exception:
            pass


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host="0.0.0.0", port=8000, reload=True)
