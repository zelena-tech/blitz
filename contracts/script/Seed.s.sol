// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script} from "forge-std/Script.sol";
import {LoopiHub} from "../src/LoopiHub.sol";

/// Paso 2, firma el organizador (keystore):
///   forge script script/Seed.s.sol --rpc-url https://testnet-rpc.monad.xyz --account loopi-organizer --broadcast
/// Variables (solo direcciones): HUB, VERIFIER, FERRETERIA, ELECTRICISTA, PROVEEDOR_ALIMENTOS
/// Opcional: META_HASH_1, META_HASH_2 = keccak256 del JSON canónico de cada causa
contract Seed is Script {
    function run() external {
        LoopiHub hub = LoopiHub(vm.envAddress("HUB"));
        address verifier = vm.envAddress("VERIFIER");

        vm.startBroadcast();
        // Causa 1: Techos para El Cairo — anticipo de materiales, saldo y mano de obra pagada a Pedro (Tejedor)
        address[] memory p1 = new address[](3);
        p1[0] = vm.envAddress("FERRETERIA");
        p1[1] = p1[0];
        p1[2] = vm.envAddress("ELECTRICISTA");
        uint88[] memory a1 = new uint88[](3);
        a1[0] = 400e6;
        a1[1] = 300e6;
        a1[2] = 300e6;
        hub.createCause(verifier, vm.envOr("META_HASH_1", bytes32(0)), p1, a1);

        // Causa 2: Ollas comunitarias en San José del Palmar — jornada sin dinero + mercado para 300 almuerzos
        address[] memory p2 = new address[](2);
        p2[1] = vm.envAddress("PROVEEDOR_ALIMENTOS");
        uint88[] memory a2 = new uint88[](2);
        a2[1] = 300e6;
        hub.createCause(verifier, vm.envOr("META_HASH_2", bytes32(0)), p2, a2);
        vm.stopBroadcast();
    }
}
