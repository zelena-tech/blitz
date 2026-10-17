"use client";

import { useCallback } from "react";
import type { Abi, Address, TransactionReceipt } from "viem";
import { useAccount, usePublicClient, useWriteContract } from "wagmi";

type Call = { address: Address; abi: Abi; functionName: string; args?: readonly unknown[] };

/**
 * Monad cobra por gas_limit, no por gas usado:
 * estimamos y sumamos 15%, nunca un límite fijo alto.
 */
export function useMonadWrite() {
  const publicClient = usePublicClient();
  const { address: account } = useAccount();
  const { writeContractAsync, isPending } = useWriteContract();

  const send = useCallback(
    async (call: Call): Promise<TransactionReceipt> => {
      if (!publicClient || !account) throw new Error("Conecta tu wallet para continuar.");
      const estimate = await publicClient.estimateContractGas({ ...call, account });
      const hash = await writeContractAsync({ ...call, account, gas: (estimate * 115n) / 100n });
      return publicClient.waitForTransactionReceipt({ hash });
    },
    [publicClient, account, writeContractAsync],
  );

  return { send, isPending };
}
