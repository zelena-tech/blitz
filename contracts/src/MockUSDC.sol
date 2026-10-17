// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/// @notice Token de prueba SOLO para testnet.
///         El admin mintea para la demo; cualquier wallet puede pedir 100 mUSDC una sola vez.
contract MockUSDC is ERC20, Ownable {
    uint256 public constant FAUCET_AMOUNT = 100e6;
    mapping(address => bool) public claimed;

    error AlreadyClaimed();

    constructor() ERC20("Mock USD Coin", "mUSDC") Ownable(msg.sender) {}

    function decimals() public pure override returns (uint8) {
        return 6;
    }

    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }

    function faucet() external {
        if (claimed[msg.sender]) revert AlreadyClaimed();
        claimed[msg.sender] = true;
        _mint(msg.sender, FAUCET_AMOUNT);
    }
}
