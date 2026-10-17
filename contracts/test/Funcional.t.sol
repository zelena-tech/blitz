// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";
import {LoopiHub} from "../src/LoopiHub.sol";
import {MockUSDC} from "../src/MockUSDC.sol";

/// Pruebas funcionales adicionales: guion de la demo y bordes no cubiertos por la suite original.
contract FuncionalTest is Test {
    LoopiHub hub; MockUSDC usdc;
    address org = makeAddr("org"); address veedor = makeAddr("veedor");
    address ferreteria = makeAddr("ferreteria"); address pedro = makeAddr("pedro"); address angel = makeAddr("angel");

    function setUp() public {
        usdc = new MockUSDC(); hub = new LoopiHub(usdc); hub.setOrganizer(org, true);
        usdc.mint(angel, 10_000e6); vm.prank(angel); usdc.approve(address(hub), type(uint256).max);
    }
    function _techos() internal returns (uint256 id) {
        address[] memory p = new address[](3); p[0] = ferreteria; p[1] = ferreteria; p[2] = pedro;
        uint88[] memory a = new uint88[](3); a[0] = 400e6; a[1] = 300e6; a[2] = 300e6;
        vm.prank(org); id = hub.createCause(veedor, keccak256("techos"), p, a);
    }

    /// Guion de 3 minutos del spec: aporte 1000 -> evidencia hito 2 -> aprobar con Pedro 8h electricista -> Pedro cobra 300 -> hoja de vida
    function test_guionDemo() public {
        uint256 id = _techos();
        vm.prank(angel); hub.donate(id, 1_000e6);
        (,,, uint128 raised,,) = hub.causes(id); assertEq(raised, 1_000e6);
        assertEq(hub.donations(id, angel), 1_000e6);
        vm.prank(org); hub.submitEvidence(id, 2, keccak256("fotos-electricas"));
        (LoopiHub.Milestone[] memory ms, bytes32[] memory ev) = hub.getMilestones(id);
        assertEq(uint8(ms[2].status), uint8(LoopiHub.MilestoneStatus.InReview));
        assertEq(ev[2], keccak256("fotos-electricas"));
        LoopiHub.Cert[] memory c = new LoopiHub.Cert[](1); c[0] = LoopiHub.Cert(pedro, 8, 1);
        vm.prank(veedor); hub.approveMilestone(id, 2, c);
        assertEq(usdc.balanceOf(pedro), 300e6);
        (,,,, uint128 released,) = hub.causes(id); assertEq(released, 300e6);
        (uint32 h, uint16 causas, uint16 hitos) = hub.volunteers(pedro);
        assertEq(h, 8); assertEq(causas, 1); assertEq(hitos, 1);
        assertEq(usdc.balanceOf(address(hub)), 700e6); // lo no liberado sigue en custodia
    }

    function test_mismoTejedorEnDosHitosCuentaUnaCausa() public {
        uint256 id = _techos();
        vm.prank(angel); hub.donate(id, 1_000e6);
        vm.startPrank(org); hub.submitEvidence(id, 0, "a"); hub.submitEvidence(id, 1, "b"); vm.stopPrank();
        LoopiHub.Cert[] memory c = new LoopiHub.Cert[](1); c[0] = LoopiHub.Cert(pedro, 10, 3);
        vm.startPrank(veedor); hub.approveMilestone(id, 0, c); hub.approveMilestone(id, 1, c); vm.stopPrank();
        (uint32 h, uint16 causas, uint16 hitos) = hub.volunteers(pedro);
        assertEq(h, 20); assertEq(causas, 1); assertEq(hitos, 2);
    }

    function test_noSeApruebaDosVeces() public {
        uint256 id = _techos();
        vm.prank(angel); hub.donate(id, 1_000e6);
        vm.prank(org); hub.submitEvidence(id, 0, "a");
        vm.prank(veedor); hub.approveMilestone(id, 0, new LoopiHub.Cert[](0));
        vm.prank(org); vm.expectRevert(LoopiHub.WrongMilestoneState.selector); hub.submitEvidence(id, 0, "b");
        vm.prank(veedor); vm.expectRevert(LoopiHub.WrongMilestoneState.selector); hub.approveMilestone(id, 0, new LoopiHub.Cert[](0));
        assertEq(usdc.balanceOf(ferreteria), 400e6);
    }

    function test_addMilestoneRechazaAlVeedorComoDestinatario() public {
        uint256 id = _techos();
        vm.prank(org); vm.expectRevert(LoopiHub.InvalidMilestone.selector); hub.addMilestone(id, veedor, 1e6);
        vm.prank(angel); vm.expectRevert(LoopiHub.NotOrganizer.selector); hub.addMilestone(id, ferreteria, 1e6);
    }

    function test_hitoInexistenteYCausaInexistente() public {
        uint256 id = _techos();
        vm.prank(org); vm.expectRevert(LoopiHub.InvalidMilestone.selector); hub.submitEvidence(id, 3, "x");
        vm.prank(angel); vm.expectRevert(LoopiHub.CauseNotFound.selector); hub.donate(99, 1e6);
        vm.prank(org); vm.expectRevert(LoopiHub.NotOrganizer.selector); hub.submitEvidence(99, 0, "x");
    }

    function test_soloVeedorRechaza() public {
        uint256 id = _techos();
        vm.prank(org); hub.submitEvidence(id, 0, "a");
        vm.prank(org); vm.expectRevert(LoopiHub.NotVerifier.selector); hub.rejectMilestone(id, 0, "m");
        vm.prank(veedor); vm.expectRevert(LoopiHub.NotVerifier.selector); hub.approveMilestone(99, 0, new LoopiHub.Cert[](0));
    }

    function test_pausaFrenaTodoMenosRechazar() public {
        uint256 id = _techos();
        vm.prank(org); hub.submitEvidence(id, 0, "a");
        hub.pause();
        vm.prank(org); vm.expectRevert(Pausable.EnforcedPause.selector); hub.addMilestone(id, ferreteria, 1e6);
        vm.prank(org); vm.expectRevert(Pausable.EnforcedPause.selector); hub.submitEvidence(id, 1, "b");
        vm.prank(veedor); vm.expectRevert(Pausable.EnforcedPause.selector); hub.approveMilestone(id, 0, new LoopiHub.Cert[](0));
        vm.prank(org); vm.expectRevert(Pausable.EnforcedPause.selector); hub.createCause(veedor, 0, new address[](0), new uint88[](0));
        vm.prank(veedor); hub.rejectMilestone(id, 0, "m"); // rechazar sigue disponible
        hub.unpause();
        vm.prank(angel); hub.donate(id, 1e6);
    }

    function test_certDireccionCeroRechazada() public {
        uint256 id = _techos();
        vm.prank(angel); hub.donate(id, 1_000e6);
        vm.prank(org); hub.submitEvidence(id, 0, "a");
        LoopiHub.Cert[] memory c = new LoopiHub.Cert[](1); c[0] = LoopiHub.Cert(address(0), 8, 0);
        vm.prank(veedor); vm.expectRevert(LoopiHub.UnsortedVolunteers.selector); hub.approveMilestone(id, 0, c);
    }

    function test_topeDeHitos() public {
        address[] memory p = new address[](21); uint88[] memory a = new uint88[](21);
        vm.prank(org); vm.expectRevert(LoopiHub.TooManyMilestones.selector); hub.createCause(veedor, 0, p, a);
        uint256 id = _techos();
        for (uint256 i = 3; i < 20; ++i) { vm.prank(org); hub.addMilestone(id, address(0), 0); }
        vm.prank(org); vm.expectRevert(LoopiHub.TooManyMilestones.selector); hub.addMilestone(id, address(0), 0);
    }

    function test_masDe50Tejedores() public {
        uint256 id = _techos();
        vm.prank(org); hub.submitEvidence(id, 0, "a");
        vm.prank(angel); hub.donate(id, 1_000e6);
        LoopiHub.Cert[] memory c = new LoopiHub.Cert[](51);
        for (uint256 i; i < 51; ++i) c[i] = LoopiHub.Cert(address(uint160(0x10000 + i)), 1, 0);
        vm.prank(veedor); vm.expectRevert(LoopiHub.TooManyVolunteers.selector); hub.approveMilestone(id, 0, c);
    }
}
