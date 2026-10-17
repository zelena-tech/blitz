// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";
import {LoopiHub} from "../src/LoopiHub.sol";
import {MockUSDC} from "../src/MockUSDC.sol";

contract LoopiHubTest is Test {
    LoopiHub hub;
    MockUSDC usdc;
    address org = makeAddr("organizador");
    address veedor = makeAddr("veedor");
    address ferreteria = makeAddr("ferreteria");
    address electricista = makeAddr("electricista");
    address angel = makeAddr("angel");
    address t1;
    address t2;

    event VolunteerCertified(
        address indexed volunteer, uint256 indexed id, uint8 milestone, uint32 hoursCertified, uint8 skill
    );

    function setUp() public {
        usdc = new MockUSDC();
        hub = new LoopiHub(usdc);
        hub.setOrganizer(org, true);
        usdc.mint(angel, 10_000e6);
        vm.prank(angel);
        usdc.approve(address(hub), type(uint256).max);
        // Tejedores en orden ascendente, como los envía el frontend
        (address a, address b) = (makeAddr("tejedorA"), makeAddr("tejedorB"));
        (t1, t2) = a < b ? (a, b) : (b, a);
    }

    function _crearTechos() internal returns (uint256 id) {
        address[] memory p = new address[](3);
        p[0] = ferreteria;
        p[1] = ferreteria;
        p[2] = electricista;
        uint88[] memory a = new uint88[](3);
        a[0] = 400e6;
        a[1] = 300e6;
        a[2] = 300e6;
        vm.prank(org);
        id = hub.createCause(veedor, keccak256("techos-v1"), p, a);
    }

    function _tejedores() internal view returns (LoopiHub.Cert[] memory c) {
        c = new LoopiHub.Cert[](2);
        c[0] = LoopiHub.Cert(t1, 8, 1); // electricista
        c[1] = LoopiHub.Cert(t2, 5, 3); // construcción
    }

    function _nadie() internal pure returns (LoopiHub.Cert[] memory) {
        return new LoopiHub.Cert[](0);
    }

    function test_hitosNoBloqueantes() public {
        uint256 id = _crearTechos();
        vm.prank(angel);
        hub.donate(id, 1_000e6);
        // El hito 2 entra a revisión y se aprueba antes que el 0
        vm.startPrank(org);
        hub.submitEvidence(id, 2, keccak256("instalacion"));
        hub.submitEvidence(id, 0, keccak256("cotizacion"));
        vm.stopPrank();
        vm.startPrank(veedor);
        hub.approveMilestone(id, 2, _tejedores());
        hub.approveMilestone(id, 0, _nadie());
        vm.stopPrank();
        assertEq(usdc.balanceOf(electricista), 300e6);
        assertEq(usdc.balanceOf(ferreteria), 400e6);
        (uint32 horas, uint16 causas, uint16 hitos) = hub.volunteers(t1);
        assertEq(horas, 8);
        assertEq(causas, 1);
        assertEq(hitos, 1);
    }

    function test_hitoSinDineroCertificaHoras() public {
        address[] memory p = new address[](1);
        uint88[] memory a = new uint88[](1); // payee 0 y monto 0: jornada de limpieza
        vm.prank(org);
        uint256 id = hub.createCause(veedor, keccak256("limpieza"), p, a);
        vm.prank(org);
        hub.submitEvidence(id, 0, keccak256("fotos-jornada"));
        LoopiHub.Cert[] memory certs = _tejedores();
        vm.expectEmit(true, true, false, true);
        emit VolunteerCertified(t1, id, 0, 8, 1);
        vm.prank(veedor);
        hub.approveMilestone(id, 0, certs);
        (uint32 horas,,) = hub.volunteers(t2);
        assertEq(horas, 5);
    }

    function test_noSePagaConPlataDeOtraCausa() public {
        uint256 a = _crearTechos();
        uint256 b = _crearTechos();
        vm.prank(angel);
        hub.donate(a, 1_000e6); // solo la causa A tiene fondos
        vm.prank(org);
        hub.submitEvidence(b, 0, keccak256("e"));
        vm.prank(veedor);
        vm.expectRevert(LoopiHub.InsufficientFunds.selector);
        hub.approveMilestone(b, 0, _nadie());
    }

    function test_aporteSinTopeAmpliaAlcance() public {
        uint256 id = _crearTechos();
        vm.prank(angel);
        hub.donate(id, 1_500e6); // 500 más de lo planeado
        vm.prank(org);
        hub.addMilestone(id, ferreteria, 500e6); // más techos
        vm.prank(org);
        hub.submitEvidence(id, 3, keccak256("techos-extra"));
        vm.prank(veedor);
        hub.approveMilestone(id, 3, _nadie());
        assertEq(usdc.balanceOf(ferreteria), 500e6);
    }

    function test_reglasDelVeedor() public {
        address[] memory p = new address[](1);
        uint88[] memory a = new uint88[](1);
        p[0] = ferreteria;
        a[0] = 1e6;
        vm.prank(org);
        vm.expectRevert(LoopiHub.InvalidVerifier.selector); // Veedor = organizador
        hub.createCause(org, bytes32(0), p, a);
        p[0] = veedor;
        vm.prank(org);
        vm.expectRevert(LoopiHub.InvalidMilestone.selector); // Veedor = proveedor
        hub.createCause(veedor, bytes32(0), p, a);
        p[0] = address(0);
        vm.prank(org);
        vm.expectRevert(LoopiHub.InvalidMilestone.selector); // monto sin proveedor
        hub.createCause(veedor, bytes32(0), p, a);
    }

    function test_tejedoresRepetidosODesordenados() public {
        uint256 id = _crearTechos();
        vm.prank(angel);
        hub.donate(id, 1_000e6);
        vm.prank(org);
        hub.submitEvidence(id, 0, keccak256("e"));
        LoopiHub.Cert[] memory dup = new LoopiHub.Cert[](2);
        dup[0] = LoopiHub.Cert(t1, 4, 0);
        dup[1] = LoopiHub.Cert(t1, 4, 0);
        vm.prank(veedor);
        vm.expectRevert(LoopiHub.UnsortedVolunteers.selector);
        hub.approveMilestone(id, 0, dup);
    }

    function test_rechazoYReenvio() public {
        uint256 id = _crearTechos();
        vm.prank(org);
        hub.submitEvidence(id, 1, keccak256("borrosa"));
        vm.prank(veedor);
        hub.rejectMilestone(id, 1, keccak256("no se ve el techo"));
        vm.prank(org);
        hub.submitEvidence(id, 1, keccak256("nitida"));
        assertEq(hub.evidenceHash(id, 1), keccak256("nitida"));
    }

    function test_topeDeHorasPorHito() public {
        uint256 id = _crearTechos();
        vm.prank(angel);
        hub.donate(id, 1_000e6);
        vm.prank(org);
        hub.submitEvidence(id, 0, keccak256("e"));
        LoopiHub.Cert[] memory c = new LoopiHub.Cert[](1);
        c[0] = LoopiHub.Cert(t1, 41, 1);
        vm.prank(veedor);
        vm.expectRevert(LoopiHub.InvalidHours.selector);
        hub.approveMilestone(id, 0, c);
        c[0] = LoopiHub.Cert(t1, 0, 1);
        vm.prank(veedor);
        vm.expectRevert(LoopiHub.InvalidHours.selector);
        hub.approveMilestone(id, 0, c);
    }

    function test_soloElOrganizadorEditaLaDescripcion() public {
        uint256 id = _crearTechos();
        vm.prank(angel);
        vm.expectRevert(LoopiHub.NotOrganizer.selector);
        hub.updateMetadata(id, keccak256("v2"));
        vm.prank(org);
        hub.updateMetadata(id, keccak256("v2"));
        (,,,,, bytes32 meta) = hub.causes(id);
        assertEq(meta, keccak256("v2"));
    }

    function test_faucetUnaVezYMintSoloAdmin() public {
        vm.prank(t1);
        usdc.faucet();
        assertEq(usdc.balanceOf(t1), 100e6);
        vm.prank(t1);
        vm.expectRevert(MockUSDC.AlreadyClaimed.selector);
        usdc.faucet();
        vm.prank(t1);
        vm.expectRevert();
        usdc.mint(t1, 1e6);
    }

    function test_gas50Tejedores() public {
        uint256 id = _crearTechos();
        vm.prank(angel);
        hub.donate(id, 1_000e6);
        vm.prank(org);
        hub.submitEvidence(id, 0, keccak256("e"));
        LoopiHub.Cert[] memory c = new LoopiHub.Cert[](50);
        for (uint256 i; i < 50; ++i) {
            c[i] = LoopiHub.Cert(address(uint160(0x10000 + i)), 8, 0);
        }
        vm.prank(veedor);
        uint256 g = gasleft();
        hub.approveMilestone(id, 0, c);
        uint256 used = g - gasleft();
        emit log_named_uint("gas aprobar con 50 Tejedores nuevos", used);
        assertLt(used, 4_000_000); // ~3,2M con las reglas de gas de Monad (network = "monad"); el limite por transaccion es 30M
    }

    function test_pausaFrenaAportes() public {
        uint256 id = _crearTechos();
        hub.pause();
        vm.prank(angel);
        vm.expectRevert(Pausable.EnforcedPause.selector);
        hub.donate(id, 1e6);
    }
}
