import { useCallback, useRef, useState } from "react";

export default function useWebSocket() {
  const wsRef = useRef(null);
  const [connected, setConnected] = useState(false);
  const [events, setEvents] = useState([]);
  const [currentState, setCurrentState] = useState("IDLE");
  const [running, setRunning] = useState(false);

  const start = useCallback((goal, budget, priority = "best_value") => {
    if (wsRef.current) {
      wsRef.current.close();
    }

    setEvents([]);
    setCurrentState("DISCOVERY");
    setRunning(true);

    const ws = new WebSocket("ws://localhost:8000/ws/transaction");
    wsRef.current = ws;

    ws.onopen = () => {
      setConnected(true);
      ws.send(JSON.stringify({ goal, budget: parseFloat(budget), priority }));
    };

    ws.onmessage = (evt) => {
      try {
        const event = JSON.parse(evt.data);
        setEvents((prev) => [...prev, event]);

        if (event.event_type === "state_change") {
          setCurrentState(event.state || event.data?.state || "UNKNOWN");
        }
      } catch (e) {
        console.error("Failed to parse WS message:", e);
      }
    };

    ws.onclose = () => {
      setConnected(false);
      setRunning(false);
    };

    ws.onerror = (err) => {
      console.error("WebSocket error:", err);
      setRunning(false);
    };
  }, []);

  const reset = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
    }
    setEvents([]);
    setCurrentState("IDLE");
    setRunning(false);
  }, []);

  return { connected, events, currentState, running, start, reset };
}
