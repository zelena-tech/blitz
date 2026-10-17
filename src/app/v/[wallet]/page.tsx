"use client";

import { use } from "react";
import Image from "next/image";
import Link from "next/link";
import { ShareNetwork } from "@phosphor-icons/react";
import { Frame } from "@/components/Frame";
import { Img } from "@/components/ui";
import { CV_BASE, CV_BY_TYPE, DEMO, VOLUNTEERS, causeById, type CvItem } from "@/lib/seed";
import { useDemo } from "@/lib/demo";
import { explorerTx, useVolunteerChain } from "@/lib/chain";
import { shortAddr } from "@/lib/format";

/** 2f · Hoja de vida del voluntario (pública). Totales del contrato + detalle de eventos. */
export default function VolunteerCv({ params }: { params: Promise<{ wallet: string }> }) {
  const { wallet } = use(params);
  const demo = useDemo();
  const onChain = useVolunteerChain(wallet);
  const vol = VOLUNTEERS.find((v) => v.fullWallet.toLowerCase() === wallet.toLowerCase() || v.wallet === wallet) ?? VOLUNTEERS[0];
  const cause = causeById(DEMO.causeId)!;
  const m = cause.milestones[DEMO.milestoneIdx];

  const approved = demo.decision === "approved";
  const newH = demo.hours[vol.fullWallet] ?? vol.h;
  const cv: CvItem[] = [
    ...(approved ? [{ what: m.title, h: newH, cause: cause.short, by: cause.verifier, date: "hoy", tx: demo.approvedTx ?? "0xa41f…09bd" }] : []),
    ...CV_BASE,
  ];
  const hours = onChain?.hours ?? CV_BASE.reduce((a, c) => a + c.h, 0) + (approved ? newH : 0);
  const causes = onChain?.causes ?? 3;
  const milestones = onChain?.milestones ?? cv.length;
  const byType = CV_BY_TYPE.map((t) => ({ ...t, h: t.h + (approved && t.type === cause.type ? newH : 0) }));

  const share = async () => {
    const url = typeof window !== "undefined" ? window.location.href : "";
    try {
      if (navigator.share) await navigator.share({ title: `Hoja de vida de ${vol.name} en Loopi`, url });
      else { await navigator.clipboard.writeText(url); alert("Enlace copiado."); }
    } catch {}
  };

  return (
    <Frame>
      <div className="panel col gap14" style={{ margin: 10, padding: "18px 18px 22px" }}>
        <div className="between">
          <Link href="/" aria-label="Inicio"><Image src="/assets/logo-13.png" alt="Loopi" width={88} height={22} style={{ height: 22, width: "auto", display: "block" }} /></Link>
          <button onClick={share} style={{ display: "flex", alignItems: "center", gap: 6, border: 0, background: "#B7CB4F", color: "#1C2A20", borderRadius: 999, padding: "8px 14px", fontSize: 13, fontWeight: 500 }}>
            <ShareNetwork size={15} weight="bold" />Compartir
          </button>
        </div>
        <div className="rowx gap12" style={{ paddingTop: 8 }}>
          <div style={{ width: 64, height: 64, flex: "none", borderRadius: "50%", padding: 3, background: "#B7CB4F" }}>
            <Img label="" radius={29} style={{ width: 58, height: 58, borderRadius: "50%" }} />
          </div>
          <div className="col gap3">
            <span style={{ fontSize: 24, fontWeight: 500, letterSpacing: "-0.02em" }}>{vol.name}</span>
            <span className="mono" style={{ fontSize: 11, color: "#BFCBB8" }}>{shortAddr(vol.fullWallet, 6, 6)} · {vol.city}</span>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1.3fr 1fr 1fr", gap: 6, paddingTop: 6 }}>
          <div className="col gap2" style={{ background: "#F2F0E6", color: "#1C2A20", borderRadius: 18, padding: 12 }}>
            <span style={{ fontSize: 30, fontWeight: 500, letterSpacing: "-0.03em", lineHeight: 1 }}>{hours}</span><span className="meta-xs">horas verificadas</span>
          </div>
          <div className="col gap2" style={{ background: "#2F4A37", borderRadius: 18, padding: 12 }}>
            <span style={{ fontSize: 30, fontWeight: 500, lineHeight: 1 }}>{causes}</span><span style={{ fontSize: 11, color: "#BFCBB8" }}>causas</span>
          </div>
          <div className="col gap2" style={{ background: "#2F4A37", borderRadius: 18, padding: 12 }}>
            <span style={{ fontSize: 30, fontWeight: 500, lineHeight: 1 }}>{milestones}</span><span style={{ fontSize: 11, color: "#BFCBB8" }}>hitos</span>
          </div>
        </div>
      </div>

      <div style={{ padding: "8px 20px 0", display: "flex", flexWrap: "wrap", gap: 6 }}>
        {byType.map((t) => <span key={t.type} className="pill pill-lime" style={{ fontSize: 12, padding: "6px 12px", fontWeight: 400 }}>{t.type} · {t.h} h</span>)}
      </div>

      <div className="col gap8" style={{ padding: "22px 20px 28px" }}>
        <span className="h3">Hitos certificados</span>
        {cv.map((h, i) => {
          const full = h.tx.length > 20;
          return (
            <div key={i} className="row" style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) auto", gap: "4px 12px", padding: "12px 14px" }}>
              <span style={{ fontSize: 14, fontWeight: 500 }}>{h.what}</span><span style={{ fontSize: 14, fontWeight: 500 }}>{h.h} h</span>
              <span className="meta-xs">{h.cause} · verificó {h.by} · {h.date}</span>
              <a className="mono" style={{ fontSize: 11 }} href={full ? explorerTx(h.tx) : undefined} target={full ? "_blank" : undefined} rel="noreferrer">
                {full ? h.tx.slice(0, 6) + "…" + h.tx.slice(-4) : h.tx} ↗
              </a>
            </div>
          );
        })}
      </div>
    </Frame>
  );
}
