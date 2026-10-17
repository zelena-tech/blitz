# Loopi — dApp del POC (Monad Blitz)

Loopi cierra el ciclo de la ayuda: empresas financian causas por hitos, cada peso se libera solo cuando un
verificador independiente aprueba la evidencia, y cada voluntario acumula horas verificadas que nadie puede inflar.

Este repo es el frontend Next.js de las **6 pantallas mobile-first** del POC, recreadas desde el handoff de
Claude Design (`Loopi Pantallas v2`), conectadas a los contratos `LoopiHub` y `MockUSDC` en Monad testnet.

## Pantallas

| # | Pantalla | Ruta | Acción on-chain |
| --- | --- | --- | --- |
| 2a | Explorar causas | `/` | lectura |
| 2b | Detalle de causa ★ demo | `/c/[id]` | `approve` + `donate` |
| 2c | Crear causa (P1) | `/organizar/nueva` | `createCause` |
| 2d | Consola del organizador | `/organizar/[id]` | `submitEvidence` |
| 2e | Bandeja del verificador ★ demo | `/verificar` | `approveMilestone` / `rejectMilestone` |
| 2f | Hoja de vida del voluntario | `/v/[wallet]` | lectura |

Flujo de la demo (< 3 min): **2b** aportar → **2d** subir evidencia → **2e** recalcular huella (check lima) y
aprobar → **2f** suben las horas. `/?reset=1` reinicia la historia.

## Correr

```bash
npm install
cp .env.example .env.local   # opcional: direcciones del contrato y projectId de WalletConnect
npm run dev                  # http://localhost:3000
```

Sin direcciones en `.env.local` la app corre con datos de seed y simula las transacciones (la demo completa
funciona igual). Con `NEXT_PUBLIC_LOOPI_HUB` y `NEXT_PUBLIC_MOCK_USDC` lee recaudado, liberado, estado de hitos,
huellas y totales del voluntario desde el contrato, y cada botón envía la transacción real por la wallet.

## Estructura

```
src/app/            rutas (App Router), una carpeta por pantalla
src/components/     Frame (marco 390×844), Header (logo + pill de rol/wallet), ui (Cta, Bar, Trace, Img…)
src/lib/seed.ts     datos de seed: causas, hitos, traza, voluntarios (lo que en producción vive en Supabase)
src/lib/demo.ts     estado compartido de la demo entre pantallas (localStorage)
src/lib/chain.ts    lecturas del contrato: useCauseChain, useVolunteerChain
src/lib/hash.ts     keccak256 del paquete de evidencia (JSON canónico {causa, hito, archivos, nota})
src/lib/wallet/     wagmi + RainbowKit solo en Monad testnet, hooks de escritura con estimateGas + 15 %
src/app/globals.css tokens del handoff (colores, radios, tipografía Instrument Sans)
```

## Monad

- Chain id 10143, RPC `https://testnet-rpc.monad.xyz`, explorador `https://testnet.monadvision.com`.
- Monad cobra por `gas_limit`, no por gas usado: `useMonadWrite` estima y suma 15 %, nunca un límite fijo alto.
- `approveMilestone` exige voluntarios en orden ascendente sin repetidos y de 1 a 40 h por hito (`certs.ts`).

## Reglas de producto que respeta la UI

- Sin jerga cripto en lo público: "aporte", "liberado", "verificado", "huella". Nunca "token" ni "smart contract".
- Montos en USD con ≈ COP al lado (1 USD = 3.950 COP).
- La traza es el héroe visual: cada evento muestra qué, quién, cuándo y "ver en Monad".
- Datos de damnificados nunca on-chain: el organizador confirma la casilla de privacidad antes de subir evidencia.

## Contratos (contracts/)
LoopiHub v2.1 y MockUSDC en Foundry, configurados para Monad testnet (chain id 10143). Ver contracts/README.md para instalar dependencias, probar (22 pruebas), desplegar con keystore y verificar en MonadVision. Los ABI de src/lib/wallet/abi se regeneran desde contracts/out.
