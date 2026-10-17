// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/// @title LoopiHub v2
/// @notice Ángeles aportan, Tejedores trabajan, Veedores aprueban.
///         Regla de oro: ningún peso sale sin aprobación del Veedor.
/// @dev v2 minimalista: hitos no bloqueantes, hitos sin dinero, aportes sin tope,
///      sin fecha límite, sin cancelación ni reembolso. Monad cobra por gas_limit.
contract LoopiHub is Ownable, Pausable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    enum MilestoneStatus { Pending, InReview, Approved }

    /// 4 slots
    struct Cause {
        address organizer;    // slot 1 (+ milestoneCount)
        uint8 milestoneCount;
        address verifier;     // slot 2: el Veedor
        uint128 raised;       // slot 3
        uint128 released;
        bytes32 metadataHash; // slot 4
    }

    /// 1 slot. payee = address(0) y amount = 0 => hito de solo colaboración (sin pago).
    struct Milestone {
        address payee;
        uint88 amount;
        MilestoneStatus status;
    }

    /// Una certificación por Tejedor en un hito (entrada de approveMilestone)
    struct Cert {
        address volunteer;
        uint32 hoursWorked;
        uint8 skill; // 0 general, 1 electricista, 2 plomería, 3 construcción, 4 cocina, 5 carga, 6 salud, 7 psicosocial, 8 conductor
    }

    /// 1 slot por Tejedor
    struct VolunteerStats {
        uint32 hoursTotal;
        uint16 causes;
        uint16 milestones;
    }

    uint256 public constant MAX_MILESTONES = 20;
    uint256 public constant MAX_VOLUNTEERS = 50;
    uint256 public constant MAX_HOURS_PER_CERT = 40; // una semana de trabajo; si dura más, se divide en hitos

    IERC20 public immutable token;
    uint256 public causeCount;

    mapping(address => bool) public approvedOrganizer;
    mapping(uint256 => Cause) public causes;
    mapping(uint256 => mapping(uint256 => Milestone)) public milestones;
    mapping(uint256 => mapping(uint256 => bytes32)) public evidenceHash;
    mapping(uint256 => mapping(address => uint256)) public donations;
    mapping(address => VolunteerStats) public volunteers;
    mapping(uint256 => mapping(address => bool)) public participated;

    event OrganizerSet(address indexed organizer, bool approved);
    event CauseCreated(uint256 indexed id, address indexed organizer, address indexed verifier, bytes32 metadataHash);
    event MilestoneAdded(uint256 indexed id, uint8 indexed milestone, address payee, uint88 amount);
    event CauseMetadataUpdated(uint256 indexed id, bytes32 metadataHash);
    event Donated(uint256 indexed id, address indexed donor, uint128 amount);
    event EvidenceSubmitted(uint256 indexed id, uint8 indexed milestone, bytes32 bundleHash);
    event MilestoneRejected(uint256 indexed id, uint8 indexed milestone, bytes32 reasonHash);
    event MilestoneApproved(uint256 indexed id, uint8 indexed milestone, address indexed payee, uint88 amount);
    event VolunteerCertified(
        address indexed volunteer, uint256 indexed id, uint8 milestone, uint32 hoursCertified, uint8 skill
    );

    error NotApprovedOrganizer();
    error NotOrganizer();
    error NotVerifier();
    error InvalidVerifier();
    error InvalidMilestone();
    error TooManyMilestones();
    error CauseNotFound();
    error InvalidAmount();
    error WrongMilestoneState();
    error InsufficientFunds();
    error LengthMismatch();
    error TooManyVolunteers();
    error UnsortedVolunteers();
    error InvalidHours();

    constructor(IERC20 token_) Ownable(msg.sender) {
        token = token_;
    }

    // ───────────── Admin ─────────────

    function setOrganizer(address organizer, bool approved) external onlyOwner {
        approvedOrganizer[organizer] = approved;
        emit OrganizerSet(organizer, approved);
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    // ───────────── Organizador ─────────────

    function createCause(
        address verifier,
        bytes32 metadataHash,
        address[] calldata payees,
        uint88[] calldata amounts
    ) external whenNotPaused returns (uint256 id) {
        if (!approvedOrganizer[msg.sender]) revert NotApprovedOrganizer();
        if (verifier == address(0) || verifier == msg.sender) revert InvalidVerifier();
        if (payees.length != amounts.length) revert LengthMismatch();

        id = ++causeCount;
        Cause storage c = causes[id];
        c.organizer = msg.sender;
        c.verifier = verifier;
        c.metadataHash = metadataHash;
        emit CauseCreated(id, msg.sender, verifier, metadataHash);

        for (uint256 i; i < payees.length; ++i) {
            _addMilestone(c, id, payees[i], amounts[i]);
        }
    }

    /// @notice Amplía el alcance cuando llegan más aportes (p. ej. 300 almuerzos más).
    function addMilestone(uint256 id, address payee, uint88 amount) external whenNotPaused {
        Cause storage c = causes[id];
        if (msg.sender != c.organizer) revert NotOrganizer();
        _addMilestone(c, id, payee, amount);
    }

    function updateMetadata(uint256 id, bytes32 newHash) external {
        Cause storage c = causes[id];
        if (msg.sender != c.organizer) revert NotOrganizer();
        c.metadataHash = newHash;
        emit CauseMetadataUpdated(id, newHash);
    }

    /// @notice Cualquier hito, en cualquier orden: no bloqueante.
    function submitEvidence(uint256 id, uint8 idx, bytes32 bundleHash) external whenNotPaused {
        Cause storage c = causes[id];
        if (msg.sender != c.organizer) revert NotOrganizer();
        if (idx >= c.milestoneCount) revert InvalidMilestone();
        Milestone storage m = milestones[id][idx];
        if (m.status != MilestoneStatus.Pending) revert WrongMilestoneState();

        m.status = MilestoneStatus.InReview;
        evidenceHash[id][idx] = bundleHash;
        emit EvidenceSubmitted(id, idx, bundleHash);
    }

    // ───────────── Ángel ─────────────

    /// @notice Sin tope: más aportes = más alcance. Sin reembolso: el aporte se une al fondo de la causa.
    function donate(uint256 id, uint128 amount) external whenNotPaused nonReentrant {
        Cause storage c = causes[id];
        if (c.organizer == address(0)) revert CauseNotFound();
        if (amount == 0) revert InvalidAmount();

        c.raised += amount;
        donations[id][msg.sender] += amount;
        token.safeTransferFrom(msg.sender, address(this), amount);
        emit Donated(id, msg.sender, amount);
    }

    // ───────────── Veedor ─────────────

    /// @notice Aprueba un hito: paga al proveedor (si tiene monto) y certifica a los Tejedores.
    /// @param certs una entrada por Tejedor, en orden ascendente de wallet y sin repetidos (el frontend ordena)
    function approveMilestone(uint256 id, uint8 idx, Cert[] calldata certs) external whenNotPaused nonReentrant {
        Cause storage c = causes[id];
        if (msg.sender != c.verifier) revert NotVerifier();
        Milestone storage m = milestones[id][idx];
        if (m.status != MilestoneStatus.InReview) revert WrongMilestoneState();
        uint88 amount = m.amount;
        // Todos los fondos viven en este contrato: sin esta regla, un hito podría pagarse con plata de otra causa.
        if (c.released + amount > c.raised) revert InsufficientFunds();
        if (certs.length > MAX_VOLUNTEERS) revert TooManyVolunteers();

        // Effects
        m.status = MilestoneStatus.Approved;
        if (amount != 0) c.released += amount;

        address prev;
        for (uint256 i; i < certs.length; ++i) {
            Cert calldata ct = certs[i];
            address v = ct.volunteer;
            if (v <= prev) revert UnsortedVolunteers(); // orden estricto: sin duplicados ni address(0)
            if (ct.hoursWorked == 0 || ct.hoursWorked > MAX_HOURS_PER_CERT) revert InvalidHours();
            prev = v;
            VolunteerStats storage st = volunteers[v];
            st.hoursTotal += ct.hoursWorked;
            st.milestones += 1;
            if (!participated[id][v]) {
                participated[id][v] = true;
                st.causes += 1;
            }
            emit VolunteerCertified(v, id, idx, ct.hoursWorked, ct.skill);
        }

        // Interaction
        address payee = m.payee;
        if (amount != 0) token.safeTransfer(payee, amount);
        emit MilestoneApproved(id, idx, payee, amount);
    }

    function rejectMilestone(uint256 id, uint8 idx, bytes32 reasonHash) external {
        Cause storage c = causes[id];
        if (msg.sender != c.verifier) revert NotVerifier();
        Milestone storage m = milestones[id][idx];
        if (m.status != MilestoneStatus.InReview) revert WrongMilestoneState();
        m.status = MilestoneStatus.Pending; // la evidencia se sobrescribe al reenviar
        emit MilestoneRejected(id, idx, reasonHash);
    }

    // ───────────── Lecturas (estado completo desde storage) ─────────────

    function getMilestones(uint256 id) external view returns (Milestone[] memory list, bytes32[] memory evidence) {
        uint256 n = causes[id].milestoneCount;
        list = new Milestone[](n);
        evidence = new bytes32[](n);
        for (uint256 i; i < n; ++i) {
            list[i] = milestones[id][i];
            evidence[i] = evidenceHash[id][i];
        }
    }

    // ───────────── Interno ─────────────

    function _addMilestone(Cause storage c, uint256 id, address payee, uint88 amount) private {
        // Con monto: proveedor obligatorio. Sin monto: hito de colaboración, sin proveedor.
        // El Veedor nunca puede cobrar un hito que él mismo aprueba.
        if ((payee == address(0)) != (amount == 0) || payee == c.verifier) revert InvalidMilestone();
        uint8 idx = c.milestoneCount;
        if (idx >= MAX_MILESTONES) revert TooManyMilestones();
        milestones[id][idx] = Milestone(payee, amount, MilestoneStatus.Pending);
        c.milestoneCount = idx + 1;
        emit MilestoneAdded(id, idx, payee, amount);
    }
}
