import { expect } from "chai";
import { network } from "hardhat";

const { ethers } = await network.create();

describe("Part 3-A: NFT Blacklist Receiver", function () {
    let nftSale, receiver;
    let deployer, alice, bob;

    beforeEach(async function () {
        [deployer, alice, bob] = await ethers.getSigners();

        // Deploy NftSale
        const NftSale = await ethers.getContractFactory("NftSale");
        nftSale = await NftSale.deploy();
        await nftSale.waitForDeployment();

        // Deploy BlacklistReceiver
        const BlacklistReceiver = await ethers.getContractFactory("BlacklistReceiver");
        receiver = await BlacklistReceiver.deploy();
        await receiver.waitForDeployment();
    });

    it("Should accept NFT from a normal user (Bob)", async function () {
        const receiverAddr = await receiver.getAddress();
        const price = ethers.parseUnits("100", "gwei");

        // Bob buys 1 NFT
        await nftSale.connect(bob).buy(1, { value: price });

        // Bob transfers NFT to the receiver contract
        await nftSale.connect(bob).transfer(receiverAddr, 0);

        // Verify ownership transferred successfully
        expect(await nftSale.ownerOf(0)).to.equal(receiverAddr);
        console.log("✅ Bob's NFT accepted by receiver");
    });

    it("Should reject NFT from a blacklisted user (Alice)", async function () {
        const receiverAddr = await receiver.getAddress();
        const price = ethers.parseUnits("100", "gwei");

        // Add Alice to blacklist
        await receiver.addToBlacklist(alice.address);

        // Alice buys 1 NFT
        await nftSale.connect(alice).buy(1, { value: price });

        // Alice tries to transfer - should revert
        await expect(
            nftSale.connect(alice).transfer(receiverAddr, 0)
        ).to.be.revertedWith("Sender is blacklisted");

        // Alice still owns the NFT
        expect(await nftSale.ownerOf(0)).to.equal(alice.address);
        console.log("❌ Alice's NFT rejected - she is blacklisted");
    });
});