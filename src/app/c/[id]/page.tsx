"use client";

import { use, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Storefront, X } from "@phosphor-icons/react";
import { useAccount } from "wagmi";
import { Frame } from "@/components/Frame";
import { WalletPill } from "@/components/Header";
import { Bar, Cta, Img, StatusPill, Trace } from "@/components/ui";
import { causeById, type MilestoneStatus, type TraceEvent } from "@/lib/seed";
import { useDemo, setDemo, fakeTx } from "@/lib/demo";
import { useCauseChain, isConfigured } from "@/lib/chain";
import { useLoopiActions } from "@/lib/wallet/useLoopiActions";
import { cop, usd, shortAddr } from "@/lib/format";

/** 2b · Detalle de causa ★ demo */
export default function CauseDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const cause = causeById(Number(id));
  const demo = useDemo();
  const chain = useCauseChain(Number(id));
  const { address } = useAccount();
  const actions = useLoopiActions();

  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [amount, setAmount] = useState("1000");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();

  if (!cause) return <Frame><div style={{ padding: 40 }} className="sub">Causa no encontrada. <Link href="/">Volver</Link></div></Frame>;

  const onChain = chain && chain.exists ? chain : undefined;
  const raised = onChain ? onChain.raised : cause.raised + (demo.extraRaised[cause.id] ?? 0);
  const released = onChain ? onChain.released : cause.released + (cause.id === 1 && demo.decision === "approved" ? 4800 : 0);
  const room = Math.max(0, cause.goal - raised);
  const amt = Math.max(0, parseInt(amount, 10) || 0);
  const overGoal = amt > room || amt === 0;

  const milestones = cause.milestones.map((m, i) => {
    let status: MilestoneStatus = m.status;
    if (onChain?.milestones[i]) status = onChain.milestones[i].status;
    else if (cause.id === 1 && i === 1) status = demo.decision === "approved" ? "Liberado" : demo.evidence.submitted && !demo.decision ? "En revisión" : "Pendiente";
    return { ...m, status };
  });

  const trace: TraceEvent[] = [...(demo.extraTrace[cause.id] ?? []), ...cause.trace];

  const donate = async () => {
    setError(undefined);
    if (step === 0) { setStep(1); return; }
    const who = "Tu empresa · " + shortAddr(address ?? "0x91c0000000000000000000000000000000004a0");
    try {
      setBusy(true);
      let tx = fakeTx();
      if (isConfigured() && address) {
        const receipt = await actions.aportar(BigInt(cause.id), String(amt));
        tx = receipt.transactionHash;
        onChain?.refetch();
      }
      setDemo((s) => ({
        extraRaised: onChain ? s.extraRaised : { ...s.extraRaised, [cause.id]: (s.extraRaised[cause.id] ?? 0) + amt },
        extraTrace: { ...s.extraTrace, [cause.id]: [{ icon: "hand-heart", what: "Aporte de " + usd(amt), who, when: "ahora", tx }, ...(s.extraTrace[cause.id] ?? [])] },
      }));
      setOpen(false); setStep(0);
    } catch (e) {
      setError((e as Error).message.split("\n")[0]);
    } finally { setBusy(false); }
  };

  return (
    <Frame>
      <div style={{ padding: "10px 10px 0" }}>
        <div style={{ height: 240, position: "relative", borderRadius: 28, padding: 5, background: "#B7CB4F" }}>
          <Img label="Foto principal de la causa" radius={24} />
          <div style={{ position: "absolute", top: 16, left: 16, right: 16, display: "flex", justifyContent: "space-between", pointerEvents: "none" }}>
            <Link href="/" className="btn-circle" aria-label="Volver" style={{ pointerEvents: "auto" }}><ArrowLeft size={16} /></Link>
            <span style={{ alignSelf: "center", pointerEvents: "auto" }}><WalletPill causeId={BigInt(cause.id)} variant="wallet" /></span>
          </div>
        </div>
      </div>

      <div className="col gap8" style={{ padding: "18px 20px 0" }}>
        <div className="rowx gap6"><span className="pill pill-lime">{cause.type}</span><span className="pill pill-sand">{cause.place}, {cause.dept}</span></div>
        <h1 className="h1" style={{ margin: 0 }}>{cause.title}</h1>
        <p className="sub" style={{ margin: 0, lineHeight: 1.5 }}>{cause.description}</p>
      </div>

      <div className="card col gap10" style={{ margin: "16px 20px 0", padding: 16 }}>
        <div className="between" style={{ alignItems: "baseline" }}>
          <span style={{ fontSize: 24, fontWeight: 500, letterSpacing: "-0.02em" }}>{usd(raised)}</span>
          <span className="meta">de {usd(cause.goal)}</span>
        </div>
        <span className="meta" style={{ marginTop: -6 }}>{cop(raised)}</span>
        <Bar raised={raised} released={released} goal={cause.goal} h={10} />
        <div style={{ display: "flex", gap: 14, fontSize: 11, color: "#5B685C", flexWrap: "wrap" }}>
          <span className="rowx gap6"><span style={{ width: 8, height: 8, borderRadius: "50%", background: "#23392A" }} />Liberado {usd(released)}</span>
          <span className="rowx gap6"><span style={{ width: 8, height: 8, borderRadius: "50%", background: "#B7CB4F" }} />En custodia</span>
          <span>Cierra {cause.closes}</span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 8, paddingTop: 4 }}>
          <Cta variant="sm" onClick={() => { setOpen(true); setStep(0); setError(undefined); }}>Aportar</Cta>
          <Cta variant="outline" onClick={() => alert("Postulación off-chain: el organizador te registra por wallet (P1).")}>Voluntario</Cta>
        </div>
      </div>

      <div className="col gap8" style={{ padding: "24px 20px 0" }}>
        <span className="h2">Hitos</span>
        {milestones.map((m) => (
          <div key={m.n} className="row" style={{ display: "grid", gridTemplateColumns: "34px minmax(0,1fr) auto", gap: 12, alignItems: "center", padding: 12 }}>
            <span className="avatar" style={{ width: 34, height: 34, background: "#E6EDC4", color: "#23392A", fontSize: 13 }}>0{m.n}</span>
            <div className="col gap3">
              <span style={{ fontSize: 14, fontWeight: 500 }}>{m.title}</span>
              <span className="meta rowx gap4"><Storefront size={13} />{m.payee}</span>
            </div>
            <div className="col" style={{ alignItems: "flex-end", gap: 5 }}>
              <span style={{ fontSize: 13, fontWeight: 500 }}>{usd(m.amount)}</span>
              <StatusPill status={m.status} />
            </div>
          </div>
        ))}
      </div>

      <Trace events={trace} />

      {open && (
        <div className="overlay" onClick={() => !busy && setOpen(false)}>
          <div className="sheet" onClick={(e) => e.stopPropagation()} role="dialog" aria-label="Aportar">
            <div className="between">
              <span style={{ fontSize: 20, fontWeight: 500, letterSpacing: "-0.02em" }}>Aportar a {cause.short}</span>
              <button className="btn-circle" style={{ width: 36, height: 36, border: "1px solid #E1DCCB" }} onClick={() => setOpen(false)} aria-label="Cerrar"><X size={16} /></button>
            </div>
            <div className="field">
              <label className="label" htmlFor="monto">Monto en USD</label>
              <input id="monto" type="number" inputMode="numeric" min={1} value={amount} onChange={(e) => { setAmount(e.target.value); setStep(0); }}
                className="input" style={{ fontSize: 24, fontWeight: 500, borderRadius: 16, padding: "10px 14px" }} />
              <span className="meta">{cop(amt)} · falta para la meta: {usd(room)}</span>
            </div>
            <div className="col gap8">
              <div className="rowx gap10" style={{ fontSize: 13 }}><span className="avatar" style={{ width: 24, height: 24, fontSize: 12 }}>{step > 0 ? "✓" : "1"}</span>Autorizar el monto</div>
              <div className="rowx gap10" style={{ fontSize: 13 }}><span className="avatar" style={{ width: 24, height: 24, fontSize: 12, background: "#E8DFCF" }}>2</span>Confirmar el aporte</div>
            </div>
            {overGoal && amt > 0 && <div style={{ fontSize: 12, color: "#8A4B2A" }}>Supera lo que falta para la meta.</div>}
            {error && <div style={{ fontSize: 12, color: "#8A4B2A" }}>{error}</div>}
            <Cta onClick={donate} disabled={overGoal || busy}>{busy ? "Enviando…" : step === 0 ? "Autorizar " + usd(amt) : "Confirmar aporte"}</Cta>
            <div className="meta-xs" style={{ lineHeight: 1.4 }}>Tu aporte queda en custodia y solo se libera al proveedor cuando {cause.verifier} verifica cada hito.</div>
          </div>
        </div>
      )}
    </Frame>
  );
}
