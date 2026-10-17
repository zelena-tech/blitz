/**
 * Datos de seed (lo que en producción vive en Supabase y se ancla por hash).
 * Montos, nombres, wallets y hashes son mock del handoff de diseño.
 */
export type HelpType = "Alimentos" | "Vivienda" | "Salud" | "Logística" | "Apoyo psicosocial";
export type MilestoneStatus = "Pendiente" | "En revisión" | "Liberado";

export const TYPES = ["Todos", "Alimentos", "Vivienda", "Salud", "Logística", "Apoyo psicosocial"] as const;
export const DEPTS = ["Todos los departamentos", "Chocó", "Valle del Cauca", "Risaralda", "Quindío", "Caldas"] as const;

export const PILL: Record<MilestoneStatus, [string, string]> = {
  Liberado: ["#B7CB4F", "#1C2A20"],
  "En revisión": ["#23392A", "#E6EDC4"],
  Pendiente: ["#E8DFCF", "#3E4B40"],
};

export type Milestone = {
  n: number;
  title: string;
  payee: string;
  wallet: string;
  amount: number;
  status: MilestoneStatus;
};

export type TraceEvent = {
  icon: "users-three" | "storefront" | "seal-check" | "camera" | "hand-heart";
  what: string;
  who: string;
  when: string;
  tx: string;
};

export type Cause = {
  id: number;
  title: string;
  short: string;
  type: HelpType;
  dept: string;
  place: string;
  goal: number;
  raised: number;
  released: number;
  slots: string;
  description: string;
  organizer: string;
  verifier: string;
  closes: string;
  milestones: Milestone[];
  trace: TraceEvent[];
};

export const EV_HASH = "0x7c1e9a4f02b3d8e6a51f7c0b2e94d3a8f16c05e7b9d24a3f8e01c6b75d2aa913";

const TAPON_MILESTONES: Milestone[] = [
  { n: 1, title: "Tejas y amarres", payee: "Ferretería El Atrato", wallet: "0x5f1…c03", amount: 3200, status: "Liberado" },
  { n: 2, title: "Mano de obra y transporte", payee: "Transportes Río Quito", wallet: "0x8aa…71d", amount: 4800, status: "Pendiente" },
  { n: 3, title: "Instalación final", payee: "Ferretería El Atrato", wallet: "0x5f1…c03", amount: 4000, status: "Pendiente" },
];

const TAPON_TRACE: TraceEvent[] = [
  { icon: "users-three", what: "42 horas certificadas a 4 voluntarios", who: "Cruz Roja Chocó", when: "28 sep", tx: "0x2d9…e40" },
  { icon: "storefront", what: "USD 3.200 pagados a Ferretería El Atrato por el hito 01", who: "Liberación automática", when: "28 sep", tx: "0x2d9…e40" },
  { icon: "seal-check", what: "Hito 01 verificado: la huella de 4 fotos coincide", who: "Cruz Roja Chocó", when: "28 sep", tx: "0x2d9…e40" },
  { icon: "camera", what: "Evidencia del hito 01 subida", who: "Fundación Pacífico Vivo", when: "25 sep", tx: "0xb07…1fa" },
  { icon: "hand-heart", what: "Aporte de USD 5.000", who: "Constructora Andina", when: "14 sep", tx: "0x91e…a3c" },
  { icon: "hand-heart", what: "Aporte de USD 3.400", who: "Cafés del Quindío", when: "12 sep", tx: "0x4c2…77b" },
];

export const CAUSES: Cause[] = [
  {
    id: 1, title: "Techos para la vereda El Tapón", short: "El Tapón", type: "Vivienda", dept: "Chocó", place: "Bagadó",
    goal: 12000, raised: 8400, released: 3200, slots: "6/10",
    description: "38 familias perdieron el techo. Organiza Fundación Pacífico Vivo; verifica Cruz Roja Chocó.",
    organizer: "Fundación Pacífico Vivo", verifier: "Cruz Roja Chocó", closes: "30 nov",
    milestones: TAPON_MILESTONES, trace: TAPON_TRACE,
  },
  {
    id: 2, title: "Ollas comunitarias en Tadó", short: "Ollas en Tadó", type: "Alimentos", dept: "Chocó", place: "Tadó",
    goal: 4000, raised: 3900, released: 2500, slots: "12/12",
    description: "Tres cocinas comunitarias para 140 personas. Organiza Veeduría Tadó; verifica Parroquia San José.",
    organizer: "Veeduría Tadó", verifier: "Parroquia San José", closes: "15 nov",
    milestones: [
      { n: 1, title: "Mercado semana 1", payee: "Surtimax Tadó", wallet: "0x2c4…9e1", amount: 1200, status: "Liberado" },
      { n: 2, title: "Mercado semana 2", payee: "Surtimax Tadó", wallet: "0x2c4…9e1", amount: 1300, status: "Liberado" },
      { n: 3, title: "Gas y utensilios", payee: "Ferretería Central", wallet: "0x7a0…b44", amount: 1500, status: "Pendiente" },
    ],
    trace: [
      { icon: "storefront", what: "USD 1.300 pagados a Surtimax Tadó por el hito 02", who: "Liberación automática", when: "2 sep", tx: "0xf0b…194" },
      { icon: "hand-heart", what: "Aporte de USD 2.000", who: "Banco de Alimentos", when: "20 ago", tx: "0x6ab…c21" },
    ],
  },
  {
    id: 3, title: "Brigada de salud rural", short: "Brigada rural", type: "Salud", dept: "Risaralda", place: "Pueblo Rico",
    goal: 6500, raised: 2100, released: 0, slots: "3/8",
    description: "Jornadas médicas en 4 veredas sin acceso. Organiza Hospital San Rafael; verifica Secretaría de Salud.",
    organizer: "Hospital San Rafael", verifier: "Secretaría de Salud", closes: "10 dic",
    milestones: [
      { n: 1, title: "Medicamentos", payee: "Droguería Pueblo Rico", wallet: "0x91a…0f2", amount: 3500, status: "Pendiente" },
      { n: 2, title: "Transporte del equipo", payee: "Cootransrisaralda", wallet: "0x4e8…77a", amount: 3000, status: "Pendiente" },
    ],
    trace: [{ icon: "hand-heart", what: "Aporte de USD 2.100", who: "Fundación Éxito", when: "30 sep", tx: "0x8d1…3ce" }],
  },
  {
    id: 4, title: "Agua potable en carrotanque", short: "Agua en Calima", type: "Logística", dept: "Valle del Cauca", place: "Calima El Darién",
    goal: 5000, raised: 4100, released: 1800, slots: "2/4",
    description: "Reparto diario de agua a 300 familias. Organiza JAC Calima; verifica Parroquia San José.",
    organizer: "JAC Calima", verifier: "Parroquia San José", closes: "20 nov",
    milestones: [
      { n: 1, title: "Viajes semana 1 y 2", payee: "Transportes Calima", wallet: "0x33b…a19", amount: 1800, status: "Liberado" },
      { n: 2, title: "Viajes semana 3 y 4", payee: "Transportes Calima", wallet: "0x33b…a19", amount: 1800, status: "En revisión" },
      { n: 3, title: "Tanques de reserva", payee: "Ferretería Darién", wallet: "0xa10…5d7", amount: 1400, status: "Pendiente" },
    ],
    trace: [
      { icon: "camera", what: "Evidencia del hito 02 subida", who: "JAC Calima", when: "1 oct", tx: "0x6e3…812" },
      { icon: "users-three", what: "18 horas certificadas a 2 voluntarios", who: "Parroquia San José", when: "19 sep", tx: "0x6e3…812" },
    ],
  },
  {
    id: 5, title: "Escucha para familias desplazadas", short: "Escucha Armenia", type: "Apoyo psicosocial", dept: "Quindío", place: "Armenia",
    goal: 3000, raised: 900, released: 0, slots: "5/15",
    description: "Grupos de apoyo con psicólogos voluntarios. Organiza Corporación Vínculos; verifica Universidad del Quindío.",
    organizer: "Corporación Vínculos", verifier: "Universidad del Quindío", closes: "5 dic",
    milestones: [
      { n: 1, title: "Materiales y refrigerios", payee: "Papelería Centro", wallet: "0xb21…e03", amount: 1000, status: "Pendiente" },
      { n: 2, title: "Transporte de familias", payee: "Taxis Armenia", wallet: "0x0c5…7f8", amount: 2000, status: "Pendiente" },
    ],
    trace: [{ icon: "hand-heart", what: "Aporte de USD 900", who: "Cafés del Quindío", when: "5 oct", tx: "0x2a7…91d" }],
  },
];

export const causeById = (id: number) => CAUSES.find((c) => c.id === id);

/** Hito activo de la demo: El Tapón, hito 02 */
export const DEMO = { causeId: 1, milestoneIdx: 1 };

export const EVIDENCE_FILES = [
  { id: 1, name: "techo_04.jpg" },
  { id: 2, name: "viaje_02.jpg" },
  { id: 3, name: "recibo.jpg" },
];
export const EVIDENCE_NOTE = "Se instalaron 22 de 38 techos. Transporte de materiales en 3 viajes por el río Andágueda.";

export type Volunteer = { name: string; wallet: string; fullWallet: `0x${string}`; h: number; city: string };
export const VOLUNTEERS: Volunteer[] = [
  { name: "Laura Mosquera", wallet: "0x4b2…e91", fullWallet: "0x4b2d6f1a9c3e8b7d2f0a5c4e6b8d1f3a7c9e0e91", h: 12, city: "Quibdó" },
  { name: "Andrés Palacios", wallet: "0x9d0…3c5", fullWallet: "0x9d0e2a7b4c6f8e1d3a5b7c9e0f2a4b6c8d0e13c5", h: 8, city: "Istmina" },
  { name: "Yeison Rentería", wallet: "0x17f…a28", fullWallet: "0x17f3b5d7a9c1e3f5b7d9a1c3e5f7b9d1a3c5ea28", h: 6, city: "Bagadó" },
];

export type CvItem = { what: string; h: number; cause: string; by: string; date: string; tx: string };
export const CV_BASE: CvItem[] = [
  { what: "Tejas y amarres", h: 14, cause: "El Tapón", by: "Cruz Roja Chocó", date: "28 sep", tx: "0x2d9c…5e40" },
  { what: "Cargue y reparto de agua", h: 18, cause: "Agua en Calima", by: "Parroquia San José", date: "19 sep", tx: "0x6e3a…b812" },
  { what: "Cocina comunitaria, semana 2", h: 8, cause: "Ollas en Tadó", by: "Veeduría Tadó", date: "2 sep", tx: "0xf0b7…c194" },
  { what: "Cocina comunitaria, semana 1", h: 6, cause: "Ollas en Tadó", by: "Veeduría Tadó", date: "26 ago", tx: "0x13d8…2a6f" },
];
export const CV_BY_TYPE: { type: HelpType; h: number }[] = [
  { type: "Vivienda", h: 14 },
  { type: "Logística", h: 18 },
  { type: "Alimentos", h: 14 },
];
