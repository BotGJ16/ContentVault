// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract ContentVault is AccessControl, ReentrancyGuard {
    using Counters for Counters.Counter;
    
    // Roles
    bytes32 public constant CREATOR_ROLE = keccak256("CREATOR_ROLE");
    bytes32 public constant MODERATOR_ROLE = keccak256("MODERATOR_ROLE");
    
    // Platform fee (5%)
    uint256 public constant PLATFORM_FEE = 500; // 5% in basis points
    uint256 public constant BASIS_POINTS = 10000;
    
    // Content structure
    struct Content {
        uint256 id;
        address creator;
        string title;
        string description;
        string walrusBlobId; // Walrus storage blob ID
        string encryptionKey; // Encrypted content key
        uint256 price; // Access price in wei
        bool isPublic;
        uint256 uploadTimestamp;
        uint256 accessExpiration; // 0 for no expiration
        uint256 totalEarnings;
        uint256 accessCount;
        bool isActive;
    }
    
    // Access structure
    struct Access {
        uint256 contentId;
        address user;
        uint256 purchaseTimestamp;
        uint256 expirationTimestamp;
        uint256 pricePaid;
    }
    
    // State variables
    Counters.Counter private _contentIdCounter;
    mapping(uint256 => Content) public contents;
    mapping(address => uint256[]) public creatorContents;
    mapping(uint256 => mapping(address => Access)) public contentAccess;
    mapping(address => uint256) public creatorEarnings;
    mapping(address => bool) public authorizedCreators;
    
    // Platform treasury
    address public treasury;
    uint256 public totalPlatformFees;
    
    // Events
    event ContentUploaded(uint256 indexed contentId, address indexed creator, string title, uint256 price);
    event ContentPurchased(uint256 indexed contentId, address indexed buyer, uint256 price);
    event ContentAccessGranted(uint256 indexed contentId, address indexed user, uint256 expiration);
    event CreatorAuthorized(address indexed creator);
    event CreatorRevoked(address indexed creator);
    event PaymentProcessed(address indexed creator, uint256 amount, uint256 fee);
    event ContentUpdated(uint256 indexed contentId, string newTitle, uint256 newPrice);
    event ContentDeactivated(uint256 indexed contentId);
    
    constructor(address _treasury) {
        require(_treasury != address(0), "Invalid treasury address");
        treasury = _treasury;
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(MODERATOR_ROLE, msg.sender);
    }
    
    // Modifier to check if caller is content creator
    modifier onlyContentCreator(uint256 contentId) {
        require(contents[contentId].creator == msg.sender, "Not content creator");
        _;
    }
    
    // Authorize creator
    function authorizeCreator(address creator) external onlyRole(MODERATOR_ROLE) {
        require(creator != address(0), "Invalid creator address");
        authorizedCreators[creator] = true;
        _grantRole(CREATOR_ROLE, creator);
        emit CreatorAuthorized(creator);
    }
    
    // Revoke creator authorization
    function revokeCreator(address creator) external onlyRole(MODERATOR_ROLE) {
        authorizedCreators[creator] = false;
        _revokeRole(CREATOR_ROLE, creator);
        emit CreatorRevoked(creator);
    }
    
    // Upload content
    function uploadContent(
        string memory title,
        string memory description,
        string memory walrusBlobId,
        string memory encryptionKey,
        uint256 price,
        bool isPublic,
        uint256 accessExpiration
    ) external onlyRole(CREATOR_ROLE) nonReentrant {
        require(bytes(title).length > 0, "Title required");
        require(bytes(walrusBlobId).length > 0, "Walrus blob ID required");
        require(bytes(encryptionKey).length > 0, "Encryption key required");
        
        uint256 contentId = _contentIdCounter.current();
        _contentIdCounter.increment();
        
        contents[contentId] = Content({
            id: contentId,
            creator: msg.sender,
            title: title,
            description: description,
            walrusBlobId: walrusBlobId,
            encryptionKey: encryptionKey,
            price: price,
            isPublic: isPublic,
            uploadTimestamp: block.timestamp,
            accessExpiration: accessExpiration,
            totalEarnings: 0,
            accessCount: 0,
            isActive: true
        });
        
        creatorContents[msg.sender].push(contentId);
        
        emit ContentUploaded(contentId, msg.sender, title, price);
    }
    
    // Purchase content access
    function purchaseContent(uint256 contentId) external payable nonReentrant {
        Content storage content = contents[contentId];
        require(content.isActive, "Content not active");
        require(!content.isPublic, "Content is public");
        require(msg.value >= content.price, "Insufficient payment");
        
        // Calculate platform fee and creator earnings
        uint256 platformFee = (msg.value * PLATFORM_FEE) / BASIS_POINTS;
        uint256 creatorEarning = msg.value - platformFee;
        
        // Update content and creator data
        content.totalEarnings += creatorEarning;
        content.accessCount += 1;
        creatorEarnings[content.creator] += creatorEarning;
        totalPlatformFees += platformFee;
        
        // Grant access
        uint256 expirationTime = content.accessExpiration > 0 
            ? block.timestamp + content.accessExpiration 
            : type(uint256).max;
            
        contentAccess[contentId][msg.sender] = Access({
            contentId: contentId,
            user: msg.sender,
            purchaseTimestamp: block.timestamp,
            expirationTimestamp: expirationTime,
            pricePaid: msg.value
        });
        
        emit ContentPurchased(contentId, msg.sender, msg.value);
        emit ContentAccessGranted(contentId, msg.sender, expirationTime);
        emit PaymentProcessed(content.creator, creatorEarning, platformFee);
    }
    
    // Tip creator
    function tipCreator(uint256 contentId) external payable nonReentrant {
        require(msg.value > 0, "Tip amount must be greater than 0");
        
        Content storage content = contents[contentId];
        require(content.isActive, "Content not active");
        
        // Calculate platform fee and creator earnings
        uint256 platformFee = (msg.value * PLATFORM_FEE) / BASIS_POINTS;
        uint256 creatorEarning = msg.value - platformFee;
        
        // Update earnings
        content.totalEarnings += creatorEarning;
        creatorEarnings[content.creator] += creatorEarning;
        totalPlatformFees += platformFee;
        
        emit PaymentProcessed(content.creator, creatorEarning, platformFee);
    }
    
    // Update content
    function updateContent(
        uint256 contentId,
        string memory newTitle,
        string memory newDescription,
        uint256 newPrice,
        bool newIsPublic
    ) external onlyContentCreator(contentId) {
        Content storage content = contents[contentId];
        require(content.isActive, "Content not active");
        
        if (bytes(newTitle).length > 0) {
            content.title = newTitle;
        }
        if (bytes(newDescription).length > 0) {
            content.description = newDescription;
        }
        content.price = newPrice;
        content.isPublic = newIsPublic;
        
        emit ContentUpdated(contentId, newTitle, newPrice);
    }
    
    // Deactivate content
    function deactivateContent(uint256 contentId) external onlyContentCreator(contentId) {
        contents[contentId].isActive = false;
        emit ContentDeactivated(contentId);
    }
    
    // Check content access
    function hasAccess(uint256 contentId, address user) public view returns (bool) {
        Content storage content = contents[contentId];
        
        if (!content.isActive) return false;
        if (content.isPublic) return true;
        if (content.creator == user) return true;
        
        Access storage access = contentAccess[contentId][user];
        return access.expirationTimestamp > block.timestamp;
    }
    
    // Get content details
    function getContent(uint256 contentId) external view returns (Content memory) {
        return contents[contentId];
    }
    
    // Get creator contents
    function getCreatorContents(address creator) external view returns (uint256[] memory) {
        return creatorContents[creator];
    }
    
    // Get content access details
    function getContentAccess(uint256 contentId, address user) external view returns (Access memory) {
        return contentAccess[contentId][user];
    }
    
    // Withdraw creator earnings
    function withdrawEarnings() external nonReentrant {
        uint256 earnings = creatorEarnings[msg.sender];
        require(earnings > 0, "No earnings to withdraw");
        
        creatorEarnings[msg.sender] = 0;
        (bool success, ) = msg.sender.call{value: earnings}("");
        require(success, "Transfer failed");
    }
    
    // Withdraw platform fees (only admin)
    function withdrawPlatformFees() external onlyRole(DEFAULT_ADMIN_ROLE) nonReentrant {
        uint256 fees = totalPlatformFees;
        require(fees > 0, "No fees to withdraw");
        
        totalPlatformFees = 0;
        (bool success, ) = treasury.call{value: fees}("");
        require(success, "Transfer failed");
    }
    
    // Update treasury address
    function updateTreasury(address newTreasury) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(newTreasury != address(0), "Invalid treasury address");
        treasury = newTreasury;
    }
    
    // Get total content count
    function getTotalContentCount() external view returns (uint256) {
        return _contentIdCounter.current();
    }
    
    // Fallback function to reject direct payments
    receive() external payable {
        revert("Direct payments not accepted");
    }
}