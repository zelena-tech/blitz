"use client";

import { useEffect } from "react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount, useSwitchChain } from "wagmi";
import { monadTestnet } from "@/lib/wallet/monadTestnet";

/**
 * Un solo botón para Ángeles, Tejedores, organizadores y Veedores.
 * Al conectar, si la wallet está en otra red, pide cambiar a Monad testnet;
 * si la wallet no conoce la red, wagmi la agrega (wallet_addEthereumChain).
 */
export function ConnectWallet() {
  const { isConnected, chainId } = useAccount();
  const { switchChain } = useSwitchChain();

  useEffect(() => {
    if (isConnected && chainId !== monadTestnet.id) {
      switchChain({ chainId: monadTestnet.id });
    }
  }, [isConnected, chainId, switchChain]);

  return (
    <ConnectButton
      label="Conectar mi wallet"
      accountStatus="address"
      chainStatus="none"
      showBalance={false}
    />
  );
}
