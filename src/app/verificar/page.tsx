"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Fingerprint, SealCheck } from "@phosphor-icons/react";
import { useAccount } from "wagmi";
import { Frame } from "@/components/Frame";
import { Header } from "@/components/Header";
import { Cta, Img } from "@/components/ui";
import { causeById, DEMO, EVIDENCE_FILES, VOLUNTEERS } from "@/lib/seed";
import { useDemo, setDemo, fakeTx } from "@/lib/demo";
import { evidenceBundleHash, hashText } from "@/lib/hash";
import { explorerTx, isConfigured, useCauseChain } from "@/lib/chain";
import { useLoopiActions } from "@/lib/wallet/useLoopiActions";
import { usd, initials } from "@/lib/format";

type HashState = "idle" | "computing" | "match" | "mismatch";

/** 2e · Bandeja del verificador ★ demo → approveMilestone / rejectMilestone */
export default function VerifierInbox() {
  const cause = causeById(DEMO.causeId)!;
  const idx = DEMO.milestoneIdx;
  const seedM = cause.milestones[idx];
  const demo = useDemo();
  const chain = useCauseChain(cause.id);
  const { address } = useAccount();
  const actions = useLoopiActions();
  const [hash, setHash] = useState<HashState>("idle");
  const [showReject, setShowReject] = useState(false);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);

  const onChain = chain && chain.exists ? chain : undefined;
  const m = { ...seedM, amount: onChain?.milestones[idx]?.amount ?? seedM.amount, payee: onChain?.milestones[idx] && onChain.milestones[idx].amount === 0 ? "sin pago, solo horas" : seedM.payee };
  const chainStatus = onChain?.milestones[idx]?.status;
  const submitted = chainStatus ? chainStatus !== "Pendiente" : demo.evidence.submitted;
  const anchored = onChain?.milestones[idx]?.evidence ?? demo.evidence.hash;
  const approved = chainStatus === "Liberado" || demo.decision === "approved";
  const rejected = !approved && demo.decision === "rejected";
  const undecided = !approved && !rejected;
  const hours = VOLUNTEERS.map((v) => ({ ...v, h: demo.hours[v.fullWallet] ?? v.h }));
  const totalHours = hours.reduce((a, v) => a + v.h, 0);
  const canApprove = submitted && hash === "match";

  const recalc = () => {
    setHash("computing");
    timer.current = setTimeout(() => {
      // Recalcula desde los archivos y la nota (en producción, desde Supabase) y compara con el hash on-chain
      const fileHashes = EVIDENCE_FILES.map((f) => hashText(f.name));
      const local = evidenceBundleHash(cause.id, idx, fileHashes, demo.evidence.note);
      setHash(anchored && local.toLowerCase() === anchored.toLowerCase() ? "match" : "mismatch");
    }, 1100);
  };

  const approve = async () => {
    setError(undefined);
    try {
      setBusy(true);
      let tx = fakeTx();
      if (isConfigured() && address) {
        const certs = hours.map((v) => ({ volunteer: v.fullWallet, hoursWorked: v.h, skill: 3 }));
        const receipt = await actions.aprobar(BigInt(cause.id), idx, certs);
        tx = receipt.transactionHash;
        onChain?.refetch();
      }
      setDemo((s) => ({
        decision: "approved", approvedTx: tx,
        extraTrace: { ...s.extraTrace, [cause.id]: [
          { icon: "users-three", what: `${totalHours} horas certificadas a ${hours.length} voluntarios`, who: cause.verifier, when: "ahora", tx },
          { icon: "storefront", what: `${usd(m.amount)} pagados a ${m.payee} por el hito 0${m.n}`, who: "Liberación automática", when: "ahora", tx },
          { icon: "seal-check", what: `Hito 0${m.n} verificado: la huella de ${EVIDENCE_FILES.length} fotos coincide`, who: cause.verifier, when: "ahora", tx },
          ...(s.extraTrace[cause.id] ?? []),
        ] },
      }));
    } catch (e) { setError((e as Error).message.split("\n")[0]); } finally { setBusy(false); }
  };

  const reject = async () => {
    if (!showReject) { setShowReject(true); return; }
    setError(undefined);
    try {
      setBusy(true);
      const reasonHash = hashText(reason || "sin motivo");
      if (isConfigured() && address) {
        await actions.rechazar(BigInt(cause.id), idx, reasonHash);
        onChain?.refetch();
      }
      setDemo({ decision: "rejected", evidence: { submitted: false, note: demo.evidence.note } });
      setShowReject(false); setHash("idle");
    } catch (e) { setError((e as Error).message.split("\n")[0]); } finally { setBusy(false); }
  };

  const recalcText = hash === "idle" ? "—" : hash === "computing" ? "calculando…" : hash === "match" ? anchored : "no coincide con lo registrado";
  const hint = !submitted ? "Primero el organizador envía la evidencia (2d)." : hash === "mismatch" ? "La huella no coincide: no se puede aprobar." : hash !== "match" ? "Recalcula la huella para habilitar la aprobación." : `Aprobar paga ${usd(m.amount)} al proveedor y certifica las horas en un solo paso.`;

  return (
    <Frame>
      <Header causeId={BigInt(cause.id)} />
      <div className="split">
      <div className="main">
      <div className="o1">
      <div className="rowx gap6" style={{ padding: "8px 20px 0" }}>
        <span className="pill" style={{ background: "#23392A", color: "#F2F0E6", fontSize: 12, padding: "7px 14px", fontWeight: 400 }}>En revisión · {submitted && undecided ? 1 : 0}</span>
        <span className="pill" style={{ background: "#FBFAF5", border: "1px solid #E1DCCB", fontSize: 12, padding: "6px 14px", fontWeight: 400 }}>Resueltos · {approved ? 5 : 4}</span>
      </div>
      <div className="col gap4" style={{ padding: "16px 20px 0" }}>
        <span className="meta">{cause.short} · Hito 0{m.n} de 0{cause.milestones.length}</span>
        <h1 style={{ margin: 0, fontSize: 24, fontWeight: 500, lineHeight: 1.15, letterSpacing: "-0.02em" }}>{m.title}</h1>
        <span className="meta">{usd(m.amount)} → {m.payee} · {submitted ? "subido hace un momento" : "esperando evidencia (2d)"}</span>
      </div>
      <div style={{ padding: "14px 20px 0", display: "grid", gridTemplateColumns: "repeat(3,minmax(0,1fr))", gap: 8 }}>
        {EVIDENCE_FILES.map((f) => (
          <div key={f.id} className="col gap4"><div style={{ aspectRatio: "1" }}><Img label="Foto" radius={12} /></div><span className="mono" style={{ fontSize: 10, color: "#5B685C" }}>{f.name}</span></div>
        ))}
      </div>
      <div style={{ padding: "10px 20px 0", fontSize: 13, lineHeight: 1.45, color: "#3E4B40" }}>{submitted ? `"${demo.evidence.note}"` : "Sin nota todavía."}</div>
      </div>
      </div>

      <div className="side">
      <div className={"panel integrity col gap12 o2" + (hash === "match" ? " match" : "")} style={{ margin: "16px 10px 0", padding: 18 }}>
        <div className="between"><span style={{ fontSize: 15, fontWeight: 500 }}>Integridad de la evidencia</span><span className="mono" style={{ fontSize: 11, color: "#BFCBB8" }}>keccak256</span></div>
        <div className="col gap3"><span style={{ fontSize: 11, color: "#BFCBB8" }}>Registrado en Monad</span><span className="mono break" style={{ fontSize: 12, color: "#D6E39A" }}>{anchored ?? "—"}</span></div>
        <div className="col gap3"><span style={{ fontSize: 11, color: "#BFCBB8" }}>Recalculado de estos archivos</span><span className="mono break" style={{ fontSize: 12, color: hash === "match" ? "#D6E39A" : hash === "mismatch" ? "#E8A98A" : "#8FA08A" }}>{recalcText}</span></div>
        {hash === "match" && (
          <div className="rowx gap12" style={{ padding: 10, borderRadius: 999, background: "#2F4A37" }}>
            <span className="avatar check-glow" style={{ width: 40, height: 40, fontSize: 20 }}><Check size={20} weight="bold" /></span>
            <div className="col"><span style={{ fontSize: 15, fontWeight: 500, color: "#E6EDC4" }}>Coincide</span><span style={{ fontSize: 11, color: "#BFCBB8" }}>Las fotos no cambiaron desde que se subieron</span></div>
          </div>
        )}
        {hash !== "match" && (
          <Cta variant="cream" onClick={recalc} disabled={!submitted || hash === "computing"} icon={<Fingerprint size={17} weight="bold" />}>Recalcular huella</Cta>
        )}
      </div>

      <div className="col gap6 o3" style={{ padding: "18px 20px 0" }}>
        <div className="between"><span style={{ fontSize: 16, fontWeight: 500 }}>Horas a certificar</span><span className="meta">{totalHours} h</span></div>
        {hours.map((v) => (
          <div key={v.fullWallet} className="between" style={{ fontSize: 13, padding: "8px 0", borderTop: "1px solid #E1DCCB" }}>
            <span className="rowx gap8"><span className="avatar" style={{ width: 26, height: 26, background: "#E6EDC4", color: "#23392A", fontSize: 10 }}>{initials(v.name)}</span>{v.name}</span>
            <span style={{ fontWeight: 500 }}>{v.h} h</span>
          </div>
        ))}
      </div>

      <div className="col gap8 o4" style={{ padding: "14px 20px 28px" }}>
        {undecided && (
          <div className="col gap8">
            {showReject && <textarea className="textarea" rows={2} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Motivo del rechazo (queda su huella registrada)" style={{ fontSize: 13, padding: "10px 12px" }} />}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1.7fr", gap: 8 }}>
              <button className="btn-secondary" onClick={reject} disabled={!submitted || busy}>{showReject ? "Enviar" : "Rechazar"}</button>
              <Cta variant="sm" style={{ minHeight: 52 }} onClick={approve} disabled={!canApprove || busy} icon={<SealCheck size={16} weight="bold" />}>{busy ? "Enviando…" : "Aprobar y pagar"}</Cta>
            </div>
            {error && <div style={{ fontSize: 12, color: "#8A4B2A" }}>{error}</div>}
            <span className="meta-xs" style={{ lineHeight: 1.4 }}>{hint}</span>
          </div>
        )}
        {approved && (
          <div className="col gap6" style={{ padding: 16, borderRadius: 22, background: "#E6EDC4", boxShadow: "0 0 0 1px #B7CB4F", color: "#23392A" }}>
            <span className="rowx gap8" style={{ fontSize: 15, fontWeight: 500 }}><SealCheck size={18} weight="fill" />Hito 0{m.n} verificado</span>
            <span style={{ fontSize: 12 }}>{usd(m.amount)} pagados a {m.payee} · {totalHours} h certificadas a {hours.length} voluntarios</span>
            <a className="mono" style={{ fontSize: 11 }} href={demo.approvedTx ? explorerTx(demo.approvedTx) : `/v/${VOLUNTEERS[0].fullWallet}`} target={demo.approvedTx ? "_blank" : undefined} rel="noreferrer">
              ver en Monad {demo.approvedTx ? demo.approvedTx.slice(0, 6) + "…" + demo.approvedTx.slice(-4) : ""} ↗
            </a>
          </div>
        )}
        {rejected && (
          <div className="card col gap6" style={{ padding: 16 }}>
            <span style={{ fontSize: 15, fontWeight: 500 }}>Hito devuelto a Pendiente</span>
            <span className="meta">El motivo quedó registrado. Los fondos siguen en custodia.</span>
          </div>
        )}
      </div>
      </div>
      </div>
    </Frame>
  );
}
