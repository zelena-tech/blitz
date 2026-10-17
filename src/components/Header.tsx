"use client";

import Image from "next/image";
import Link from "next/link";
import { Wallet } from "@phosphor-icons/react";
import { useAccount } from "wagmi";
import { useConnectModal, useAccountModal } from "@rainbow-me/rainbowkit";
import { useLoopiRole } from "@/lib/wallet/useLoopiRole";
import { shortAddr } from "@/lib/format";

/** Logo a la izquierda, pill de rol/wallet o botón Conectar a la derecha */
export function Header({ causeId, light = false, left }: { causeId?: bigint; light?: boolean; left?: React.ReactNode }) {
  return (
    <div className="header">
      {left ?? (
        <Link href="/" aria-label="Inicio">
          <Image src={light ? "/assets/logo-13.png" : "/assets/logo-11.png"} alt="Loopi" width={96} height={24} className="logo" priority />
        </Link>
      )}
      <WalletPill causeId={causeId} />
    </div>
  );
}

export function WalletPill({ causeId, variant = "role" }: { causeId?: bigint; variant?: "role" | "wallet" }) {
  const { address, isConnected } = useAccount();
  const { openConnectModal } = useConnectModal();
  const { openAccountModal } = useAccountModal();
  const role = useLoopiRole(causeId);

  if (!isConnected || !address) {
    return (
      <button className="btn-connect" onClick={openConnectModal}>
        <Wallet size={16} />Conectar
      </button>
    );
  }
  const label = role.isAdmin ? "Admin" : role.isCauseOrganizer || role.isOrganizer ? "Organizador" : role.isVeedor ? "Verificador" : "Empresa";
  return (
    <button
      onClick={openAccountModal}
      className={variant === "wallet" ? "pill pill-wallet" : "pill pill-role"}
      style={{ border: 0 }}
      title={address}
    >
      {variant === "wallet" && <span className="dot" />}
      {label} · {shortAddr(address)}
    </button>
  );
}
