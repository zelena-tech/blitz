"use client";

import "@rainbow-me/rainbowkit/styles.css";
import { type ReactNode, useState } from "react";
import { RainbowKitProvider } from "@rainbow-me/rainbowkit";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider } from "wagmi";
import { wagmiConfig } from "@/lib/wallet/wagmi";
import { monadTestnet } from "@/lib/wallet/monadTestnet";

/** Envuelve la app en app/layout.tsx: <Providers>{children}</Providers> */
export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider locale="es-419" initialChain={monadTestnet}>
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
