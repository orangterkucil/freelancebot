/**
 * On-chain bindings for the FreelanceEscrow contract on Arc testnet.
 *
 * Two layers:
 *   - constants: addresses, chain id, RPC URL (all from env)
 *   - getEscrowContract / getUsdcContract: ethers Contract instances that
 *     auto-detect read-only (JsonRpcProvider) vs write-capable (BrowserProvider
 *     signing via MetaMask injected provider).
 */

import { BrowserProvider, Contract, JsonRpcProvider, type Eip1193Provider, type Signer } from "ethers";

export const ESCROW_ADDRESS = process.env.NEXT_PUBLIC_ESCROW_ADDRESS ?? "";
export const ARC_RPC_URL    = process.env.NEXT_PUBLIC_ARC_RPC_URL    ?? "https://rpc.testnet.arc.network";
export const ARC_CHAIN_ID   = Number(process.env.NEXT_PUBLIC_ARC_CHAIN_ID ?? 5042002);
export const USDC_DECIMALS  = 6;

// USDC on Arc testnet (per https://developers.circle.com/stablecoins/usdc-contract-addresses)
export const USDC_ADDRESS = "0x3600000000000000000000000000000000000000";

// ---------------------------------------------------------------------------
// ABIs (minimal — only the functions we call from the UI)
// ---------------------------------------------------------------------------

export const ESCROW_ABI = [
  "function createAndFund(address freelancer, uint256 amount, string brief, uint64 deadline) external returns (uint256 orderId)",
  "function submitDelivery(uint256 orderId, string deliverable) external",
  "function approveAndRelease(uint256 orderId) external",
  "function refund(uint256 orderId) external",
  "function getOrder(uint256 orderId) external view returns (tuple(address client, address freelancer, uint256 amount, string brief, string deliverable, uint64 deadline, uint64 createdAt, uint8 status))",
  "function usdc() external view returns (address)",
  "function agentFeeBps() external view returns (uint256)",
  "event OrderFunded(uint256 indexed orderId, address indexed client, address indexed freelancer, uint256 amount, uint64 deadline, string brief)",
  "event DeliverySubmitted(uint256 indexed orderId, string deliverable)",
  "event OrderReleased(uint256 indexed orderId, address indexed releasedBy, uint256 freelancerNet, uint256 agentFee)",
  "event OrderRefunded(uint256 indexed orderId)",
];

export const USDC_ABI = [
  "function approve(address spender, uint256 amount) external returns (bool)",
  "function allowance(address owner, address spender) external view returns (uint256)",
  "function balanceOf(address account) external view returns (uint256)",
  "function decimals() external view returns (uint8)",
];

// ---------------------------------------------------------------------------
// Provider helpers
// ---------------------------------------------------------------------------

/** Read-only provider — RPC. Safe to use server-side too. */
export function getReadProvider() {
  return new JsonRpcProvider(ARC_RPC_URL, { chainId: ARC_CHAIN_ID, name: "arc-testnet" });
}

/** Browser provider that signs via MetaMask. Throws if no wallet injected. */
export function getBrowserProvider(): BrowserProvider {
  if (typeof window === "undefined") {
    throw new Error("Browser provider is only available in the browser");
  }
  const eth = (window as unknown as { ethereum?: Eip1193Provider }).ethereum;
  if (!eth) {
    throw new Error("No injected wallet found. Install MetaMask and switch to Arc Testnet.");
  }
  return new BrowserProvider(eth, { chainId: ARC_CHAIN_ID, name: "arc-testnet" });
}

/** Ask the user to connect their wallet and return a signer. */
export async function connectWallet(): Promise<{ address: string; signer: Signer }> {
  const provider = getBrowserProvider();
  // request account access (MetaMask popup)
  await provider.send("eth_requestAccounts", []);
  // make sure the user is on the right chain
  const net = await provider.getNetwork();
  if (Number(net.chainId) !== ARC_CHAIN_ID) {
    try {
      await provider.send("wallet_switchEthereumChain", [
        { chainId: "0x" + ARC_CHAIN_ID.toString(16) },
      ]);
    } catch (err: any) {
      // chain not added — add it
      if (err?.code === 4902 || /unrecognized chain/i.test(String(err?.message))) {
        await provider.send("wallet_addEthereumChain", [
          {
            chainId: "0x" + ARC_CHAIN_ID.toString(16),
            chainName: "Arc Testnet",
            rpcUrls: [ARC_RPC_URL],
            nativeCurrency: { name: "USDC", symbol: "USDC", decimals: 6 },
            blockExplorerUrls: ["https://testnet.arcscan.app"],
          },
        ]);
      } else {
        throw err;
      }
    }
  }
  const signer = await provider.getSigner();
  const address = await signer.getAddress();
  return { address, signer };
}

// ---------------------------------------------------------------------------
// Contract factories
// ---------------------------------------------------------------------------

export function getEscrowReadonly() {
  if (!ESCROW_ADDRESS) throw new Error("NEXT_PUBLIC_ESCROW_ADDRESS not set");
  return new Contract(ESCROW_ADDRESS, ESCROW_ABI, getReadProvider());
}

export function getEscrowWithSigner(signer: Signer) {
  if (!ESCROW_ADDRESS) throw new Error("NEXT_PUBLIC_ESCROW_ADDRESS not set");
  return new Contract(ESCROW_ADDRESS, ESCROW_ABI, signer);
}

export function getUsdcReadonly() {
  return new Contract(USDC_ADDRESS, USDC_ABI, getReadProvider());
}

export function getUsdcWithSigner(signer: Signer) {
  return new Contract(USDC_ADDRESS, USDC_ABI, signer);
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Convert a human number (e.g. 300 USDC) to token units (6 decimals). */
export function toUsdcUnits(amount: number | string): bigint {
  const s = typeof amount === "number" ? amount.toString() : amount;
  const [whole, frac = ""] = s.split(".");
  const fracPadded = (frac + "000000").slice(0, USDC_DECIMALS);
  return BigInt(whole) * 1_000_000n + BigInt(fracPadded || "0");
}

/** Convert token units back to a human-readable string. */
export function fromUsdcUnits(units: bigint): string {
  const whole = units / 1_000_000n;
  const frac  = units % 1_000_000n;
  if (frac === 0n) return whole.toString();
  return `${whole}.${frac.toString().padStart(6, "0").replace(/0+$/, "")}`;
}

export const ARC_EXPLORER = "https://testnet.arcscan.app";
export function txUrl(hash: string) {
  return `${ARC_EXPLORER}/tx/${hash}`;
}
export function addressUrl(addr: string) {
  return `${ARC_EXPLORER}/address/${addr}`;
}
