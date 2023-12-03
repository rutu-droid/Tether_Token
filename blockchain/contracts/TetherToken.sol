// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract TetherToken is ERC20, Ownable {

    address public upgradedAddress;
    bool public deprecated;

    event Deprecate(address newAddress);

    modifier whenNotDeprecated() {
        require(!deprecated, "Contract deprecated");
        _;
    }

    constructor(uint initialSupply, string memory tokenName, string memory tokenSymbol) ERC20(tokenName, tokenSymbol) Ownable(msg.sender) {
        _mint(msg.sender, initialSupply);
    }

 function _transfer(address to, uint value) external whenNotDeprecated returns (bool) {
    return transfer(to, value);
}

function _transferFrom(address from, address to, uint value) external whenNotDeprecated returns (bool) {
    return transferFrom(from, to, value);
}

function _approve(address spender, uint value) external whenNotDeprecated returns (bool) {
    return approve(spender, value);
}

    function deprecate(address newAddress) public onlyOwner {
        deprecated = true;
        upgradedAddress = newAddress;
        emit Deprecate(newAddress);
    }
}