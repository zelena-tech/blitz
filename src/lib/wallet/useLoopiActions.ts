"use client";

import { parseUnits } from "viem";
import { loopiHub, mockUsdc } from "@/lib/wallet/contracts";
import { useMonadWrite } from "@/lib/wallet/useMonadWrite";
import { prepareCerts, type Cert } from "@/lib/wallet/certs";

/** Ejemplos de las acciones de la demo. mUSDC tiene 6 decimales. */
export function useLoopiActions() {
  const { send, isPending } = useMonadWrite();

  return {
    isPending,
    // Ángel: aprobar + aportar (dos transacciones)
    aportar: async (causeId: bigint, montoUsd: string) => {
      const amount = parseUnits(montoUsd, 6);
      await send({ ...mockUsdc, functionName: "approve", args: [loopiHub.address, amount] });
      return send({ ...loopiHub, functionName: "donate", args: [causeId, amount] });
    },
    // Jurado o Ángel del público: 100 mUSDC de prueba, una vez por wallet
    pedirPrueba: () => send({ ...mockUsdc, functionName: "faucet" }),
    // Organizador: evidencia de cualquier hito
    subirEvidencia: (causeId: bigint, idx: number, bundleHash: `0x${string}`) =>
      send({ ...loopiHub, functionName: "submitEvidence", args: [causeId, idx, bundleHash] }),
    // Veedor: rechazar con la huella del motivo; el hito vuelve a Pendiente
    rechazar: (causeId: bigint, idx: number, reasonHash: `0x${string}`) =>
      send({ ...loopiHub, functionName: "rejectMilestone", args: [causeId, idx, reasonHash] }),
    // Veedor: aprobar paga (si hay monto) y certifica a los Tejedores
    aprobar: (causeId: bigint, idx: number, certs: Cert[]) =>
      send({ ...loopiHub, functionName: "approveMilestone", args: [causeId, idx, prepareCerts(certs)] }),
  };
}
