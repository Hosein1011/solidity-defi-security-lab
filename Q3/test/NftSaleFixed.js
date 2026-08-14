import { expect } from "chai";
import { network } from "hardhat";

const { ethers } = await network.create();

describe("Part 3-C: Fixed NftSale - Attack Must Fail", function () {
    let nftSale, attacker;
    let deployer, alice;

    beforeEach(async function () {
        [deployer, alice] = await ethers.getSigners();

        // Deploy the FIXED NftSale contract
        const NftSaleFixed = await ethers.getContractFactory("NftSaleFixed");
        nftSale = await NftSaleFixed.deploy();
        await nftSale.waitForDeployment();
        const nftSaleAddr = await nftSale.getAddress();

        // Deploy the SAME attacker contract used in Part B
        const NftSaleAttacker = await ethers.getContractFactory("NftSaleAttacker");
        attacker = await NftSaleAttacker.deploy(nftSaleAddr);
        await attacker.waitForDeployment();
    });

    it("Attack should FAIL with 'Reentrancy detected'", async function () {
        const price = ethers.parseUnits("100", "gwei");

        // Fund the attacker with enough ETH (same as Part B)
        const attackFund = price * 9n;
        await deployer.sendTransaction({
            to: await attacker.getAddress(),
            value: attackFund
        });

        // The attack must revert because reentrancy is blocked
        await expect(attacker.attack()).to.be.revertedWith("Reentrancy detected");

        // Since the whole transaction reverted, totalSupply must remain 0
        const finalSupply = await nftSale.totalSupply();
        console.log("Final Total Supply after failed attack:", finalSupply.toString());
        expect(finalSupply).to.equal(0n);

        console.log("Attack successfully blocked by Reentrancy Guard!");
    });

    it("Normal users can still buy up to the 5 NFT cap", async function () {
        const price = ethers.parseUnits("100", "gwei");

        // Alice buys 2 NFTs
        await nftSale.connect(alice).buy(2, { value: price * 2n });
        expect(await nftSale.totalSupply()).to.equal(2n);

        // Alice buys 2 more
        await nftSale.connect(alice).buy(2, { value: price * 2n });
        expect(await nftSale.totalSupply()).to.equal(4n);

        // Alice buys 1 more (reaches the cap of 5)
        await nftSale.connect(alice).buy(1, { value: price * 1n });
        expect(await nftSale.totalSupply()).to.equal(5n);

        // Trying to buy beyond the cap must revert
        await expect(
            nftSale.connect(alice).buy(1, { value: price * 1n })
        ).to.be.revertedWith("cap already reached");

        console.log("Normal functionality preserved: cap of 5 NFTs enforced!");
    });
});