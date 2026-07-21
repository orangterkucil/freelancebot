// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/// @title FreelanceEscrow
/// @notice Milestone escrow for freelance payouts in USDC.
///         Client funds an order. Freelancer submits a deliverable. An AI agent
///         (or the client) then releases the funds. If the freelancer never
///         delivers, the client can refund after a grace period.
/// @dev    Built for the Stablecoins Commerce Stack Challenge, Track 4
///         (Agentic Economy) on Arc testnet.
contract FreelanceEscrow is Ownable {
    using SafeERC20 for IERC20;

    // ---------------------------------------------------------------------
    // Types
    // ---------------------------------------------------------------------

    enum Status {
        None,
        Funded,
        Delivered,
        Released,
        Refunded
    }

    struct Order {
        address client;
        address freelancer;
        uint256 amount;       // USDC, in token units (6 decimals)
        string  brief;        // free-text or IPFS hash describing the work
        string  deliverable;  // set on submitDelivery
        uint64  deadline;     // unix seconds; freelancer must deliver before this
        uint64  createdAt;
        Status  status;
        uint64  deliveredAt;  // set on submitDelivery; enables the review-timeout claim
    }

    // ---------------------------------------------------------------------
    // Storage
    // ---------------------------------------------------------------------

    IERC20  public immutable usdc;
    address public agent;             // AI agent wallet allowed to release
    uint256 public agentFeeBps;       // platform/agent fee, 0..1000 = 0..10%
    address public agentFeeRecipient; // receives the agent fee on release
    uint64  public refundGracePeriod; // seconds after deadline before refund opens

    uint256 public nextOrderId = 1;
    mapping(uint256 => Order) public orders;

    // ---------------------------------------------------------------------
    // Events
    // ---------------------------------------------------------------------

    event OrderFunded(
        uint256 indexed orderId,
        address indexed client,
        address indexed freelancer,
        uint256 amount,
        uint64  deadline,
        string  brief
    );

    event DeliverySubmitted(
        uint256 indexed orderId,
        string  deliverable
    );

    event OrderReleased(
        uint256 indexed orderId,
        address indexed releasedBy,
        uint256 freelancerNet,
        uint256 agentFee
    );

    event OrderRefunded(uint256 indexed orderId);

    event AgentUpdated(address indexed oldAgent, address indexed newAgent);
    event AgentFeeUpdated(uint256 oldBps, uint256 newBps, address oldRecipient, address newRecipient);

    // ---------------------------------------------------------------------
    // Errors
    // ---------------------------------------------------------------------

    error WrongStatus(Status expected, Status actual);
    error NotAuthorized();
    error InvalidAmount();
    error InvalidAddress();
    error DeadlineInPast();
    error TooEarlyForRefund();
    error FeeTooHigh();

    // ---------------------------------------------------------------------
    // Constructor
    // ---------------------------------------------------------------------

    constructor(
        IERC20 _usdc,
        address _agent,
        uint256 _agentFeeBps,
        address _agentFeeRecipient,
        uint64 _refundGracePeriod
    ) Ownable(msg.sender) {
        if (address(_usdc) == address(0)) revert InvalidAddress();
        if (_agent == address(0))         revert InvalidAddress();
        if (_agentFeeBps > 1000)          revert FeeTooHigh();
        if (_agentFeeBps > 0 && _agentFeeRecipient == address(0)) revert InvalidAddress();

        usdc              = _usdc;
        agent             = _agent;
        agentFeeBps       = _agentFeeBps;
        agentFeeRecipient = _agentFeeRecipient;
        refundGracePeriod = _refundGracePeriod;
    }

    // ---------------------------------------------------------------------
    // Order lifecycle
    // ---------------------------------------------------------------------

    /// @notice Create an order and immediately fund it with USDC.
    /// @dev    The caller (client) must have approved this contract for `amount`
    ///         USDC beforehand.
    function createAndFund(
        address freelancer,
        uint256 amount,
        string calldata brief,
        uint64  deadline
    ) external returns (uint256 orderId) {
        if (freelancer == address(0))            revert InvalidAddress();
        if (amount == 0)                         revert InvalidAmount();
        if (deadline <= block.timestamp)         revert DeadlineInPast();

        orderId = nextOrderId++;
        orders[orderId] = Order({
            client:      msg.sender,
            freelancer:  freelancer,
            amount:      amount,
            brief:       brief,
            deliverable: "",
            deadline:    deadline,
            createdAt:   uint64(block.timestamp),
            status:      Status.Funded
        });

        // Pull USDC from client into escrow.
        usdc.safeTransferFrom(msg.sender, address(this), amount);

        emit OrderFunded(orderId, msg.sender, freelancer, amount, deadline, brief);
    }

    /// @notice Freelancer marks the deliverable as submitted.
    function submitDelivery(uint256 orderId, string calldata deliverable) external {
        Order storage o = orders[orderId];
        if (o.status != Status.Funded)  revert WrongStatus(Status.Funded, o.status);
        if (msg.sender != o.freelancer) revert NotAuthorized();

        o.deliverable = deliverable;
        o.status      = Status.Delivered;
        o.deliveredAt = uint64(block.timestamp);
        emit DeliverySubmitted(orderId, deliverable);
    }

    /// @notice Approve the delivery and release escrowed funds to the freelancer.
    /// @dev    Callable by the client OR the agent (AI verifier wallet).
    function approveAndRelease(uint256 orderId) external {
        Order storage o = orders[orderId];
        if (o.status != Status.Delivered)                     revert WrongStatus(Status.Delivered, o.status);
        if (msg.sender != o.client && msg.sender != agent)    revert NotAuthorized();

        uint256 fee = (o.amount * agentFeeBps) / 10000;
        uint256 net = o.amount - fee;
        o.status    = Status.Released;

        if (fee > 0) {
            usdc.safeTransfer(agentFeeRecipient, fee);
        }
        usdc.safeTransfer(o.freelancer, net);

        emit OrderReleased(orderId, msg.sender, net, fee);
    }

    /// @notice Refund the client if the freelancer never delivered and the
    ///         grace period after the deadline has elapsed.
    /// @dev    Anyone may trigger; funds always go back to the original client.
    function refund(uint256 orderId) external {
        Order storage o = orders[orderId];
        if (o.status != Status.Funded)                                          revert WrongStatus(Status.Funded, o.status);
        if (block.timestamp <= uint256(o.deadline) + uint256(refundGracePeriod)) revert TooEarlyForRefund();

        o.status = Status.Refunded;
        usdc.safeTransfer(o.client, o.amount);
        emit OrderRefunded(orderId);
    }

    /// @notice Finalize a delivery the client never acted on. Once the review
    ///         grace period after delivery has passed, the freelancer (or anyone)
    ///         can trigger payout to the freelancer — so delivered work can never
    ///         lock in escrow forever if the client ghosts.
    function claimDelivered(uint256 orderId) external {
        Order storage o = orders[orderId];
        if (o.status != Status.Delivered)                                          revert WrongStatus(Status.Delivered, o.status);
        if (block.timestamp <= uint256(o.deliveredAt) + uint256(refundGracePeriod)) revert TooEarlyForRefund();

        uint256 fee = (o.amount * agentFeeBps) / 10000;
        uint256 net = o.amount - fee;
        o.status    = Status.Released;

        if (fee > 0) {
            usdc.safeTransfer(agentFeeRecipient, fee);
        }
        usdc.safeTransfer(o.freelancer, net);

        emit OrderReleased(orderId, msg.sender, net, fee);
    }

    // ---------------------------------------------------------------------
    // Admin (Ownable)
    // ---------------------------------------------------------------------

    function setAgent(address newAgent) external onlyOwner {
        if (newAgent == address(0)) revert InvalidAddress();
        emit AgentUpdated(agent, newAgent);
        agent = newAgent;
    }

    function setAgentFee(uint256 newBps, address newRecipient) external onlyOwner {
        if (newBps > 1000) revert FeeTooHigh();
        if (newBps > 0 && newRecipient == address(0)) revert InvalidAddress();
        emit AgentFeeUpdated(agentFeeBps, newBps, agentFeeRecipient, newRecipient);
        agentFeeBps       = newBps;
        agentFeeRecipient = newRecipient;
    }

    function setRefundGracePeriod(uint64 newGrace) external onlyOwner {
        refundGracePeriod = newGrace;
    }

    // ---------------------------------------------------------------------
    // Views
    // ---------------------------------------------------------------------

    function getOrder(uint256 orderId) external view returns (Order memory) {
        return orders[orderId];
    }
}
