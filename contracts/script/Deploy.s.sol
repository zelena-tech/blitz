// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console} from "forge-std/Script.sol";
import {LoopiHub} from "../src/LoopiHub.sol";
import {MockUSDC} from "../src/MockUSDC.sol";

/// Paso 1, firma el admin (keystore):
///   forge script script/Deploy.s.sol --rpc-url https://testnet-rpc.monad.xyz --account loopi-admin --broadcast
/// Variables (solo direcciones, nunca llaves): ORGANIZER, ANGEL
contract Deploy is Script {
    function run() external {
        address organizer = vm.envAddress("ORGANIZER");
        address angel = vm.envAddress("ANGEL");

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
