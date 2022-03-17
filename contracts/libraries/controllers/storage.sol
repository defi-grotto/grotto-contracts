//SPDX-License-Identifier: Unlicense
pragma solidity 0.8.4;

import "./interface/storage.interface.sol";
import "../models.sol";
import "hardhat/console.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";

contract Storage is StorageInterface, AccessControlUpgradeable {
    bytes32 public constant ADMIN = keccak256("ADMIN_ROLE");

    mapping(uint256 => Lotto) private lottos;
    mapping(uint256 => Pot) private pots;

    uint256 private autoIncrementId;
    uint256[] private completedIds;
    uint256[] private allIds;

    // games that the player played in
    mapping(uint256 => mapping(address => bool)) private isWinner;
    mapping(uint256 => mapping(address => bool)) private isClaimed;

    mapping(uint256 => address[]) private players;
    mapping(uint256 => address[]) private winners;

    // games that the player has claimed
    // mapping(address => uint256[]) private userClaims;

    uint256 private platformSharePercentage = 10;
    uint256 private creatorFees = 0;
    uint256 private creatorSharesPercentage = 20;

    function initialize() public initializer {
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _setupRole(ADMIN, msg.sender);
    }

    function getLottoById(uint256 lottoId)
        external
        view
        override
        returns (Lotto memory)
    {
        return lottos[lottoId];
    }

    function setLotto(uint256 lottoId, Lotto memory lotto)
        external
        override
        onlyRole(ADMIN)
    {
        lottos[lottoId] = lotto;
    }

    function getPotById(uint256 potId)
        external
        view
        override
        returns (Pot memory)
    {
        return pots[potId];
    }

    function setPot(uint256 potId, Pot memory pot)
        external
        override
        onlyRole(ADMIN)
    {
        pots[potId] = pot;
    }

    function getCompletedLottos()
        external
        view
        override
        returns (uint256[] memory)
    {
        return completedIds;
    }

    function getAutoIncrementId()
        external        
        override
        onlyRole(ADMIN)
        returns (uint256)
    {
        return ++autoIncrementId;
    }

    function getCompletedIds()
        external
        view
        override
        returns (uint256[] memory)
    {
        return completedIds;
    }

    function setCompletedId(uint256 lottoId) external override onlyRole(ADMIN) {
        completedIds.push(lottoId);
    }

    function setId(uint256 lottoId) external override onlyRole(ADMIN) {
        allIds.push(lottoId);
    }

    function getAllIds() external view override returns (uint256[] memory) {
        return allIds;
    }

    function getIsWinner(uint256 lottoId, address player)
        external
        view
        override
        returns (bool)
    {
        return isWinner[lottoId][player];
    }

    function setIsWinner(
        uint256 lottoId,
        address player,
        bool _isWinner
    ) external override onlyRole(ADMIN) {
        isWinner[lottoId][player] = _isWinner;
    }

    function getIsClaimed(uint256 lottoId, address player)
        external
        view
        override
        returns (bool)
    {
        return isWinner[lottoId][player];
    }

    function setIsClaimed(
        uint256 lottoId,
        address player,
        bool _isClaimed
    ) external override onlyRole(ADMIN) {
        isClaimed[lottoId][player] = _isClaimed;
    }

    function getPlayers(uint256 lottoId)
        external
        view
        override
        returns (address[] memory)
    {
        return players[lottoId];
    }

    function setPlayer(uint256 lottoId, address player)
        external
        override
        onlyRole(ADMIN)
    {
        players[lottoId].push(player);
    }

    function getWinners(uint256 lottoId)
        external
        view
        override
        returns (address[] memory)
    {
        return winners[lottoId];
    }

    function setWinner(uint256 lottoId, address player)
        external
        override
        onlyRole(ADMIN)
    {
        winners[lottoId].push(player);
    }

    // uint256 private platformSharePercentage;
    // uint256 private creatorFees;
    // uint256 private creatorSharesPercentage;

    function getPlatformSharePercentage()
        external
        view
        override
        returns (uint256)
    {
        return platformSharePercentage;
    }

    function setPlatformSharePercentage(uint256 psp)
        external
        override
        onlyRole(ADMIN)
    {
        platformSharePercentage = psp;
    }

    function getCreatorSharesPercentage()
        external
        view
        override
        returns (uint256)
    {
        return platformSharePercentage;
    }

    function setCreatorSharesPercentage(uint256 csp)
        external
        override
        onlyRole(ADMIN)
    {
        platformSharePercentage = csp;
    }

    function getCreatorFees() external view override returns (uint256) {
        return creatorFees;
    }

    function setCreatorFees(uint256 cf) external override onlyRole(ADMIN) {
        creatorFees = cf;
    }
}
