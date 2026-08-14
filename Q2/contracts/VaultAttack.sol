// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract SimpleERC20 {
    address public admin;
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);

    constructor() {
        admin = msg.sender;
    }

    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin can call this function!");
        _;
    }

    function mint(address to, uint256 amount) external onlyAdmin {
        balanceOf[to] += amount;
        emit Transfer(address(0), to, amount);
    }

    function approve(address spender, uint256 amount)
        external
        returns (bool)
    {
        allowance[msg.sender][spender] = amount;
        emit Approval(msg.sender, spender, amount);
        return true;
    }

    function transfer(address to, uint256 amount)
        external
        returns (bool)
    {
        require(
            balanceOf[msg.sender] >= amount,
            "Insufficient balance!"
        );

        balanceOf[msg.sender] -= amount;
        balanceOf[to] += amount;

        emit Transfer(msg.sender, to, amount);
        return true;
    }

    function transferFrom(
        address from,
        address to,
        uint256 amount
    ) external returns (bool) {
        require(
            balanceOf[from] >= amount,
            "Insufficient balance!"
        );

        require(
            allowance[from][msg.sender] >= amount,
            "Insufficient allowance!"
        );

        balanceOf[from] -= amount;
        balanceOf[to] += amount;
        allowance[from][msg.sender] -= amount;

        emit Transfer(from, to, amount);
        return true;
    }
}


contract TheVault {
    SimpleERC20 public immutable depositToken;
    mapping(address => uint256) public shareBalance;
    uint256 public totalShares;

    constructor(address _depositToken) {
        depositToken = SimpleERC20(_depositToken);
    }

    function deposit(uint256 amount)
        external
        returns (uint256 shares)
    {
        require(amount > 0, "Amount must be > 0!");

        uint256 totalAssets =
            depositToken.balanceOf(address(this));

        if (totalShares == 0) {
            // first investor
            shares = amount;
        } else {
            shares =
                (amount * totalShares) / totalAssets;
        }

        require(shares > 0, "Zero shares minted!");

        require(
            depositToken.transferFrom(
                msg.sender,
                address(this),
                amount
            )
        );

        shareBalance[msg.sender] += shares;
        totalShares += shares;
    }

    function withdraw(uint256 shares)
        external
        returns (uint256 amount)
    {
        require(shares > 0, "Shares must be > 0!");

        require(
            shareBalance[msg.sender] >= shares,
            "Not enough shares!"
        );

        uint256 totalAssets =
            depositToken.balanceOf(address(this));

        amount =
            (shares * totalAssets) / totalShares;

        shareBalance[msg.sender] -= shares;
        totalShares -= shares;

        require(
            depositToken.transfer(msg.sender, amount)
        );
    }
}
contract TheVaultFixed {
    SimpleERC20 public immutable depositToken;

    mapping(address => uint256) public shareBalance;

    uint256 public totalShares;

    // Internal accounting:
    // Direct transfers do not change this value.
    uint256 public totalManagedAssets;

    constructor(address _depositToken) {
        depositToken = SimpleERC20(_depositToken);
    }

    function deposit(uint256 amount)
        external
        returns (uint256 shares)
    {
        require(amount > 0, "Amount must be > 0!");

        // First investor
        if (totalShares == 0) {
            shares = amount;
        } else {
            // IMPORTANT:
            // Use internal accounting, not token.balanceOf(address(this))
            shares =
                (amount * totalShares) /
                totalManagedAssets;
        }

        require(shares > 0, "Zero shares minted!");

        require(
            depositToken.transferFrom(
                msg.sender,
                address(this),
                amount
            )
        );

        // Update internal accounting only through deposit
        totalManagedAssets += amount;

        shareBalance[msg.sender] += shares;
        totalShares += shares;
    }

    function withdraw(uint256 shares)
        external
        returns (uint256 amount)
    {
        require(shares > 0, "Shares must be > 0!");

        require(
            shareBalance[msg.sender] >= shares,
            "Not enough shares!"
        );

        // IMPORTANT:
        // Use internal accounting
        amount =
            (shares * totalManagedAssets) /
            totalShares;

        shareBalance[msg.sender] -= shares;
        totalShares -= shares;

        // Update accounting before/with withdrawal
        totalManagedAssets -= amount;

        require(
            depositToken.transfer(msg.sender, amount)
        );
    }
}