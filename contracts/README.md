# Loopi v2.1 — contratos (POC hackathon)

Ángeles aportan, Tejedores trabajan, Veedores aprueban.
Regla de oro: ningún peso sale sin aprobación del Veedor.

## Decisiones (menos es más)
- Hitos no bloqueantes: cualquier hito entra a revisión y se aprueba en cualquier orden.
- Hitos sin dinero: payee = 0x0 y monto = 0 certifican horas de colaboración sin pago.
- Hitos con dinero: se aprueban solo si released + monto <= raised de ESA causa (protege la plata de las otras causas).
- Aportes sin tope: más aportes = más alcance; el organizador agrega hitos con addMilestone.
- Sin fecha límite, sin cancelación, sin reembolso: el aporte se une al fondo de la causa.
  Si una causa se abandona, su plata queda congelada: nunca sale sin aprobación del Veedor.
- Veedor != organizador y Veedor != destinatario de cualquier hito. El Veedor solo aprueba o rechaza.
- Tejedores en orden ascendente de wallet y sin repetidos; máximo 50 por hito y entre 1 y 40 horas por Tejedor por hito.
- La pausa frena crear causas, agregar hitos, aportar, subir evidencia y aprobar.
- Un solo token (mUSDC) fijado en el constructor. Solo el admin mintea; cualquier wallet puede pedir 100 mUSDC una vez (faucet).
- Las vistas (causes, getMilestones, volunteers, donations) dan el estado completo desde storage; los eventos solo alimentan la línea de tiempo.
- CEI + nonReentrant en donate y approveMilestone.

## Códigos de oficio (campo skill)
0 general · 1 electricista · 2 plomería · 3 construcción · 4 cocina · 5 carga y logística · 6 salud · 7 psicosocial · 8 conductor

## Cómo usar este paquete
1. Esta carpeta vive en blitz/contracts. Los ABI del frontend (src/lib/wallet/abi) se regeneran con:
   jq .abi out/LoopiHub.sol/LoopiHub.json > ../src/lib/wallet/abi/LoopiHub.json
   jq .abi out/MockUSDC.sol/MockUSDC.json > ../src/lib/wallet/abi/MockUSDC.json
2. Copiar .env.example a .env y llenar las direcciones (nunca llaves privadas).
3. Instalar dependencias, probar, desplegar y verificar con los comandos de abajo.

## Requisitos
Foundry 1.8 o superior (curl -L https://foundry.paradigm.xyz | bash && foundryup). El foundry.toml ya trae network = "monad".
Dependencias:
forge install OpenZeppelin/openzeppelin-contracts@v5.1.0 foundry-rs/forge-std@v1.9.4 --no-git

## Probar
forge test --gas-report   (22 pruebas: 12 de reglas + 10 funcionales, incluido el guion de la demo)

## Llaves: keystore, nunca variables con llaves privadas
cast wallet import loopi-admin --interactive
cast wallet import loopi-organizer --interactive
(fondear ambas en https://faucet.monad.xyz)

## Desplegar en Monad testnet (chain id 10143)
Paso 1, admin: despliega mUSDC y LoopiHub, aprueba al organizador y le da 10.000 mUSDC al Ángel
ORGANIZER=0x... ANGEL=0x... forge script script/Deploy.s.sol --rpc-url monad_testnet --account loopi-admin --broadcast

Paso 2, organizador: crea las dos causas demo
HUB=0x... VERIFIER=0x... FERRETERIA=0x... ELECTRICISTA=0x... PROVEEDOR_ALIMENTOS=0x... \
forge script script/Seed.s.sol --rpc-url monad_testnet --account loopi-organizer --broadcast

## Verificar en MonadVision (el jurado lo revisa)
forge verify-contract <MOCK_USDC> src/MockUSDC.sol:MockUSDC --chain 10143 \
  --verifier sourcify --verifier-url https://sourcify-api-monad.blockvision.org
forge verify-contract <HUB> src/LoopiHub.sol:LoopiHub --chain 10143 \
  --constructor-args $(cast abi-encode "constructor(address)" <MOCK_USDC>) \
  --verifier sourcify --verifier-url https://sourcify-api-monad.blockvision.org

Red: RPC https://testnet-rpc.monad.xyz · faucet https://faucet.monad.xyz · exploradores https://testnet.monadvision.com y https://testnet.monadscan.com

## Gas
Medido con network = "monad" (reglas de gas de Monad). Aprobar un hito con pago y 2 Tejedores nuevos: ~180k. Con 50 Tejedores nuevos: ~3,2M (límite por transacción en Monad: 30M).
Monad cobra por gas_limit, no por gas usado: estimateGas + 15% de margen, nunca un límite fijo alto.

## Notas para el frontend
- approveMilestone recibe certs = [{ volunteer, hoursWorked, skill }] ordenados por wallet de menor a mayor:
  certs.sort((x, y) => (BigInt(x.volunteer) > BigInt(y.volunteer)) - (BigInt(x.volunteer) < BigInt(y.volunteer)))
- hoursWorked entre 1 y 40 por Tejedor por hito; si el trabajo dura más, se divide en hitos.
- Hito sin dinero (solo colaboración): payee = 0x0000000000000000000000000000000000000000 y monto = 0.
- Botón "Pedir 100 mUSDC de prueba": llama faucet() una vez por wallet, para que el jurado aporte desde su propia wallet.
- Al conectar la wallet, la app agrega y cambia a Monad testnet (chain id 10143) con switchChain.
- Tejedores: crean su wallet al registrarse (modelo probado en ZELENA). El perfil off-chain usa la wallet como llave.
- Montos, hitos y horas se leen siempre de las vistas del contrato; la línea de tiempo sale de trace_events.
