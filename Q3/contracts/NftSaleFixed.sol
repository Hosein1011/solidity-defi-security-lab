// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

// Interface for contracts that can receive NFTs
interface NftReceiver {
    function onNftReceived(address from, uint256 tokenId) external returns (bool);
}

contract NftSaleFixed {
    string public constant name = "Totally Capped NFT";
    string public constant symbol = "TCN";
    uint256 public totalSupply;
    uint256 public constant price = 100 gwei;
    mapping(uint256 => address) public ownerOf;

    // Reentrancy guard: tracks whether a function is currently executing
    bool private locked;

    event Transfer(address indexed from, address indexed to, uint256 indexed tokenId);
    event Mint(address indexed owner, uint256 indexed tokenId);

    // Modifier that prevents a function from being called recursively
    modifier nonReentrant() {
        require(!locked, "Reentrancy detected");
        locked = true;
        _;
        locked = false;
    }

    // Transfer NFT to another address
    function transfer(address to, uint256 tokenId) external {
        require(ownerOf[tokenId] == msg.sender, "token is not owned");
        require(to != address(0), "invalid destination");
        ownerOf[tokenId] = to;
        emit Transfer(msg.sender, to, tokenId);

        // If destination is a contract, confirm receipt
        if (to.code.length > 0) {
            require(
                NftReceiver(to).onNftReceived(msg.sender, tokenId),
                "NFT Rejected by receiver"
            );
        }
    }

    // Buy and mint new NFTs
    // The nonReentrant modifier blocks any attempt to re-enter this function
    function buy(uint256 mintCount) external payable nonReentrant {
        require(totalSupply < 5, "cap already reached");
        require(mintCount > 0, "can not buy 0 token");
        require(mintCount <= 2, "can not buy more than 2 NFTs at once");
        require(totalSupply + mintCount <= 5, "exceeds NFT supply");
        require(price * mintCount == msg.value, "sent value is not correct");

        for (uint256 i = 0; i < mintCount; i++) {
            _mint(msg.sender, totalSupply);
        }
    }

    // Internal mint function
    function _mint(address to, uint256 tokenId) private {
        require(ownerOf[tokenId] == address(0), "token already minted");
        ownerOf[tokenId] = to;
        totalSupply++;

        // If destination is a contract, confirm receipt
        if (to.code.length > 0) {
            require(
                NftReceiver(to).onNftReceived(address(0), tokenId),
                "NFT Rejected by receiver"
            );
        }
        emit Mint(to, tokenId);
    }
}