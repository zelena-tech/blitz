"use client";

import { use, useState } from "react";
import Link from "next/link";
import { UploadSimple, UserPlus } from "@phosphor-icons/react";
import { useAccount } from "wagmi";
import { Frame } from "@/components/Frame";
import { Header } from "@/components/Header";
import { Cta, Img, StatusPill } from "@/components/ui";
import { causeById, DEMO, EVIDENCE_FILES, EVIDENCE_NOTE, VOLUNTEERS, type MilestoneStatus } from "@/lib/seed";
import { useDemo, setDemo, fakeTx } from "@/lib/demo";
import { evidenceBundleHash, hashText } from "@/lib/hash";
import { isConfigured, useCauseChain } from "@/lib/chain";
import { useLoopiActions } from "@/lib/wallet/useLoopiActions";
import { usd, initials } from "@/lib/format";

/** 2d · Consola del organizador → submitEvidence */
export default function OrganizerConsole({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const cause = causeById(Number(id));
  const demo = useDemo();
  const chain = useCauseChain(Number(id));
  const { address } = useAccount();
  const actions = useLoopiActions();
  const [privacy, setPrivacy] = useState(false);
  const [note, setNote] = useState(EVIDENCE_NOTE);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();
  const [hours, setHours] = useState<Record<string, number>>(Object.fromEntries(VOLUNTEERS.map((v) => [v.fullWallet, v.h])));

  if (!cause) return <Frame><div style={{ padding: 40 }} className="sub">Causa no encontrada. <Link href="/">Volver</Link></div></Frame>;

  const idx = DEMO.milestoneIdx;
  const m = cause.milestones[idx];
  const onChain = chain && chain.exists ? chain : undefined;
  const status: MilestoneStatus = onChain?.milestones[idx]?.status
    ?? (demo.decision === "approved" ? "Liberado" : demo.evidence.submitted && !demo.decision ? "En revisión" : "Pendiente");
  const submitted = status !== "Pendiente";
  const totalHours = Object.values(hours).reduce((a, b) => a + b, 0);

  const submit = async () => {
    setError(undefined);
    // Huella del paquete: keccak256 de {causa, hito, hashes de cada archivo, nota} (JSON canónico)
    const fileHashes = EVIDENCE_FILES.map((f) => hashText(f.name));
    const bundle = evidenceBundleHash(cause.id, idx, fileHashes, note);
    try {
      setBusy(true);
      let tx = fakeTx();
      if (isConfigured() && address) {
        const receipt = await actions.subirEvidencia(BigInt(cause.id), idx, bundle);
        tx = receipt.transactionHash;
        onChain?.refetch();
      }
      setDemo((s) => ({
        evidence: { submitted: true, hash: bundle, note, tx },
        decision: null,
        hours,
        extraTrace: { ...s.extraTrace, [cause.id]: [{ icon: "camera", what: `Evidencia del hito 0${m.n} subida`, who: cause.organizer, when: "ahora", tx }, ...(s.extraTrace[cause.id] ?? [])] },
      }));
    } catch (e) {
      setError((e as Error).message.split("\n")[0]);
    } finally { setBusy(false); }
  };

  return (
    <Frame>
      <Header causeId={BigInt(cause.id)} />
      <div className="col gap6" style={{ padding: "10px 20px 0" }}>
        <span className="meta">{cause.title} · Hito 0{m.n} de 0{cause.milestones.length}</span>
        <h1 className="h1" style={{ margin: 0 }}>{m.title}</h1>
        <div className="rowx gap8" style={{ paddingTop: 4, flexWrap: "wrap" }}>
          <span className="pill" style={{ background: status === "Liberado" ? "#B7CB4F" : status === "En revisión" ? "#23392A" : "#E8DFCF", color: status === "Liberado" ? "#1C2A20" : status === "En revisión" ? "#E6EDC4" : "#3E4B40" }}>{status}</span>
          <span className="meta">{usd(m.amount)} → {m.payee}</span>
        </div>
      </div>

      <div className="card col gap10" style={{ margin: "18px 20px 0", padding: 14 }}>
        <span style={{ fontSize: 16, fontWeight: 500 }}>Evidencia</span>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,minmax(0,1fr))", gap: 8 }}>
          {EVIDENCE_FILES.map((f) => (
            <div key={f.id} className="col gap4">
              <div style={{ aspectRatio: "1" }}><Img label="Foto" radius={12} /></div>
              <span className="mono" style={{ fontSize: 10, color: "#5B685C" }}>{f.name}</span>
            </div>
          ))}
        </div>
        <textarea className="textarea" rows={3} value={note} onChange={(e) => setNote(e.target.value)} disabled={submitted} style={{ fontSize: 13, background: "#F2F0E6", padding: "10px 12px" }} />
        <label style={{ display: "flex", gap: 10, alignItems: "flex-start", fontSize: 13, lineHeight: 1.4, cursor: "pointer", padding: 12, borderRadius: 14, background: "#E6EDC4", color: "#23392A" }}>
          <input type="checkbox" checked={privacy} onChange={() => setPrivacy((p) => !p)} disabled={submitted} style={{ accentColor: "#23392A", width: 18, height: 18, margin: "1px 0 0", flex: "none" }} />
          <span>Confirmo que ninguna foto muestra rostros ni documentos de damnificados.</span>
        </label>
        {error && <div style={{ fontSize: 12, color: "#8A4B2A" }}>{error}</div>}
        <Cta onClick={submit} disabled={!privacy || submitted || busy} icon={<UploadSimple size={16} weight="bold" />}>
          {busy ? "Enviando…" : submitted ? "Enviada a verificación" : "Enviar a verificación"}
        </Cta>
        {submitted && (demo.evidence.hash || onChain?.milestones[idx]?.evidence) && (
          <div className="mono break" style={{ fontSize: 11, color: "#5B685C", lineHeight: 1.5 }}>
            Huella del paquete anclada<br />
            <span style={{ color: "#23392A" }}>{onChain?.milestones[idx]?.evidence ?? demo.evidence.hash}</span>
          </div>
        )}
      </div>

      <div className="col gap8" style={{ padding: "22px 20px 28px" }}>
        <div className="between" style={{ alignItems: "baseline" }}><span className="h3">Voluntarios del hito</span><span className="meta">{totalHours} h propuestas</span></div>
        {VOLUNTEERS.map((v) => (
          <div key={v.fullWallet} className="row" style={{ display: "grid", gridTemplateColumns: "36px minmax(0,1fr) 72px", gap: 10, alignItems: "center", padding: "8px 10px", borderRadius: 16 }}>
            <span className="avatar" style={{ width: 36, height: 36, fontSize: 12 }}>{initials(v.name)}</span>
            <div className="col gap2" style={{ minWidth: 0 }}><span style={{ fontSize: 13, fontWeight: 500 }}>{v.name}</span><span className="mono meta-xs">{v.wallet}</span></div>
            <div className="rowx gap4">
              <input type="number" min={1} max={40} value={hours[v.fullWallet]} disabled={submitted}
                onChange={(e) => setHours((h) => ({ ...h, [v.fullWallet]: Math.max(0, parseInt(e.target.value, 10) || 0) }))}
                className="input" style={{ textAlign: "right", background: "#F2F0E6", borderRadius: 10, padding: "6px 8px" }} aria-label={`Horas de ${v.name}`} />
              <span className="meta">h</span>
            </div>
          </div>
        ))}
        <button className="btn-ghost" style={{ alignSelf: "flex-start", padding: "4px 0" }} onClick={() => alert("Registro por wallet: P1.")}><UserPlus size={16} />Registrar por wallet</button>
      </div>
    </Frame>
  );
}
