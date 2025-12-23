// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

import "./ERC20.sol";
import "./Ownable.sol";

contract CurrencyToken is ERC20, Ownable {
    constructor(string memory name, string memory symbol) ERC20(name, symbol) {
        _mint(msg.sender, 1000000000 * 10**decimals());
    }

    function mint(address to, uint256 amount) public onlyOwner {
        _mint(to, amount);
    }

    function doTransfer(address _from, address _to, uint256 _amount) public returns(bool) {
        return transfareNoFees(_from, _to, _amount);
    }

    function getBalance(address wallet_addres) public view returns(uint256) {
        return balanceOf(wallet_addres);
    }
}
