# 🛡️ Solidity DeFi Security & Smart Contract Vulnerability Lab

[![Language](https://img.shields.io/badge/Language-Solidity-363636?style=flat-square&logo=solidity)](https://soliditylang.org/)
[![Framework](https://img.shields.io/badge/Framework-Hardhat-yellow?style=flat-square&logo=hardhat)](https://hardhat.org/)
[![TypeScript](https://img.shields.io/badge/Language-TypeScript-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)](LICENSE)

An advanced smart contract security testing suite and exploit laboratory researching EVM vulnerability vectors, recursive reentrancy attacks, Denial of Service (DoS) conditions, and robust remediation patterns across decentralized finance (DeFi) protocols and NFT marketplaces.

---

## 🏛️ Security Research Modules

### 1. Vault Reentrancy Exploitation (`Q2/`)
- **Vulnerability Mechanism**: Investigates state update ordering and external call sequencing ($Checks \to Effects \to Interactions$).
- **Exploit Vector (`VaultAttack.sol`)**: Simulates a malicious contract executing recursive fallback reentrancy against liquidity vaults prior to internal balance deductions.
- **Verification**: Hardhat automated test suites validating full liquidity drainage and subsequent state reversion with reentrancy guard mitigations.

### 2. NFT Marketplace Denial of Service & Push vs. Pull Remediation (`Q3/`)
- **DoS Attack Vector (`NftSale.sol`, `BlacklistReceiver.sol`)**: Demonstrates how push-payment architectures can be paralyzed if a malicious receiver contract intentionally reverts upon receiving Ether, permanently freezing marketplace auctions.
- **Remediation Pattern (`NftSaleFixed.sol`)**: Re-engineers the protocol using the **Pull-Payment Pattern** (withdrawal pattern), isolating bidder payouts so failures cannot halt contract execution.

---

## 📂 Repository Structure

```text
BC-HW03/
├── Q2/                       # Vault Reentrancy Exploit Lab
│   ├── contracts/            # Target Vault & Exploit contracts (VaultAttack.sol)
│   ├── test/                 # Hardhat automated exploit test suites
│   ├── scripts/              # Hardhat deployment & simulation scripts
│   └── hardhat.config.ts     # EVM network configuration
└── Q3/                       # NFT Marketplace DoS & Pull-Payment Lab
    ├── contracts/            # Vulnerable NftSale & Remediation (NftSaleFixed.sol)
    ├── test/                 # DoS and withdrawal pattern unit tests
    └── hardhat.config.ts
```

---

## 🚀 Local Testing & Verification

```bash
# Test Vault Reentrancy Exploit
cd Q2
npm install
npx hardhat test

# Test Marketplace DoS & Remediation
cd ../Q3
npm install
npx hardhat test
```

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
