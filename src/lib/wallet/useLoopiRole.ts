"use client";

import { useAccount, useReadContract } from "wagmi";
import { loopiHub } from "@/lib/wallet/contracts";

/**
 * Rol de la wallet conectada. El Veedor depende de la causa:
 * pasa causeId en /c/[id] y en /veedor.
 */
export function useLoopiRole(causeId?: bigint) {
  const { address } = useAccount();
  const me = address?.toLowerCase();

  const { data: owner } = useReadContract({
    ...loopiHub,
    functionName: "owner",
    query: { enabled: Boolean(address) },
  });
  const { data: isOrganizer } = useReadContract({
    ...loopiHub,
    functionName: "approvedOrganizer",
    args: address ? [address] : undefined,
    query: { enabled: Boolean(address) },
  });
  const { data: cause } = useReadContract({
    ...loopiHub,
    functionName: "causes",
    args: causeId !== undefined ? [causeId] : undefined,
    query: { enabled: causeId !== undefined },
  });

  // causes(id) devuelve [organizer, milestoneCount, verifier, raised, released, metadataHash]
  const causeTuple = cause as readonly unknown[] | undefined;
  const verifier = typeof causeTuple?.[2] === "string" ? (causeTuple[2] as string).toLowerCase() : undefined;
  const organizer = typeof causeTuple?.[0] === "string" ? (causeTuple[0] as string).toLowerCase() : undefined;

  return {
    address,
    isAdmin: !!me && typeof owner === "string" && owner.toLowerCase() === me,
    isOrganizer: isOrganizer === true,
    isCauseOrganizer: !!me && organizer === me,
    isVeedor: !!me && verifier === me,
  };
}
