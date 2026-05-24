// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title FreelanceEscrow - milestone escrow for freelancer payouts in USDC
/// @notice MVP scaffold for the FreelanceBot submission. Full implementation in week 2.
contract FreelanceEscrow {
    enum Status { None, Funded, Delivered, Released, Refunded }

    struct Order {
        address client;
        address freelancer;
        uint256 amount;
        string  brief;        // free-text or IPFS hash
        uint64  deadline;     // unix ts
        Status  status;
    }

    address public immutable usdc;
    uint256 public nextOrderId;
    mapping(uint256 => Order) public orders;

    event OrderCreated(uint256 indexed id, address client, address freelancer, uint256 amount);
    event OrderFunded(uint256 indexed id);
    event Delivered(uint256 indexed id, string deliverable);
    event Released(uint256 indexed id);
    event Refunded(uint256 indexed id);

    constructor(address _usdc) {
        usdc = _usdc;
    }

    // TODO week 2: createOrder, fundOrder (USDC transferFrom), markDelivered,
    // release (only client or agent), refund (deadline-gated).
}
