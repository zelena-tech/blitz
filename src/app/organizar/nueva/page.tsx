"use client";

import { useState } from "react";
import Link from "next/link";
import { CameraPlus, PlusCircle, X } from "@phosphor-icons/react";
import { useAccount } from "wagmi";
import { Frame } from "@/components/Frame";
import { Nav, WalletPill } from "@/components/Header";
import { Cta } from "@/components/ui";
import { usd } from "@/lib/format";

type Draft = { n: number; title: string; payee: string; wallet: string; amount: number };

/** 2c · Crear causa (P1) → createCause */
export default function NewCause() {
  const { address } = useAccount();
  const [milestones, setMilestones] = useState<Draft[]>([
    { n: 1, title: "Tejas y amarres", payee: "Ferretería El Atrato", wallet: "0x5f1…c03", amount: 3200 },
    { n: 2, title: "Mano de obra y transporte", payee: "Transportes Río Quito", wallet: "0x8aa…71d", amount: 4800 },
    { n: 3, title: "Instalación final", payee: "Ferretería El Atrato", wallet: "0x5f1…c03", amount: 4000 },
  ]);
  const [verifier, setVerifier] = useState("0xC0a9…77f2 · Cruz Roja Chocó");
  const goal = milestones.reduce((a, m) => a + m.amount, 0);
  const sameAsMe = !!address && verifier.toLowerCase().startsWith(address.toLowerCase().slice(0, 6));

  return (
    <Frame>
      <div className="header">
        <Link href="/" className="btn-text"><X size={14} />Cancelar</Link>
        <Nav />
        <WalletPill />
      </div>
      <form className="col gap14 form-narrow" style={{ padding: "8px 20px 24px" }} onSubmit={(e) => { e.preventDefault(); alert("createCause(verifier, metadataHash, payees, amounts): se conecta en P1."); }}>
        <h1 className="h1" style={{ margin: 0 }}>Nueva causa</h1>
        <div className="field"><label className="label">Título</label><input className="input" defaultValue="Techos para la vereda El Tapón" /></div>
        <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(0,1fr)", gap: 10 }}>
          <div className="field"><label className="label">Tipo de ayuda</label>
            <select className="select" defaultValue="Vivienda">{["Vivienda", "Alimentos", "Salud", "Logística", "Apoyo psicosocial"].map((t) => <option key={t}>{t}</option>)}</select>
          </div>
          <div className="field"><label className="label">Municipio</label><input className="input" defaultValue="Bagadó, Chocó" /></div>
        </div>
        <div className="field"><label className="label">Descripción</label><textarea className="textarea" rows={3} defaultValue="38 familias perdieron el techo…" /></div>
        <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(0,1fr)", gap: 10 }}>
          <label style={{ height: 76, borderRadius: 14, border: "1.5px dashed #9FB08E", background: "#E6EDC4", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, fontSize: 13, color: "#23392A", cursor: "pointer" }}>
            <CameraPlus size={18} />Fotos<input type="file" accept="image/*" multiple className="sr-only" />
          </label>
          <div className="field"><label className="label">Fecha límite</label><input className="input" type="date" defaultValue="2026-11-30" /></div>
        </div>

        <div className="between" style={{ alignItems: "baseline", paddingTop: 6 }}><span className="h3">Hitos</span><span className="meta">Meta: {usd(goal)}</span></div>
        {milestones.map((m) => (
          <div key={m.n} className="col gap4" style={{ padding: "12px 14px", borderRadius: 16, background: "#FBFAF5", boxShadow: "0 0 0 1px #E1DCCB" }}>
            <div className="between" style={{ fontSize: 14, fontWeight: 500 }}><span>0{m.n} · {m.title}</span><span>{usd(m.amount)}</span></div>
            <span className="meta-xs mono">Paga a {m.payee} · {m.wallet}</span>
          </div>
        ))}
        <button type="button" className="btn-ghost" style={{ alignSelf: "flex-start" }}
          onClick={() => setMilestones((ms) => [...ms, { n: ms.length + 1, title: "Nuevo hito", payee: "Proveedor", wallet: "0x…", amount: 0 }])}>
          <PlusCircle size={16} />Agregar hito
        </button>

        <div className="field">
          <label className="label">Wallet del verificador</label>
          <input className="input mono" style={{ fontSize: 13 }} value={verifier} onChange={(e) => setVerifier(e.target.value)} />
          <span className="meta-xs" style={{ color: sameAsMe ? "#8A4B2A" : undefined }}>Debe ser un tercero: no puede ser tu wallet.</span>
        </div>
        <div className="field">
          <span className="label">Cupos de voluntarios</span>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            <span className="pill pill-lime" style={{ fontSize: 12, padding: "6px 12px", fontWeight: 400 }}>Construcción · 6</span>
            <span className="pill pill-lime" style={{ fontSize: 12, padding: "6px 12px", fontWeight: 400 }}>Logística · 3</span>
            <span className="pill" style={{ border: "1px dashed #9FB08E", color: "#4F6B3E", fontSize: 12, padding: "5px 12px", fontWeight: 400 }}>+ tipo</span>
          </div>
        </div>
        <Cta type="submit" disabled={sameAsMe} style={{ marginTop: 6 }}>Publicar causa</Cta>
      </form>
    </Frame>
  );
}
