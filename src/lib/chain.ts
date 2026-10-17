"use client";

import { useReadContract } from "wagmi";
import type { Address } from "viem";
import { loopiHub } from "@/lib/wallet/contracts";
import type { MilestoneStatus } from "@/lib/seed";

/** Hay contrato desplegado si la dirección viene en el .env */
export const isConfigured = () => /^0x[0-9a-fA-F]{40}$/.test(process.env.NEXT_PUBLIC_LOOPI_HUB ?? "");

export const explorerTx = (hash: string) => `https://testnet.monadvision.com/tx/${hash}`;
export const explorerAddr = (a: string) => `https://testnet.monadvision.com/address/${a}`;

const STATUS: MilestoneStatus[] = ["Pendiente", "En revisión", "Liberado"];

/** mUSDC tiene 6 decimales; la UI trabaja en USD enteros */
const toUsd = (v: bigint) => Number(v) / 1e6;

/**
 * Lee causes(id) y getMilestones(id). Devuelve undefined si no hay contrato configurado.
 * causes(id) → [organizer, milestoneCount, verifier, raised, released, metadataHash]
 */
export function useCauseChain(id: number) {
  const enabled = isConfigured();
  const cause = useReadContract({
    ...loopiHub,
    functionName: "causes",
    args: [BigInt(id)],
    query: { enabled, refetchInterval: 4000 },
  });
  const ms = useReadContract({
    ...loopiHub,
    functionName: "getMilestones",
    args: [BigInt(id)],
    query: { enabled, refetchInterval: 4000 },
  });

  if (!enabled) return undefined;
  const t = cause.data as readonly [Address, number, Address, bigint, bigint, `0x${string}`] | undefined;
  const m = ms.data as readonly [readonly { payee: Address; amount: bigint; status: number }[], readonly `0x${string}`[]] | undefined;
  if (!t || t[0] === "0x0000000000000000000000000000000000000000") return { exists: false as const, refetch: () => { cause.refetch(); ms.refetch(); } };
  const list = m?.[0] ?? [];
  return {
    goal: list.reduce((a, x) => a + toUsd(x.amount), 0),
    exists: true as const,
    organizer: t[0],
    verifier: t[2],
    raised: toUsd(t[3]),
    released: toUsd(t[4]),
    metadataHash: t[5],
    milestones: list.map((x, i) => ({
      payee: x.payee,
      amount: toUsd(x.amount),
      status: STATUS[x.status] ?? "Pendiente",
      evidence: m?.[1]?.[i],
    })),
    refetch: () => { cause.refetch(); ms.refetch(); },
  };
}

/** volunteers(addr) → [hoursTotal, causes, milestones] */
export function useVolunteerChain(addr?: string) {
  const enabled = isConfigured() && /^0x[0-9a-fA-F]{40}$/.test(addr ?? "");
  const r = useReadContract({
    ...loopiHub,
    functionName: "volunteers",
    args: [addr as Address],
    query: { enabled, refetchInterval: 4000 },
  });
  if (!enabled) return undefined;
  const t = r.data as readonly [number, number, number] | undefined;
  if (!t) return undefined;
  return { hours: t[0], causes: t[1], milestones: t[2] };
}
