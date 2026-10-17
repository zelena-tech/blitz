"use client";

import { useEffect, useState } from "react";
import type { TraceEvent } from "@/lib/seed";

/**
 * Estado compartido de la demo entre pantallas (lo que en producción vive en Supabase):
 * aportes simulados, traza, evidencia enviada y decisión del verificador.
 * Persiste en localStorage para que 2b → 2d → 2e → 2f cuenten la misma historia.
 */
export type DemoState = {
  extraRaised: Record<number, number>;
  extraTrace: Record<number, TraceEvent[]>;
  evidence: { submitted: boolean; hash?: `0x${string}`; note: string; tx?: string };
  decision: null | "approved" | "rejected";
  approvedTx?: string;
  hours: Record<string, number>;
};

const KEY = "loopi-demo-v1";
const initial: DemoState = { extraRaised: {}, extraTrace: {}, evidence: { submitted: false, note: "" }, decision: null, hours: {} };

let state: DemoState = initial;
const listeners = new Set<() => void>();

function load(): DemoState {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? { ...initial, ...JSON.parse(raw) } : initial;
  } catch {
    return initial;
  }
}

export function setDemo(patch: Partial<DemoState> | ((s: DemoState) => Partial<DemoState>)) {
  const p = typeof patch === "function" ? patch(state) : patch;
  state = { ...state, ...p };
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch {}
  listeners.forEach((l) => l());
}

export function resetDemo() {
  state = initial;
  try { localStorage.removeItem(KEY); } catch {}
  listeners.forEach((l) => l());
}

export function useDemo(): DemoState {
  const [s, setS] = useState<DemoState>(initial);
  useEffect(() => {
    state = load();
    setS(state);
    const l = () => setS(state);
    listeners.add(l);
    return () => { listeners.delete(l); };
  }, []);
  return s;
}

export const fakeTx = () => "0x" + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join("");
