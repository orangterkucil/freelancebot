// Week 2 will flesh this out. For now, placeholder.
const { ethers } = require("hardhat");

async function main() {
  const USDC_ADDRESS = process.env.ARC_USDC_ADDRESS || "0x0000000000000000000000000000000000000000";
  const Escrow = await ethers.getContractFactory("FreelanceEscrow");
  const escrow = await Escrow.deploy(USDC_ADDRESS);
  await escrow.waitForDeployment();
  console.log("FreelanceEscrow deployed to:", await escrow.getAddress());
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
