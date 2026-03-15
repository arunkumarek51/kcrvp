// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

/**
 * @title KCRVPCarbonRegistry
 * @dev Kerala Carbon Registry and Verification Platform - On-chain Carbon Credit NFTs
 * @notice Each NFT represents a verified carbon credit from Kerala green activities
 * Deploy on Polygon Mumbai testnet for demo, Polygon mainnet for production
 */
contract KCRVPCarbonRegistry is ERC721URIStorage, Ownable {
    using Counters for Counters.Counter;

    Counters.Counter private _tokenIdCounter;

    // ── Structs ──────────────────────────────────────────────────────────────

    struct CarbonCredit {
        uint256 tokenId;
        address owner;
        uint256 co2AmountGrams;      // CO2 offset in grams (e.g. 22000 = 22 kg)
        uint256 carbonCredits;        // in milliCredits (1000 = 1 credit = 1000 kg CO2)
        ActivityType activityType;
        string  activityId;           // MongoDB activity ID for cross-reference
        string  district;             // Kerala district
        uint256 issuedAt;
        uint256 vintage;              // Year of carbon offset
        bool    retired;
        address retiredBy;
        uint256 retiredAt;
    }

    enum ActivityType {
        TREE_PLANTING,
        SOLAR_ENERGY,
        EV_DRIVING,
        ORGANIC_FARMING
    }

    // ── State ─────────────────────────────────────────────────────────────────

    mapping(uint256 => CarbonCredit) public credits;
    mapping(address => uint256[])    public ownerCredits;
    mapping(string  => uint256)      public activityToToken; // activityId → tokenId

    // Platform stats
    uint256 public totalCo2OffsetGrams;
    uint256 public totalCreditsIssued;
    uint256 public totalCreditsRetired;

    // Authorized issuers (auditors / platform)
    mapping(address => bool) public authorizedIssuers;

    // ── Events ────────────────────────────────────────────────────────────────

    event CreditIssued(
        uint256 indexed tokenId,
        address indexed owner,
        uint256 co2AmountGrams,
        uint256 carbonCredits,
        ActivityType activityType,
        string activityId,
        uint256 vintage
    );

    event CreditTransferred(
        uint256 indexed tokenId,
        address indexed from,
        address indexed to,
        uint256 carbonCredits
    );

    event CreditRetired(
        uint256 indexed tokenId,
        address indexed retiredBy,
        uint256 carbonCredits,
        string reason
    );

    event IssuerUpdated(address indexed issuer, bool authorized);

    // ── Modifiers ─────────────────────────────────────────────────────────────

    modifier onlyIssuer() {
        require(
            msg.sender == owner() || authorizedIssuers[msg.sender],
            "KCRVP: Not authorized issuer"
        );
        _;
    }

    modifier creditExists(uint256 tokenId) {
        require(_exists(tokenId), "KCRVP: Credit does not exist");
        _;
    }

    modifier notRetired(uint256 tokenId) {
        require(!credits[tokenId].retired, "KCRVP: Credit already retired");
        _;
    }

    // ── Constructor ───────────────────────────────────────────────────────────

    constructor(address initialOwner)
        ERC721("KCRVP Carbon Credit", "KCRVP")
        Ownable(initialOwner)
    {}

    // ── Issuer Management ─────────────────────────────────────────────────────

    function setIssuer(address issuer, bool authorized) external onlyOwner {
        authorizedIssuers[issuer] = authorized;
        emit IssuerUpdated(issuer, authorized);
    }

    // ── Core Functions ────────────────────────────────────────────────────────

    /**
     * @dev Issue a new carbon credit NFT
     * @param recipient     Wallet address of the credit recipient
     * @param co2Grams      CO2 offset in grams
     * @param activityType  Type of green activity
     * @param activityId    MongoDB activity document ID
     * @param district      Kerala district name
     * @param vintage       Year of carbon offset
     * @param tokenURI_     IPFS metadata URI
     */
    function issueCredit(
        address recipient,
        uint256 co2Grams,
        ActivityType activityType,
        string calldata activityId,
        string calldata district,
        uint256 vintage,
        string calldata tokenURI_
    ) external onlyIssuer returns (uint256) {
        require(recipient != address(0), "KCRVP: Invalid recipient");
        require(co2Grams > 0, "KCRVP: CO2 amount must be > 0");
        require(bytes(activityId).length > 0, "KCRVP: Activity ID required");
        require(activityToToken[activityId] == 0, "KCRVP: Activity already tokenized");

        _tokenIdCounter.increment();
        uint256 tokenId = _tokenIdCounter.current();

        // 1,000,000 grams CO2 = 1 carbon credit (1000 kg)
        uint256 milliCredits = co2Grams / 1000; // milliCredits: 1000 = 1 credit

        credits[tokenId] = CarbonCredit({
            tokenId:        tokenId,
            owner:          recipient,
            co2AmountGrams: co2Grams,
            carbonCredits:  milliCredits,
            activityType:   activityType,
            activityId:     activityId,
            district:       district,
            issuedAt:       block.timestamp,
            vintage:        vintage,
            retired:        false,
            retiredBy:      address(0),
            retiredAt:      0
        });

        activityToToken[activityId] = tokenId;
        ownerCredits[recipient].push(tokenId);

        // Update platform stats
        totalCo2OffsetGrams += co2Grams;
        totalCreditsIssued  += milliCredits;

        _safeMint(recipient, tokenId);
        _setTokenURI(tokenId, tokenURI_);

        emit CreditIssued(tokenId, recipient, co2Grams, milliCredits, activityType, activityId, vintage);

        return tokenId;
    }

    /**
     * @dev Retire a carbon credit (permanently remove from circulation)
     * Companies call this to claim they've offset their emissions.
     */
    function retireCredit(uint256 tokenId, string calldata reason)
        external
        creditExists(tokenId)
        notRetired(tokenId)
    {
        require(ownerOf(tokenId) == msg.sender, "KCRVP: Not credit owner");

        CarbonCredit storage credit = credits[tokenId];
        credit.retired   = true;
        credit.retiredBy = msg.sender;
        credit.retiredAt = block.timestamp;

        totalCreditsRetired += credit.carbonCredits;

        emit CreditRetired(tokenId, msg.sender, credit.carbonCredits, reason);
    }

    // ── View Functions ────────────────────────────────────────────────────────

    function getCredit(uint256 tokenId)
        external
        view
        creditExists(tokenId)
        returns (CarbonCredit memory)
    {
        return credits[tokenId];
    }

    function getOwnerCredits(address user)
        external
        view
        returns (uint256[] memory)
    {
        return ownerCredits[user];
    }

    function getTokenByActivity(string calldata activityId)
        external
        view
        returns (uint256)
    {
        return activityToToken[activityId];
    }

    function getPlatformStats()
        external
        view
        returns (
            uint256 totalTokens,
            uint256 totalCo2Kg,
            uint256 issued,
            uint256 retired
        )
    {
        return (
            _tokenIdCounter.current(),
            totalCo2OffsetGrams / 1000,
            totalCreditsIssued,
            totalCreditsRetired
        );
    }

    function getCo2ByType(uint256 tokenId)
        external
        view
        creditExists(tokenId)
        returns (string memory typeName, uint256 co2Kg)
    {
        CarbonCredit memory c = credits[tokenId];
        string[4] memory names = ["Tree Planting","Solar Energy","EV Driving","Organic Farming"];
        return (names[uint256(c.activityType)], c.co2AmountGrams / 1000);
    }

    // ── Override ──────────────────────────────────────────────────────────────

    function _update(address to, uint256 tokenId, address auth)
        internal
        override
        returns (address)
    {
        address from = super._update(to, tokenId, auth);

        // Update owner tracking
        if (from != address(0) && to != address(0) && from != to) {
            credits[tokenId].owner = to;
            ownerCredits[to].push(tokenId);
            // Note: doesn't remove from 'from' array for gas efficiency
            // Use getOwnerCredits() filtered by ownerOf() for accurate balance

            emit CreditTransferred(tokenId, from, to, credits[tokenId].carbonCredits);
        }

        return from;
    }
}
