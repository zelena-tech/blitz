"use client";

import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
import { ArrowRight, ArrowUpRight, Camera, HandHeart, SealCheck, Storefront, UsersThree } from "@phosphor-icons/react";
import { PILL, type MilestoneStatus, type TraceEvent } from "@/lib/seed";
import { explorerTx } from "@/lib/chain";

/** Placeholder de imagen (reemplaza <image-slot> del prototipo) */
export function Img({ label, radius = 16, src, style }: { label: string; radius?: number; src?: string; style?: CSSProperties }) {
  return (
    <div className="img" style={{ borderRadius: radius, ...style }} role="img" aria-label={label}>
      {src ? <img src={src} alt="" /> : label}
    </div>
  );
}

export function StatusPill({ status }: { status: MilestoneStatus }) {
  const [bg, fg] = PILL[status];
  return <span className="pill" style={{ background: bg, color: fg, fontSize: 10, padding: "3px 8px" }}>{status}</span>;
}

export function Bar({ raised, released, goal, h = 8 }: { raised: number; released: number; goal: number; h?: number }) {
  const w = (a: number) => (goal > 0 ? Math.min(100, (a / goal) * 100).toFixed(1) : "0") + "%";
  return (
    <div className="bar" style={{ height: h }}>
      <span className="raised" style={{ width: w(raised) }} />
      <span className="released" style={{ width: w(released) }} />
    </div>
  );
}

export function Cta({
  children, icon, onClick, disabled, variant, type = "button", style,
}: { children: ReactNode; icon?: ReactNode; onClick?: () => void; disabled?: boolean; variant?: "sm" | "outline" | "cream"; type?: "button" | "submit"; style?: CSSProperties }) {
  return (
    <button type={type} className={"cta" + (variant ? " " + variant : "")} onClick={onClick} disabled={disabled} style={style}>
      {children}
      <span className="circle">{icon ?? <ArrowRight size={16} weight="bold" />}</span>
    </button>
  );
}

const ICONS = {
  "users-three": UsersThree,
  storefront: Storefront,
  "seal-check": SealCheck,
  camera: Camera,
  "hand-heart": HandHeart,
};

/** Panel oscuro de la traza: el héroe visual. Más reciente arriba. */
export function Trace({ events }: { events: TraceEvent[] }) {
  return (
    <div className="panel" style={{ margin: "24px 10px 10px", padding: "20px 16px 8px", display: "flex", flexDirection: "column" }}>
      <div className="between" style={{ padding: "0 4px 14px" }}>
        <span className="h2">Traza</span>
        <span className="pill" style={{ background: "#B7CB4F", color: "#1C2A20" }}>cada paso, con evidencia</span>
      </div>
      {events.map((t, i) => {
        const Icon = ICONS[t.icon];
        const full = t.tx.length > 20;
        return (
          <div key={i} style={{ display: "grid", gridTemplateColumns: "32px minmax(0,1fr)", gap: 12, padding: "0 4px" }}>
            <div className="col" style={{ alignItems: "center" }}>
              <span style={{ width: 32, height: 32, borderRadius: "50%", background: "#2F4A37", color: "#B7CB4F", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15 }}>
                <Icon size={15} />
              </span>
              <span style={{ flex: 1, width: 0, borderLeft: "1px dashed #5E7A5F", minHeight: 12 }} />
            </div>
            <div className="col gap3" style={{ padding: "5px 0 16px" }}>
              <span style={{ fontSize: 13, lineHeight: 1.35, textWrap: "pretty" }}>{t.what}</span>
              <span style={{ fontSize: 11, color: "#BFCBB8" }}>{t.who} · {t.when}</span>
              <a
                href={full ? explorerTx(t.tx) : undefined}
                target={full ? "_blank" : undefined}
                rel="noreferrer"
                className="mono"
                style={{ fontSize: 11, display: "flex", alignItems: "center", gap: 4, color: "#D6E39A" }}
              >
                ver en Monad {full ? t.tx.slice(0, 5) + "…" + t.tx.slice(-3) : t.tx}<ArrowUpRight size={11} />
              </a>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function BackLink({ href }: { href: string }) {
  return <Link href={href} className="btn-circle" aria-label="Volver" style={{ pointerEvents: "auto" }}>←</Link>;
}
