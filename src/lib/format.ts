/** Montos en USD con ≈ COP al lado (mock: 1 USD = 3.950 COP), como pide el handoff. */
export const COP_PER_USD = 3950;

export const usd = (n: number) => "USD " + Math.round(n).toLocaleString("es-CO");

export const cop = (n: number) =>
  "≈ COP " + ((n * COP_PER_USD) / 1e6).toFixed(1).replace(".", ",") + " M";

export const pct = (a: number, b: number) =>
  (b > 0 ? Math.min(100, (a / b) * 100) : 0).toFixed(1) + "%";

/** 0x4b2d…7a0e91 */
export const shortAddr = (a?: string, head = 5, tail = 3) =>
  a ? a.slice(0, head) + "…" + a.slice(-tail) : "";

export const shortTx = (h?: string) => (h ? h.slice(0, 5) + "…" + h.slice(-3) : "");

export const initials = (name: string) =>
  name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

export const fmtDate = (d: Date) =>
  d.toLocaleDateString("es-CO", { day: "numeric", month: "short" }).replace(".", "");
