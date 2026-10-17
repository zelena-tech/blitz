"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { MapPin, Users } from "@phosphor-icons/react";
import { Frame } from "@/components/Frame";
import { Header } from "@/components/Header";
import { Bar, Img } from "@/components/ui";
import { CAUSES, DEPTS, TYPES } from "@/lib/seed";
import { useDemo, resetDemo } from "@/lib/demo";
import { usd } from "@/lib/format";

/** 2a · Explorar causas */
export default function Explore() {
  const [type, setType] = useState<(typeof TYPES)[number]>("Todos");
  const [dept, setDept] = useState<string>(DEPTS[0]);
  const demo = useDemo();
  // /?reset=1 reinicia la historia de la demo (aportes, evidencia, decisión)
  useEffect(() => { if (new URLSearchParams(window.location.search).has("reset")) { resetDemo(); history.replaceState(null, "", "/"); } }, []);

  const visible = CAUSES.filter((c) => (type === "Todos" || c.type === type) && (dept === DEPTS[0] || c.dept === dept)).map((c) => ({
    ...c,
    raised: c.raised + (demo.extraRaised[c.id] ?? 0),
    released: c.released + (c.id === 1 && demo.decision === "approved" ? 4800 : 0),
  }));

  return (
    <Frame>
      <Header />
      <div className="explore-top px20" style={{ paddingTop: 14 }}>
        <div className="col gap8 hero-copy">
          <span className="pill pill-lime" style={{ alignSelf: "flex-start" }}>Terremoto del 10 de agosto</span>
          <h1 className="h1 h1-xl" style={{ margin: 0 }}>Ayuda que <span className="mark">se ve</span> llegar</h1>
          <p className="sub" style={{ margin: 0 }}>Cada aporte se libera por hitos, solo cuando un tercero verifica la evidencia.</p>
        </div>
        <div className="rowx gap8" style={{ paddingTop: 18 }}>
          <MapPin size={18} color="#6E8B5A" />
          <select className="select-pill" value={dept} onChange={(e) => setDept(e.target.value)} aria-label="Departamento" style={{ minWidth: 220 }}>
            {DEPTS.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
      </div>

      <div className="chips" role="tablist" aria-label="Tipo de ayuda" style={{ paddingBottom: 14 }}>
        {TYPES.map((t) => (
          <button key={t} role="tab" aria-selected={t === type} className={"chip" + (t === type ? " on" : "")} onClick={() => setType(t)}>{t}</button>
        ))}
      </div>

      <div className="cards">
        {visible.map((c) => (
          <Link key={c.id} href={`/c/${c.id}`} className="card col gap10" style={{ padding: 8, color: "inherit", textDecoration: "none" }}>
            <div style={{ height: 132, position: "relative" }}>
              <Img label={c.title} radius={16} src={c.image} />
              <span className="pill pill-cream" style={{ position: "absolute", top: 10, left: 10, pointerEvents: "none" }}>{c.type}</span>
            </div>
            <div className="col gap8" style={{ padding: "2px 8px 8px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "flex-start" }}>
                <span style={{ fontSize: 17, fontWeight: 500, lineHeight: 1.2, letterSpacing: "-0.01em" }}>{c.title}</span>
                <span className="meta rowx gap4" style={{ whiteSpace: "nowrap" }}><Users size={14} />{c.slots}</span>
              </div>
              <span className="meta">{c.place} · {c.dept}</span>
              <Bar raised={c.raised} released={c.released} goal={c.goal} />
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3,minmax(0,1fr))", gap: 8, fontSize: 11, color: "#5B685C" }}>
                {[["Recaudado", c.raised], ["Liberado", c.released], ["Meta", c.goal]].map(([k, v]) => (
                  <div key={k as string} className="col gap2"><span>{k}</span><span style={{ fontSize: 14, fontWeight: 500, color: "#1C2A20" }}>{usd(v as number)}</span></div>
                ))}
              </div>
            </div>
          </Link>
        ))}
        {visible.length === 0 && <div className="sub" style={{ padding: "24px 0", gridColumn: "1 / -1" }}>No hay causas con ese filtro.</div>}
      </div>
    </Frame>
  );
}
