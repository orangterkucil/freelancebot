# FreelanceBot — Smart Contracts

Solidity contracts for the FreelanceBot MVP, deployable to Arc testnet.

## Contracts

- **src/FreelanceEscrow.sol** — Milestone escrow. Client funds in USDC, freelancer submits a deliverable, client or AI agent releases. Refund path for missed deadlines. Owner-controlled agent address + a fee the owner can lower but never raise above 1% (`MAX_FEE_BPS`).
- **src/MockUSDC.sol** — Test-only ERC-20 with 6 decimals. Not deployed to mainnet/testnet; used only in unit tests.

## Setup

```bash
cd contracts
npm install
```

This installs Hardhat 2.x + toolbox + OpenZeppelin 5.x.

## Compile

```bash
npm run compile
```

## Run tests

```bash
npm test
```

Tests cover: constructor validation, create-and-fund, delivery submission, release (by client AND by agent), refund after grace period, admin functions, and full end-to-end happy path.

## Deploy

Set these env vars in `../.env.local` first:

```
NEXT_PUBLIC_ARC_RPC_URL=https://...
NEXT_PUBLIC_ARC_CHAIN_ID=...
DEPLOYER_PRIVATE_KEY=0x...     # NEVER use a wallet with real funds
ARC_USDC_ADDRESS=0x...         # USDC token on Arc testnet (from Arc docs)
```

Then:

```bash
npm run deploy:arc
```

The script prints the deployed address. Copy it into `../.env.local`:

```
NEXT_PUBLIC_ESCROW_ADDRESS=0x...
```

## Local-only deploy (no Arc needed)

For quick local testing without Arc testnet:

```bash
npm run deploy:local
```

This deploys to the in-memory Hardhat network. State doesn't persist between runs.

## Architecture quick view

```
Client                                             Freelancer
  │                                                    │
  │ approve(USDC, escrow, amount)                      │
  │ createAndFund(freelancer, amount, brief, deadline) │
  ├──────────────► FreelanceEscrow ◄───────────────────┤
  │                  (holds USDC)                      │
  │                       ▲                            │
  │                       │ submitDelivery(id, link)   │
  │                       │                            │
  │ approveAndRelease(id) │ approveAndRelease(id)      │
  └──────────► or ◄───────┴────────────────────────────┘
                AI Agent           ▼
                            USDC ──► Freelancer (net)
                            USDC ──► Fee Recipient (fee)
```
