"use client";
import React, { useEffect, useRef, useState } from "react";
import { Terminal, Activity, Wifi, WifiOff } from "lucide-react";

interface EventEntry {
  message?: string;
  type?: string;
  agent_name?: string;
  payload?: unknown;
  timestamp?: string;
  [key: string]: unknown;
}

export default function MarketFeed() {
  const [events, setEvents] = useState<EventEntry[]>([]);
  const [connected, setConnected] = useState(false);
  const feedRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    let reconnectTimer: NodeJS.Timeout;

    const connect = () => {
      // Ensure we are in a browser environment before connecting
      if (typeof window === "undefined") return;

      const wsUrl = "ws://127.0.0.1:8000/ws/feed";
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        setConnected(true);
        console.log("WebSocket connected to Market Feed");
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          // Only process log entries or raw events
          if (data.type === "connected" || data.type === "pong") {
              return;
          }
          if (data.type === "negotiation_log") {
              setEvents(prev => [...prev.slice(-100), { message: data.message, timestamp: data.timestamp }]);
          } else if (data.type === "event") {
              // Detailed structured event logic could go here
          } else {
              setEvents(prev => [...prev.slice(-100), data]);
          }
        } catch (e) {
          console.error("Failed to parse websocket message", e);
        }
      };

      ws.onclose = () => {
        setConnected(false);
        console.log("WebSocket disconnected. Attempting to reconnect in 5s...");
        reconnectTimer = setTimeout(connect, 5000);
      };

      ws.onerror = (error) => {
        console.error("WebSocket connection error:", error);
        // Do not call ws.close() here as it triggers onclose immediately, causing rapid reconnect loops if server is down
      };

      wsRef.current = ws;
    };

    // Slight delay before first connection to ensure Backend is up during dev
    const initialTimer = setTimeout(() => {
        connect();
    }, 1000);

    return () => {
      clearTimeout(reconnectTimer);
      clearTimeout(initialTimer);
      if (wsRef.current) {
        // Prevent onclose handle from triggering a reconnect when component unmounts
        wsRef.current.onclose = null;
        wsRef.current.close();
      }
    };
  }, []);

  // Fallback REST fetch for initial history
  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api"}/events`)
      .then((res) => res.json())
      .then((data) => {
        if (data.events) {
          setEvents(data.events);
        }
      })
      .catch((err) => console.error("Failed to fetch event history", err));
  }, []);

  useEffect(() => {
    feedRef.current?.scrollTo({ top: feedRef.current.scrollHeight, behavior: "smooth" });
  }, [events]);

  const getLogClass = (msgStr: string) => {
    let cl = "border-neutral-800 text-neutral-500";
    // Highlight n8n and external automations so judges see it immediately
    if (msgStr.includes("[n8n") || msgStr.includes("Slack") || msgStr.includes("Twilio") || msgStr.includes("PDF")) cl = "border-fuchsia-500/80 text-fuchsia-200 bg-fuchsia-500/10 shadow-[0_0_15px_rgba(217,70,239,0.15)] font-bold";
    else if (msgStr.includes("⚠") || msgStr.includes("ALERT")) cl = "border-amber-500/60 text-amber-200 bg-amber-500/5";
    else if (msgStr.includes("🔴") || msgStr.includes("DISRUPTION") || msgStr.includes("FATAL") || msgStr.includes("ESCALAT")) cl = "border-rose-500/60 text-rose-300 bg-rose-500/5";
    else if (msgStr.includes("🤝") || msgStr.includes("SUCCESS") || msgStr.includes("✅")) cl = "border-emerald-500/60 text-emerald-300 bg-emerald-500/5";
    else if (msgStr.includes("💰") || msgStr.includes("Bid")) cl = "border-cyan-500/40 text-cyan-200";
    else if (msgStr.includes("📉") || msgStr.includes("📈") || msgStr.includes("Learning")) cl = "border-purple-500/40 text-purple-300 bg-purple-500/5";
    else if (msgStr.includes("Supervisor") || msgStr.includes("🔍") || msgStr.includes("🧠")) cl = "border-blue-500/40 text-blue-200";
    return cl;
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-3 border-b border-neutral-800 bg-[#111] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Terminal className="w-3.5 h-3.5 text-cyan-400" />
          <h2 className="text-[11px] font-bold tracking-widest text-neutral-400 uppercase">Real-Time Market Feed</h2>
        </div>
        <div className="flex items-center gap-2">
            {connected ? (
                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-[9px] uppercase tracking-wider font-bold">
                    <Wifi className="w-3 h-3" /> Live
                </div>
            ) : (
                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded border border-amber-500/30 bg-amber-500/10 text-amber-400 text-[9px] uppercase tracking-wider font-bold">
                    <WifiOff className="w-3 h-3" /> Reconnecting...
                </div>
            )}
        </div>
      </div>
      <div ref={feedRef} className="flex-1 p-3 overflow-y-auto font-mono text-[11px] flex flex-col gap-1.5 scroll-smooth">
        {events.length === 0 ? (
          <div className="flex-1 flex items-center justify-center flex-col text-neutral-700 gap-2">
            <Activity className="w-5 h-5 animate-pulse" />
            <p className="italic text-[10px]">Awaiting live websocket events...</p>
          </div>
        ) : events.map((e, i) => {
          const msg = e.message || typeof e === 'string' ? e : JSON.stringify(e);
          const msgStr = typeof msg === 'string' ? msg : JSON.stringify(msg);
          const cl = getLogClass(msgStr);
          return (
            <div key={i} className={`border-l-2 pl-2 py-1.5 rounded-r transition-all animate-slide-up leading-relaxed ${cl}`}>
              {msgStr}
            </div>
          );
        })}
      </div>
    </div>
  );
}
