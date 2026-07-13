# Building a USDC-Escrow + AI-Verification dApp on Arc Testnet

*A field guide from building [FreelanceBot](https://github.com/orangterkucil/freelancebot) — an autonomous payment agent for freelancers, live on Arc testnet.*

Most freelance payments wait days and leak fees. I wanted to see how far Arc's stablecoin-native design could shrink that to: **client funds USDC → work is verified → payment releases in under a second, with no human pressing "release."** This is how the pieces fit together on Arc, plus the gotchas that cost me time so they don't cost you.

## What we're building

Three moving parts:
1. **An on-chain escrow contract** (Solidity) that custodies USDC and releases it on defined conditions.
2. **An AI verification step** that scores a deliverable against the brief + deadline and triggers the on-chain release.
3. **A Next.js frontend** with wallet signing via ethers v6.

The whole point of doing this on **Arc** rather than a generic EVM chain: USDC is the *native gas token*, settlement is sub-second, and the money is custodied by a contract — not a platform.

## 1. Wiring up Arc testnet

From the Arc docs (`docs.arc.io`), the essentials:

- **Chain ID:** `5042002`
- **RPC:** `https://rpc.testnet.arc.network`
- **Explorer:** `https://testnet.arcscan.app`
- **Gas token:** USDC (6 decimals) — not a separate volatile coin
- **Testnet USDC:** grab it from `faucet.circle.com`

Adding it to MetaMask programmatically:

```js
await provider.send("wallet_addEthereumChain", [{
  chainId: "0x" + (5042002).toString(16),
  chainName: "Arc Testnet",
  rpcUrls: ["https://rpc.testnet.arc.network"],
  nativeCurrency: { name: "USDC", symbol: "USDC", decimals: 6 },
  blockExplorerUrls: ["https://testnet.arcscan.app"],
}]);
```

> **Gotcha #1 — do NOT pin the network on your BrowserProvider.**
> In ethers v6, `new BrowserProvider(eth, { chainId: 5042002 })` throws
> `network changed: 5042002 => 1` on the first call whenever the wallet is on
> another chain, and every action dead-locks. Construct it as
> `new BrowserProvider(eth)` (auto-detect), then prompt a
> `wallet_switchEthereumChain` to Arc. Re-create the provider after the switch
> so ethers reads the fresh network cleanly.

## 2. The escrow contract

The core is a status machine over an `Order`. USDC is 6-decimals, so amounts are token units (`300 USDC == 300_000_000`).

```solidity
enum Status { None, Funded, Delivered, Released, Refunded }

function createAndFund(address freelancer, uint256 amount, string brief, uint64 deadline)
    external returns (uint256 orderId);   // pulls USDC via transferFrom, status -> Funded
function submitDelivery(uint256 orderId, string deliverable) external;  // freelancer only
function approveAndRelease(uint256 orderId) external;   // client/agent, status -> Released
function refund(uint256 orderId) external;              // after deadline + grace, -> Refunded
```

A few design choices worth copying:

- **Custom errors over require-strings** — cheaper and cleaner:
  `error WrongStatus(Status expected, Status actual); error TooEarlyForRefund(); error NotAuthorized();`
- **A refund grace period** so a stalled job can always return funds to the client:
  `if (block.timestamp <= o.deadline + refundGracePeriod) revert TooEarlyForRefund();`
- **A capped agent fee** (basis points, hard-limited) taken at release.

> **Gotcha #2 — put your custom errors in the frontend ABI.**
> If your JS ABI lists only functions/events, ethers can't decode a custom-error
> revert and you get the useless `execution reverted (unknown custom error)`.
> Add `"error WrongStatus(uint8 expected, uint8 actual)"` etc. to the ABI and the
> real reason surfaces — priceless when debugging why a `refund()` reverts.

## 3. The verification step

Before release, the deliverable is scored by an LLM (I used Groq's Llama 3.3 70B) against three concrete checks:

- Is the deliverable URL actually reachable?
- Does it match the brief's requirements?
- Was it delivered before the deadline?

Pass → the client/agent calls `approveAndRelease`. Fail → escrow holds. Keeping the checks *deterministic and explainable* (reachability, deadline, brief-alignment) matters more than model cleverness — you want a verdict a user can argue with.

## 4. Signing transactions (ethers v6 + USDC gas)

Funding is a two-step `approve` then `createAndFund`:

```js
const usdc = new Contract(USDC_ADDRESS, USDC_ABI, signer);
await (await usdc.approve(ESCROW_ADDRESS, amount)).wait();
const tx = await escrow.createAndFund(freelancer, amount, brief, deadline);
const receipt = await tx.wait();          // gas paid in USDC, sub-second finality
```

> **Gotcha #3 — an order funded in "demo/simulated" mode does not exist on-chain.**
> If your UX has an off-chain demo path, guard on-chain actions by *reading the
> order back* (`getOrder(id)` → zero client / status `None` means it isn't really
> there) and route release/refund to the off-chain path for those. Otherwise the
> contract reverts `WrongStatus` and the user is stuck with a dead button.

## What Arc made easy

- **No second gas asset to reason about.** Quoting fees to a freelancer in the same USDC they get paid in removes a whole class of UX friction.
- **Sub-second finality** makes "paid before you close the tab" literally true — the demo feels like magic because the settlement isn't the bottleneck.
- **Standard EVM tooling** (Hardhat, ethers, MetaMask) worked unchanged; the only Arc-specific bits were the chain config and the USDC-as-gas mental model.

## Try it / fork it

- Live: <https://freelancebot-alpha.vercel.app>
- Code: <https://github.com/orangterkucil/freelancebot>
- Contract: <https://testnet.arcscan.app/address/0xA8CA04560603951b0f0e803039B059432F673ae4>

Questions about the escrow design, the USDC-gas handling, or the verification flow — happy to go deeper. Building toward mainnet the day Arc goes live.
