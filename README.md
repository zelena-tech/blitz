# Loopi — dApp del POC (Monad Blitz)

**Aporta. Teje. Verifica. Repite.**

Loopi cierra el ciclo de la ayuda humanitaria: los **Ángeles** aportan recursos a causas concretas, los **Tejedores**
ponen las manos, y un **Veedor** independiente aprueba cada hito con evidencia. Ningún peso sale sin esa aprobación,
y cada hora de trabajo queda en una hoja de vida pública que nadie puede inflar.

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
- **Sin fecha límite ni cancelación.** Nadie puede congelar una causa con fondos; más aportes son más alcance,
  con hitos nuevos.

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
