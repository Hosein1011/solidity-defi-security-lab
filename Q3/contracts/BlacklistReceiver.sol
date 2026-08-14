// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

interface NftReceiver {
    function onNftReceived(
        address from,
        uint256 tokenId
    ) external returns (bool);
}

contract BlacklistReceiver is NftReceiver {

    mapping(address => bool) public blacklist;

    function addToBlacklist(address user) external {
        blacklist[user] = true;
    }

    function removeFromBlacklist(address user) external {
        blacklist[user] = false;
    }

    function onNftReceived(
        address from,
        uint256
    ) external view override returns (bool) {
        require(
            !blacklist[from],
            "Sender is blacklisted"
        );

        return true;
    }
}