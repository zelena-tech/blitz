// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console} from "forge-std/Script.sol";
import {LoopiHub} from "../src/LoopiHub.sol";
import {MockUSDC} from "../src/MockUSDC.sol";

/// Paso 1, firma el admin (keystore):
///   forge script script/Deploy.s.sol --rpc-url https://testnet-rpc.monad.xyz --account loopi-admin --sender <ADMIN> --broadcast
/// Variables opcionales (solo direcciones, nunca llaves): ORGANIZER, ANGEL. Si faltan, se usa --sender (el admin).
contract Deploy is Script {
    function run() external {
        // Con keystore, Foundry no conoce la dirección hasta firmar: sin --sender, msg.sender es el DEFAULT_SENDER
        address organizer = vm.envOr("ORGANIZER", msg.sender);
        address angel = vm.envOr("ANGEL", msg.sender);
        require(organizer != DEFAULT_SENDER && angel != DEFAULT_SENDER, "Define ORGANIZER/ANGEL o pasa --sender");

        vm.startBroadcast();
        MockUSDC usdc = new MockUSDC();
        LoopiHub hub = new LoopiHub(usdc);
        hub.setOrganizer(organizer, true);
        usdc.mint(angel, 10_000e6);
        vm.stopBroadcast();

        console.log("MockUSDC:", address(usdc));
        console.log("LoopiHub:", address(hub));
    }
}
