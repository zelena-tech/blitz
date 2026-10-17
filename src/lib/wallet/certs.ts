import type { Address } from "viem";

export type Cert = { volunteer: Address; hoursWorked: number; skill: number };

/** Oficios (campo skill del contrato) */
export const SKILLS = [
  "General", "Electricista", "Plomería", "Construcción", "Cocina",
  "Carga y logística", "Salud", "Psicosocial", "Conductor",
] as const;

/**
 * El contrato exige wallets en orden ascendente estricto, sin repetidos,
 * y de 1 a 40 horas por Tejedor por hito. Validamos antes de enviar.
 */
export function prepareCerts(certs: Cert[]): Cert[] {
  const sorted = [...certs].sort((x, y) => {
    const a = BigInt(x.volunteer), b = BigInt(y.volunteer);
    return a < b ? -1 : a > b ? 1 : 0;
  });
  sorted.forEach((c, i) => {
    if (i > 0 && BigInt(c.volunteer) === BigInt(sorted[i - 1].volunteer)) {
      throw new Error("Un Tejedor aparece dos veces en el mismo hito.");
    }
    if (c.hoursWorked < 1 || c.hoursWorked > 40) {
      throw new Error("Las horas por Tejedor deben estar entre 1 y 40.");
    }
  });
  return sorted;
}
