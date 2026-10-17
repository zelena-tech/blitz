import type { Abi, Address } from "viem";
// Solo el arreglo "abi" de los artefactos de Foundry:
//   jq .abi out/LoopiHub.sol/LoopiHub.json > abi/LoopiHub.json
//   jq .abi out/MockUSDC.sol/MockUSDC.json > abi/MockUSDC.json
import loopiHubAbi from "@/lib/wallet/abi/LoopiHub.json";
import mockUsdcAbi from "@/lib/wallet/abi/MockUSDC.json";

export const loopiHub = {
  address: process.env.NEXT_PUBLIC_LOOPI_HUB as Address,
  abi: loopiHubAbi as Abi,
} as const;

export const mockUsdc = {
  address: process.env.NEXT_PUBLIC_MOCK_USDC as Address,
  abi: mockUsdcAbi as Abi,
} as const;
