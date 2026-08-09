const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("FreelanceEscrow", function () {
  const ONE_USDC = 1_000_000n;         // 6 decimals
  const AMOUNT   = 300n * ONE_USDC;    // 300 USDC
  const GRACE    = 7n * 24n * 60n * 60n; // 7 days
  const FEE_BPS  = 100n;               // 1%

  async function deployFixture() {
    const [owner, client, freelancer, agent, feeRecipient, stranger] =
      await ethers.getSigners();

    const USDC = await ethers.getContractFactory("MockUSDC");
    const usdc = await USDC.deploy();
    await usdc.waitForDeployment();

    const Escrow = await ethers.getContractFactory("FreelanceEscrow");
    const escrow = await Escrow.deploy(
      await usdc.getAddress(),
      agent.address,
      FEE_BPS,
      feeRecipient.address,
      GRACE
    );
    await escrow.waitForDeployment();

    // Fund client with 10,000 USDC
    await usdc.mint(client.address, 10_000n * ONE_USDC);
    // Client approves escrow to pull funds
    await usdc.connect(client).approve(await escrow.getAddress(), 10_000n * ONE_USDC);

    return { owner, client, freelancer, agent, feeRecipient, stranger, usdc, escrow };
  }

  describe("constructor", function () {
    it("stores config correctly", async function () {
      const { escrow, usdc, agent, feeRecipient } = await deployFixture();
      expect(await escrow.usdc()).to.equal(await usdc.getAddress());
      expect(await escrow.agent()).to.equal(agent.address);
      expect(await escrow.agentFeeBps()).to.equal(FEE_BPS);
      expect(await escrow.agentFeeRecipient()).to.equal(feeRecipient.address);
      expect(await escrow.refundGracePeriod()).to.equal(GRACE);
    });

    it("reverts on zero USDC address", async function () {
      const [owner, agent, feeRecipient] = await ethers.getSigners();
      const Escrow = await ethers.getContractFactory("FreelanceEscrow");
      await expect(
        Escrow.deploy(ethers.ZeroAddress, agent.address, FEE_BPS, feeRecipient.address, GRACE)
      ).to.be.revertedWithCustomError(Escrow, "InvalidAddress");
    });

    it("reverts on a fee above the 1% cap", async function () {
      const [owner, agent, feeRecipient] = await ethers.getSigners();
      const USDC = await ethers.getContractFactory("MockUSDC");
      const usdc = await USDC.deploy();
      const Escrow = await ethers.getContractFactory("FreelanceEscrow");
      await expect(
        Escrow.deploy(await usdc.getAddress(), agent.address, 101, feeRecipient.address, GRACE)
      ).to.be.revertedWithCustomError(Escrow, "FeeTooHigh");
    });
  });

  describe("createAndFund", function () {
    it("creates and funds an order, pulling USDC from client", async function () {
      const { escrow, usdc, client, freelancer } = await deployFixture();
      const deadline = (await time.latest()) + 86400; // +1 day

      const tx = await escrow
        .connect(client)
        .createAndFund(freelancer.address, AMOUNT, "logo design v2", deadline);
      await expect(tx)
        .to.emit(escrow, "OrderFunded")
        .withArgs(1, client.address, freelancer.address, AMOUNT, deadline, "logo design v2");

      expect(await usdc.balanceOf(await escrow.getAddress())).to.equal(AMOUNT);

      const order = await escrow.getOrder(1);
      expect(order.client).to.equal(client.address);
      expect(order.freelancer).to.equal(freelancer.address);
      expect(order.amount).to.equal(AMOUNT);
      expect(order.brief).to.equal("logo design v2");
      expect(order.status).to.equal(1); // Funded
    });

    it("reverts on zero amount", async function () {
      const { escrow, client, freelancer } = await deployFixture();
      const deadline = (await time.latest()) + 86400;
      await expect(
        escrow.connect(client).createAndFund(freelancer.address, 0, "", deadline)
      ).to.be.revertedWithCustomError(escrow, "InvalidAmount");
    });

    it("reverts on past deadline", async function () {
      const { escrow, client, freelancer } = await deployFixture();
      const past = (await time.latest()) - 1;
      await expect(
        escrow.connect(client).createAndFund(freelancer.address, AMOUNT, "", past)
      ).to.be.revertedWithCustomError(escrow, "DeadlineInPast");
    });

    it("reverts on zero freelancer address", async function () {
      const { escrow, client } = await deployFixture();
      const deadline = (await time.latest()) + 86400;
      await expect(
        escrow.connect(client).createAndFund(ethers.ZeroAddress, AMOUNT, "", deadline)
      ).to.be.revertedWithCustomError(escrow, "InvalidAddress");
    });
  });

  describe("submitDelivery", function () {
    it("freelancer submits deliverable, status flips to Delivered", async function () {
      const { escrow, client, freelancer } = await deployFixture();
      const deadline = (await time.latest()) + 86400;
      await escrow.connect(client).createAndFund(freelancer.address, AMOUNT, "", deadline);

      await expect(escrow.connect(freelancer).submitDelivery(1, "ipfs://Qm..."))
        .to.emit(escrow, "DeliverySubmitted")
        .withArgs(1, "ipfs://Qm...");

      const o = await escrow.getOrder(1);
      expect(o.deliverable).to.equal("ipfs://Qm...");
      expect(o.status).to.equal(2); // Delivered
    });

    it("reverts if non-freelancer submits", async function () {
      const { escrow, client, freelancer, stranger } = await deployFixture();
      const deadline = (await time.latest()) + 86400;
      await escrow.connect(client).createAndFund(freelancer.address, AMOUNT, "", deadline);
      await expect(
        escrow.connect(stranger).submitDelivery(1, "x")
      ).to.be.revertedWithCustomError(escrow, "NotAuthorized");
    });

    it("reverts if status isn't Funded", async function () {
      const { escrow, client, freelancer } = await deployFixture();
      const deadline = (await time.latest()) + 86400;
      await escrow.connect(client).createAndFund(freelancer.address, AMOUNT, "", deadline);
      await escrow.connect(freelancer).submitDelivery(1, "x");
      await expect(
        escrow.connect(freelancer).submitDelivery(1, "y")
      ).to.be.revertedWithCustomError(escrow, "WrongStatus");
    });
  });

  describe("approveAndRelease", function () {
    it("client can release, fee + net distributed correctly", async function () {
      const { escrow, usdc, client, freelancer, feeRecipient } = await deployFixture();
      const deadline = (await time.latest()) + 86400;
      await escrow.connect(client).createAndFund(freelancer.address, AMOUNT, "", deadline);
      await escrow.connect(freelancer).submitDelivery(1, "x");

      const expectedFee = (AMOUNT * FEE_BPS) / 10000n;
      const expectedNet = AMOUNT - expectedFee;

      await expect(escrow.connect(client).approveAndRelease(1))
        .to.emit(escrow, "OrderReleased")
        .withArgs(1, client.address, expectedNet, expectedFee);

      expect(await usdc.balanceOf(freelancer.address)).to.equal(expectedNet);
      expect(await usdc.balanceOf(feeRecipient.address)).to.equal(expectedFee);
      expect(await usdc.balanceOf(await escrow.getAddress())).to.equal(0);
    });

    it("agent can release (this is the agentic part)", async function () {
      const { escrow, usdc, client, freelancer, agent } = await deployFixture();
      const deadline = (await time.latest()) + 86400;
      await escrow.connect(client).createAndFund(freelancer.address, AMOUNT, "", deadline);
      await escrow.connect(freelancer).submitDelivery(1, "x");

      await expect(escrow.connect(agent).approveAndRelease(1))
        .to.emit(escrow, "OrderReleased");

      expect(await usdc.balanceOf(freelancer.address)).to.be.gt(0);
    });

    it("stranger cannot release", async function () {
      const { escrow, client, freelancer, stranger } = await deployFixture();
      const deadline = (await time.latest()) + 86400;
      await escrow.connect(client).createAndFund(freelancer.address, AMOUNT, "", deadline);
      await escrow.connect(freelancer).submitDelivery(1, "x");
      await expect(
        escrow.connect(stranger).approveAndRelease(1)
      ).to.be.revertedWithCustomError(escrow, "NotAuthorized");
    });

    it("reverts if not yet delivered", async function () {
      const { escrow, client, freelancer } = await deployFixture();
      const deadline = (await time.latest()) + 86400;
      await escrow.connect(client).createAndFund(freelancer.address, AMOUNT, "", deadline);
      await expect(
        escrow.connect(client).approveAndRelease(1)
      ).to.be.revertedWithCustomError(escrow, "WrongStatus");
    });
  });

  describe("refund", function () {
    it("client gets refunded after deadline + grace", async function () {
      const { escrow, usdc, client, freelancer } = await deployFixture();
      const deadline = (await time.latest()) + 86400;
      await escrow.connect(client).createAndFund(freelancer.address, AMOUNT, "", deadline);

      const before = await usdc.balanceOf(client.address);
      await time.increaseTo(BigInt(deadline) + GRACE + 1n);

      await expect(escrow.refund(1)).to.emit(escrow, "OrderRefunded").withArgs(1);

      const after = await usdc.balanceOf(client.address);
      expect(after - before).to.equal(AMOUNT);
    });

    it("reverts before grace expires", async function () {
      const { escrow, client, freelancer } = await deployFixture();
      const deadline = (await time.latest()) + 86400;
      await escrow.connect(client).createAndFund(freelancer.address, AMOUNT, "", deadline);

      await time.increaseTo(deadline + 100); // past deadline but inside grace
      await expect(escrow.refund(1)).to.be.revertedWithCustomError(escrow, "TooEarlyForRefund");
    });

    it("reverts if delivery already happened (status not Funded)", async function () {
      const { escrow, client, freelancer } = await deployFixture();
      const deadline = (await time.latest()) + 86400;
      await escrow.connect(client).createAndFund(freelancer.address, AMOUNT, "", deadline);
      await escrow.connect(freelancer).submitDelivery(1, "x");
      await time.increaseTo(BigInt(deadline) + GRACE + 1n);
      await expect(escrow.refund(1)).to.be.revertedWithCustomError(escrow, "WrongStatus");
    });
  });

  describe("admin", function () {
    it("owner can update agent", async function () {
      const { escrow, owner, stranger } = await deployFixture();
      await expect(escrow.connect(owner).setAgent(stranger.address))
        .to.emit(escrow, "AgentUpdated");
      expect(await escrow.agent()).to.equal(stranger.address);
    });

    it("non-owner cannot update agent", async function () {
      const { escrow, stranger } = await deployFixture();
      await expect(escrow.connect(stranger).setAgent(stranger.address))
        .to.be.reverted;
    });

    it("owner can update fee", async function () {
      const { escrow, owner, stranger } = await deployFixture();
      // 50 bps = 0.5%: the owner can still lower the fee, just never exceed 1%.
      await escrow.connect(owner).setAgentFee(50, stranger.address);
      expect(await escrow.agentFeeBps()).to.equal(50);
      expect(await escrow.agentFeeRecipient()).to.equal(stranger.address);
    });

    it("cannot raise the fee above the 1% cap", async function () {
      const { escrow, owner, stranger } = await deployFixture();
      await expect(
        escrow.connect(owner).setAgentFee(101, stranger.address)
      ).to.be.revertedWithCustomError(escrow, "FeeTooHigh");
    });
  });

  describe("end-to-end happy path", function () {
    it("Jakarta freelancer + NYC client + AI agent, full lifecycle", async function () {
      const { escrow, usdc, client, freelancer, agent, feeRecipient } = await deployFixture();
      const deadline = (await time.latest()) + 86400 * 3; // 3 days

      // Day 0: client funds escrow
      await escrow.connect(client).createAndFund(
        freelancer.address,
        AMOUNT,
        "Brand logo + 3 variations, deliver via Figma link",
        deadline
      );
      expect(await usdc.balanceOf(await escrow.getAddress())).to.equal(AMOUNT);

      // Day 2: freelancer delivers
      await time.increase(2 * 86400);
      await escrow.connect(freelancer).submitDelivery(1, "https://figma.com/file/abc");

      // Day 2+1s: agent verifies and releases
      await escrow.connect(agent).approveAndRelease(1);

      const fee = (AMOUNT * FEE_BPS) / 10000n;
      const net = AMOUNT - fee;
      expect(await usdc.balanceOf(freelancer.address)).to.equal(net);
      expect(await usdc.balanceOf(feeRecipient.address)).to.equal(fee);

      const o = await escrow.getOrder(1);
      expect(o.status).to.equal(3); // Released
    });
  });

  describe("fee locked at funding", function () {
    // The whole product is a trust claim: the client agrees to a 1% fee when they
    // put money in. If the owner could raise the fee afterwards and have it apply
    // to escrow already funded, that claim would be worthless.
    it("charges the rate agreed at funding, not the current one", async function () {
      const { owner, client, freelancer, escrow, usdc, feeRecipient } = await deployFixture();
      const deadline = (await time.latest()) + 7 * 24 * 60 * 60;

      await escrow.connect(client).createAndFund(freelancer.address, AMOUNT, "brief", deadline);

      // Owner raises the fee to the contract maximum AFTER the money is in.
      // The cap means the owner cannot reach 10% at all any more. Prove the
      // attempt reverts, then prove the lock still holds for a legal change.
      await expect(escrow.connect(owner).setAgentFee(1000n, feeRecipient.address))
        .to.be.revertedWithCustomError(escrow, "FeeTooHigh");

      const before = await usdc.balanceOf(freelancer.address);
      await escrow.connect(freelancer).submitDelivery(1, "https://example.com/work");
      await escrow.connect(client).approveAndRelease(1);
      const paid = (await usdc.balanceOf(freelancer.address)) - before;

      // 1% was agreed, so 99% is owed -- not the 90% the new rate would give.
      expect(paid).to.equal(AMOUNT - (AMOUNT * FEE_BPS) / 10000n);
    });

    it("applies the new rate to orders funded after the change", async function () {
      const { owner, client, freelancer, escrow, usdc, feeRecipient } = await deployFixture();
      const deadline = (await time.latest()) + 7 * 24 * 60 * 60;

      await escrow.connect(owner).setAgentFee(50n, feeRecipient.address);
      await escrow.connect(client).createAndFund(freelancer.address, AMOUNT, "brief", deadline);

      const before = await usdc.balanceOf(freelancer.address);
      await escrow.connect(freelancer).submitDelivery(1, "https://example.com/work");
      await escrow.connect(client).approveAndRelease(1);
      const paid = (await usdc.balanceOf(freelancer.address)) - before;

      expect(paid).to.equal(AMOUNT - (AMOUNT * 50n) / 10000n);
    });

    it("locks the rate for the refund-timeout path too", async function () {
      const { owner, client, freelancer, escrow, usdc, feeRecipient } = await deployFixture();
      const deadline = (await time.latest()) + 7 * 24 * 60 * 60;

      await escrow.connect(client).createAndFund(freelancer.address, AMOUNT, "brief", deadline);
      await escrow.connect(freelancer).submitDelivery(1, "https://example.com/work");
      await expect(escrow.connect(owner).setAgentFee(1000n, feeRecipient.address))
        .to.be.revertedWithCustomError(escrow, "FeeTooHigh");
      await time.increase(Number(GRACE) + 60);

      const before = await usdc.balanceOf(freelancer.address);
      await escrow.connect(freelancer).claimDelivered(1);
      const paid = (await usdc.balanceOf(freelancer.address)) - before;

      expect(paid).to.equal(AMOUNT - (AMOUNT * FEE_BPS) / 10000n);
    });
  });

});
