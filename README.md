# Loopi — dApp del POC (Monad Blitz)

**Aporta. Teje. Verifica. Repite.**

Loopi cierra el ciclo de la ayuda humanitaria: los **Ángeles** aportan recursos a causas concretas, los **Tejedores**
ponen las manos, y un **Veedor** independiente aprueba cada hito con evidencia. Ningún peso sale sin esa aprobación,
y cada hora de trabajo queda en una hoja de vida pública que nadie puede inflar.

## En vivo

- **App:** https://loopi-blitz.azurewebsites.net
- **Red:** Monad testnet (chain id 10143)

| Contrato | Dirección | Explorador |
| --- | --- | --- |
| `LoopiHub` v2.1 | `0x1e5A4C662704c3d8e9F292bDc670c6371305D02a` | [MonadVision](https://testnet.monadvision.com/address/0x1e5A4C662704c3d8e9F292bDc670c6371305D02a) · [Monadscan](https://testnet.monadscan.com/address/0x1e5A4C662704c3d8e9F292bDc670c6371305D02a) |
| `MockUSDC` (mUSDC) | `0x794b4644176A18f7366c067004a97BB63105D701` | [MonadVision](https://testnet.monadvision.com/address/0x794b4644176A18f7366c067004a97BB63105D701) · [Monadscan](https://testnet.monadscan.com/address/0x794b4644176A18f7366c067004a97BB63105D701) |

Código fuente verificado en MonadVision (Sourcify, coincidencia exacta). Desplegado en el bloque 71957625 con
4 transacciones ([log de Foundry](contracts/broadcast/Deploy.s.sol/10143/run-latest.json)):

1. [Crear MockUSDC](https://testnet.monadvision.com/tx/0xd9f1d24886d0ee589e0e17f8a7df4c5cf94602888bcfda812e9b1e82d71c218e)
2. [Crear LoopiHub](https://testnet.monadvision.com/tx/0x40476e9284f2d8b3aa560fecf7d79a9d1691b409d20c5ce8637983f52d8cfc54)
3. [Aprobar al organizador](https://testnet.monadvision.com/tx/0x592a6e5ea0fa764a02f2841c861872a477f615a0c41c52e6428401236f48a24c)
4. [Entregar 10.000 mUSDC al Ángel de la demo](https://testnet.monadvision.com/tx/0x61e31cb36e010d09a5259f81fcf53f29d1d1bd453fee4aaf7ee25d041743f927)

Admin del contrato (owner) y organizador aprobado: `0x0000aEb4E3b0ACEbc85a48e825c86538d9597Cb7`.

## El problema

El terremoto del 10 de agosto de 2026 (magnitud 7,4) golpeó Chocó, Valle del Cauca, Risaralda, Quindío y Caldas.
Más de 350 empresas donaron más de 700.000 millones de pesos. La plata fluye, pero la trazabilidad no:

- **Las empresas** donan a cuentas y centros de acopio sin ver en qué terminó cada peso. Algunas no donan por ese miedo.
- **Quienes ayudan** (electricistas, plomeros, gente de construcción y manos sin oficio) no tienen dónde encontrarse
  con quien los necesita, y su trabajo no queda registrado en ningún lado.
- **Las causas pequeñas** (veredas y municipios) no tienen vitrina frente a las grandes campañas.

## Cómo funciona

| Rol | Quién es | Qué hace en Loopi |
| --- | --- | --- |
| Ángel | Empresa (área de RSE) o persona | Explora causas, aporta mUSDC sin tope y sigue la traza de cada peso |
| Organizador | Fundación, JAC o colectivo aprobado por Loopi | Crea la causa con hitos, sube la evidencia y propone Tejedores con horas y oficio |
| Veedor | Tercero independiente por causa: Cruz Roja, parroquia, veeduría | Aprueba o rechaza cada hito. Nunca es el organizador ni cobra ningún hito |
| Proveedor | Ferretería, transportador, proveedor de alimentos | Recibe el pago de un hito, directo a su wallet |
| Tejedor | Cualquier persona, con o sin oficio | Trabaja, acumula horas certificadas y puede cobrar por su trabajo |

Una causa de punta a punta:

1. **Aportar.** El Ángel aporta a una causa; el dinero queda en custodia del contrato, no en la cuenta de nadie.
2. **Trabajar.** El organizador ejecuta un hito (materiales, transporte, mano de obra o una jornada sin dinero).
3. **Evidenciar.** Sube fotos y una nota; la huella `keccak256` del paquete queda anclada on-chain.
4. **Verificar.** El Veedor recalcula la huella, comprueba que coincide y aprueba. En una sola transacción se paga al
   proveedor o al Tejedor y se certifican las horas y el oficio de cada Tejedor.
5. **Hoja de vida.** Cualquiera puede ver en `/v/[wallet]` las horas, causas y oficios certificados de un Tejedor,
   con enlace a cada transacción en el explorador de Monad.

Un hito sin dinero (por ejemplo, una jornada de limpieza) sigue el mismo camino y solo certifica horas.

## Qué garantiza el contrato

- **Ningún peso sale sin la aprobación del Veedor.** Las reglas de pago son código, no promesas.
- **Un hito con dinero solo se aprueba si la causa tiene fondos.** La plata de una causa nunca paga hitos de otra.
- **La evidencia no se puede cambiar después de aprobada.** Solo su huella va on-chain; si alguien edita la foto, la
  huella deja de coincidir.
- **Las horas no se inflan.** Cada Tejedor aparece una sola vez por hito, con 1 a 40 horas, y las firma el Veedor.
- **Sin colusión obvia.** El Veedor no puede ser el organizador ni el destinatario de ningún hito.
- **Sin fecha límite ni cancelación por causa.** Más aportes son más alcance, con hitos nuevos. El admin solo puede
  pausar todo el contrato en una emergencia: frena aportes y aprobaciones, pero no mueve fondos.

## Qué va on-chain y qué no

Regla: va on-chain solo lo que una empresa necesitaría no tener que creerle a nadie.

| On-chain (Monad) | Off-chain (anclado por huella) |
| --- | --- |
| Fondos aportados y liberados por causa | Textos, fotos y descripción de la causa |
| Hitos: monto, destinatario, estado | Perfil del Tejedor: oficios, municipio, disponibilidad |
| Aporte de cada Ángel | Oportunidades y postulaciones |
| Huella de la evidencia y del motivo de rechazo | Datos de contacto, solo con consentimiento |
| Totales del Tejedor: horas, causas, hitos | Datos de damnificados: **nunca** on-chain (Ley 1581 de 2012) |

## Por qué Monad

- **Comisiones mínimas:** certificar cada hito y cada Tejedor es viable, incluso con decenas de personas por hito.
- **Compatible con EVM:** contratos en Solidity con OpenZeppelin, construidos y desplegados en horas.
- **Traza pública e imborrable:** cada evento de la causa enlaza a una transacción en MonadVision.

## Estado del POC y límites conocidos

- Corre en **Monad testnet** con un token de prueba (mUSDC). La salida a pesos queda para producción.
- Si el Veedor y el organizador se coluden, el contrato no lo detecta. Siguiente paso: verificación 2 de 3.
- Si una causa se abandona, sus fondos quedan congelados: nunca mal usados, pero tampoco devueltos.
- El admin puede pausar el contrato completo (`pause`): frena aportes, evidencias y aprobaciones de todas las causas.
- Un hito paga a un solo destinatario; repartir entre varios Tejedores según horas es trabajo futuro.

## Contexto

Loopi es la propuesta del equipo de [Zelena](https://www.zelena.tech/) para Monad Blitz. Zelena ya probó en campo
que personas sin experiencia cripto crean su wallet en una jornada y cobran en sus cuentas; Loopi reutiliza ese
acompañamiento para los Tejedores.

Este repo contiene el frontend Next.js (6 pantallas mobile-first, recreadas desde el handoff de Claude Design
`Loopi Pantallas v2`) y los contratos `LoopiHub` y `MockUSDC` en `contracts/`.

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

## Responsive

Mobile-first con tres cortes: móvil (pantalla completa), tablet desde 768 px (dos columnas, navegación en el
encabezado, hoja de aportar como modal) y escritorio desde 1100 px (lienzo de 1180 px, columna lateral de 440 px
pegajosa, rejilla de tres tarjetas). El orden de los bloques en móvil se conserva con `.o1`…`.o5` dentro de `.split`.

## Correr

```bash
npm install
cp .env.example .env.local   # opcional: direcciones del contrato y projectId de WalletConnect
npm run dev                  # http://localhost:3000
```

Sin direcciones en `.env.local` la app corre con datos de seed y simula las transacciones (la demo completa
funciona igual). Con `NEXT_PUBLIC_LOOPI_HUB` y `NEXT_PUBLIC_MOCK_USDC` lee recaudado, liberado, estado de hitos,
huellas y totales del voluntario desde el contrato, y cada botón envía la transacción real por la wallet.
Para usar los contratos desplegados, en `.env.local`:

```bash
NEXT_PUBLIC_LOOPI_HUB=0x1e5A4C662704c3d8e9F292bDc670c6371305D02a
NEXT_PUBLIC_MOCK_USDC=0x794b4644176A18f7366c067004a97BB63105D701
```

Las variables `NEXT_PUBLIC_*` quedan fijas en el build: si cambian, hay que volver a compilar y desplegar.

## Estructura

```
src/app/            rutas (App Router), una carpeta por pantalla
src/components/     Frame (marco fluido: pantalla completa en móvil, hasta 1180 px en escritorio), Header (logo + Nav + pill de rol/wallet), ui (Cta, Bar, Trace, Img…)
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
