// Deploys FreelanceEscrow to the configured network.
//
// Usage:
//   cd contracts
//   npm install
//   cp ../.env.local.example ../.env.local   # if you haven't already
//   npx hardhat run scripts/deploy.js --network arcTestnet
//
// Required env vars (set in ../.env.local or in the shell):
//   NEXT_PUBLIC_ARC_RPC_URL      RPC URL for Arc testnet
//   NEXT_PUBLIC_ARC_CHAIN_ID     Chain ID for Arc testnet
//   DEPLOYER_PRIVATE_KEY         Private key for an Arc testnet wallet with some testnet ETH/USDC
//   ARC_USDC_ADDRESS             Address of USDC on Arc testnet (look up in Arc docs)
//
// Optional:
//   AGENT_ADDRESS                Wallet that will act as the AI agent (defaults to deployer)
//   AGENT_FEE_BPS                Agent fee in basis points (0-1000). Default 100 (1%).
//   AGENT_FEE_RECIPIENT          Where agent fees go. Defaults to deployer.
//   REFUND_GRACE_SECONDS         Seconds after deadline before refund opens. Default 604800 (7d).

const { ethers, network } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();

  const usdcAddress    = process.env.ARC_USDC_ADDRESS;
  const agentAddress   = process.env.AGENT_ADDRESS         || deployer.address;
  const feeBps         = Number(process.env.AGENT_FEE_BPS         || 100);
  const feeRecipient   = process.env.AGENT_FEE_RECIPIENT   || deployer.address;
  const refundGrace    = Number(process.env.REFUND_GRACE_SECONDS  || 7 * 24 * 60 * 60);

  if (!usdcAddress) {
    throw new Error("ARC_USDC_ADDRESS env var is required (USDC token address on the target network)");
  }

  console.log("network:        ", network.name);
  console.log("deployer:       ", deployer.address);
  console.log("USDC:           ", usdcAddress);
  console.log("agent:          ", agentAddress);
  console.log("feeBps:         ", feeBps, "(", feeBps / 100, "% )");
  console.log("feeRecipient:   ", feeRecipient);
  console.log("refundGrace:    ", refundGrace, "seconds");

  const Escrow = await ethers.getContractFactory("FreelanceEscrow");
  const escrow = await Escrow.deploy(
    usdcAddress,
    agentAddress,
    feeBps,
    feeRecipient,
    refundGrace
  );
  await escrow.waitForDeployment();

  const address = await escrow.getAddress();
  console.log("");
  console.log("FreelanceEscrow deployed at:", address);
  console.log("");
  console.log("Next: paste this into .env.local as");
  console.log("  NEXT_PUBLIC_ESCROW_ADDRESS=" + address);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
