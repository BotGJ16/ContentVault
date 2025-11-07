// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Votes.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract CreatorToken is ERC20, ERC20Votes, AccessControl, ReentrancyGuard {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant BURNER_ROLE = keccak256("BURNER_ROLE");
    
    // Reward rates (tokens per action)
    uint256 public constant CONTENT_UPLOAD_REWARD = 100 * 10**18; // 100 tokens
    uint256 public constant CONTENT_PURCHASE_REWARD = 50 * 10**18; // 50 tokens
    uint256 public constant TIP_CREATOR_REWARD = 25 * 10**18; // 25 tokens
    uint256 public constant DAILY_LOGIN_REWARD = 10 * 10**18; // 10 tokens
    
    // Governance parameters
    uint256 public constant PROPOSAL_THRESHOLD = 1000 * 10**18; // 1000 tokens
    uint256 public constant VOTING_PERIOD = 7 days;
    
    // Daily reward tracking
    mapping(address => uint256) public lastDailyReward;
    mapping(address => bool) public hasReceivedDailyReward;
    
    // Governance proposals
    struct Proposal {
        uint256 id;
        address proposer;
        string title;
        string description;
        uint256 startTime;
        uint256 endTime;
        uint256 forVotes;
        uint256 againstVotes;
        uint256 abstainVotes;
        bool executed;
        mapping(address => bool) hasVoted;
    }
    
    Counters.Counter private _proposalIdCounter;
    mapping(uint256 => Proposal) public proposals;
    mapping(address => uint256[]) public userProposals;
    
    // Events
    event TokensMinted(address indexed to, uint256 amount, string reason);
    event TokensBurned(address indexed from, uint256 amount, string reason);
    event DailyRewardClaimed(address indexed user, uint256 amount);
    event ProposalCreated(uint256 indexed proposalId, address indexed proposer, string title);
    event VoteCast(uint256 indexed proposalId, address indexed voter, bool support, uint256 weight);
    event ProposalExecuted(uint256 indexed proposalId);
    
    constructor() ERC20("CreatorToken", "CTV") ERC20Permit("CreatorToken") {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(MINTER_ROLE, msg.sender);
        _grantRole(BURNER_ROLE, msg.sender);
        
        // Initial supply for treasury and development
        _mint(msg.sender, 1000000 * 10**18); // 1M tokens
    }
    
    // Mint tokens for content upload
    function mintForContentUpload(address creator) external onlyRole(MINTER_ROLE) nonReentrant {
        _mint(creator, CONTENT_UPLOAD_REWARD);
        emit TokensMinted(creator, CONTENT_UPLOAD_REWARD, "Content Upload");
    }
    
    // Mint tokens for content purchase
    function mintForContentPurchase(address buyer) external onlyRole(MINTER_ROLE) nonReentrant {
        _mint(buyer, CONTENT_PURCHASE_REWARD);
        emit TokensMinted(buyer, CONTENT_PURCHASE_REWARD, "Content Purchase");
    }
    
    // Mint tokens for tipping
    function mintForTip(address tipper) external onlyRole(MINTER_ROLE) nonReentrant {
        _mint(tipper, TIP_CREATOR_REWARD);
        emit TokensMinted(tipper, TIP_CREATOR_REWARD, "Creator Tip");
    }
    
    // Claim daily reward
    function claimDailyReward() external nonReentrant {
        require(!hasReceivedDailyReward[msg.sender] || 
                block.timestamp >= lastDailyReward[msg.sender] + 1 days, 
                "Daily reward already claimed");
        
        hasReceivedDailyReward[msg.sender] = true;
        lastDailyReward[msg.sender] = block.timestamp;
        
        _mint(msg.sender, DAILY_LOGIN_REWARD);
        emit DailyRewardClaimed(msg.sender, DAILY_LOGIN_REWARD);
    }
    
    // Create governance proposal
    function createProposal(
        string memory title,
        string memory description
    ) external returns (uint256) {
        require(balanceOf(msg.sender) >= PROPOSAL_THRESHOLD, "Insufficient tokens for proposal");
        
        uint256 proposalId = _proposalIdCounter.current();
        _proposalIdCounter.increment();
        
        Proposal storage proposal = proposals[proposalId];
        proposal.id = proposalId;
        proposal.proposer = msg.sender;
        proposal.title = title;
        proposal.description = description;
        proposal.startTime = block.timestamp;
        proposal.endTime = block.timestamp + VOTING_PERIOD;
        
        userProposals[msg.sender].push(proposalId);
        
        emit ProposalCreated(proposalId, msg.sender, title);
        return proposalId;
    }
    
    // Vote on proposal
    function vote(uint256 proposalId, bool support) external {
        Proposal storage proposal = proposals[proposalId];
        require(block.timestamp >= proposal.startTime, "Voting not started");
        require(block.timestamp <= proposal.endTime, "Voting ended");
        require(!proposal.hasVoted[msg.sender], "Already voted");
        require(balanceOf(msg.sender) > 0, "No voting power");
        
        uint256 votingPower = balanceOf(msg.sender);
        proposal.hasVoted[msg.sender] = true;
        
        if (support) {
            proposal.forVotes += votingPower;
        } else {
            proposal.againstVotes += votingPower;
        }
        
        emit VoteCast(proposalId, msg.sender, support, votingPower);
    }
    
    // Execute proposal (simplified - in real implementation would have actual execution logic)
    function executeProposal(uint256 proposalId) external {
        Proposal storage proposal = proposals[proposalId];
        require(block.timestamp > proposal.endTime, "Voting not ended");
        require(!proposal.executed, "Already executed");
        require(proposal.forVotes > proposal.againstVotes, "Proposal rejected");
        
        proposal.executed = true;
        emit ProposalExecuted(proposalId);
    }
    
    // Get proposal details
    function getProposal(uint256 proposalId) external view returns (
        uint256 id,
        address proposer,
        string memory title,
        string memory description,
        uint256 startTime,
        uint256 endTime,
        uint256 forVotes,
        uint256 againstVotes,
        uint256 abstainVotes,
        bool executed
    ) {
        Proposal storage proposal = proposals[proposalId];
        return (
            proposal.id,
            proposal.proposer,
            proposal.title,
            proposal.description,
            proposal.startTime,
            proposal.endTime,
            proposal.forVotes,
            proposal.againstVotes,
            proposal.abstainVotes,
            proposal.executed
        );
    }
    
    // Get user's proposals
    function getUserProposals(address user) external view returns (uint256[] memory) {
        return userProposals[user];
    }
    
    // Check if user can vote
    function canVote(uint256 proposalId, address user) external view returns (bool) {
        Proposal storage proposal = proposals[proposalId];
        return block.timestamp >= proposal.startTime && 
               block.timestamp <= proposal.endTime && 
               !proposal.hasVoted[user] && 
               balanceOf(user) > 0;
    }
    
    // Burn tokens
    function burn(uint256 amount) external onlyRole(BURNER_ROLE) {
        _burn(msg.sender, amount);
        emit TokensBurned(msg.sender, amount, "User burn");
    }
    
    // Required overrides for ERC20Votes
    function _afterTokenTransfer(
        address from,
        address to,
        uint256 amount
    ) internal override(ERC20, ERC20Votes) {
        super._afterTokenTransfer(from, to, amount);
    }
    
    function _mint(address to, uint256 amount) internal override(ERC20, ERC20Votes) {
        super._mint(to, amount);
    }
    
    function _burn(address account, uint256 amount) internal override(ERC20, ERC20Votes) {
        super._burn(account, amount);
    }
}