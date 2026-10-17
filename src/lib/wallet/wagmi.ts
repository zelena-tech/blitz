import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { http } from "wagmi";
import { monadTestnet } from "@/lib/wallet/monadTestnet";

export const wagmiConfig = getDefaultConfig({
  appName: "Loopi",
  // projectId gratuito de WalletConnect (Reown Cloud): permite conectar wallets desde el celular.
  // Sin projectId, las wallets de navegador (MetaMask, Rabby) siguen funcionando; solo falla WalletConnect.
  projectId: process.env.NEXT_PUBLIC_WC_PROJECT_ID || "loopi-sin-walletconnect",
  chains: [monadTestnet],
  transports: { [monadTestnet.id]: http("https://testnet-rpc.monad.xyz") },
  ssr: true,
});
