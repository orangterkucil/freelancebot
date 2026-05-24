require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config({ path: "../.env.local" });

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.24",
    settings: {
      optimizer: { enabled: true, runs: 200 },
      viaIR: false,
    },
  },
  networks: {
    hardhat: {
      // local test network, auto-managed
    },
    arcTestnet: {
      url: process.env.NEXT_PUBLIC_ARC_RPC_URL || "https://rpc.testnet.arc.network",
      chainId: Number(process.env.NEXT_PUBLIC_ARC_CHAIN_ID || 5042002),
      accounts: process.env.DEPLOYER_PRIVATE_KEY
        ? [process.env.DEPLOYER_PRIVATE_KEY]
        : [],
    },
  },
  paths: {
    sources:   "./",
    tests:     "./test",
    cache:     "./cache",
    artifacts: "./artifacts",
  },
};
