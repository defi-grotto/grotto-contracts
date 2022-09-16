//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.4;

import "./interface/storage.interface.sol";
import "../models.sol";
import "hardhat/console.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

contract Storage is StorageInterface, AccessControl {
    bytes32 public constant ADMIN = keccak256("ADMIN_ROLE");

    mapping(uint256 => Lotto) private lottos;
    mapping(uint256 => Pot) private pots;

    uint256 private autoIncrementId;
    uint256[] private completedIds;

    // games that the player played in
    mapping(address => mapping(string => uint256[])) private playerGames;
    // games that the player created
    // creatorGames[creatorAddress][type] e.g creatorGames[0x0]["LOTTO];
    mapping(address => mapping(string => uint256[])) private creatorGames;

    mapping(uint256 => mapping(address => bool)) private isWinner;
    mapping(uint256 => mapping(address => bool)) private isClaimed;

    mapping(uint256 => address[]) private players;
    mapping(address => mapping(uint256 => bool)) private _isPlayer;
    mapping(uint256 => address[]) private winners;

    // games that the player has claimed
    // mapping(address => uint256[]) private userClaims;

    uint256 private platformSharePercentage;
    uint256 private creatorFeesPercentage;
    uint256 private creatorSharesPercentage;

    mapping(address => bool) creators;

    Statistics private stats;

    constructor() {
        platformSharePercentage = 10;
        creatorSharesPercentage = 20;
        creatorFeesPercentage = 10;
        stats = Statistics({
            totalPlayed: 0,
            totalPlayers: 0,
            totalGames: 0,
            totalLotto: 0,
            totalPot: 0,
            totalSingleWinnerPot: 0,
            totalCreators: 0,
            totalCreatorShares: 0,
            totalPlatformShares: 0,
            totalPlayerShares: 0
        });
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _setupRole(ADMIN, msg.sender);
    }

    function grantAdminRole(address who) external override onlyRole(ADMIN) {
        _setupRole(ADMIN, who);
    }

    function getLottoById(uint256 lottoId)
        external
        view
        override
        returns (Lotto memory)
    {
        return lottos[lottoId];
    }

    function isPlayer(address player, uint256 lottoId)
        external
        view
        override
        returns (bool)
    {
        return _isPlayer[player][lottoId];
    }

    function addCreatorGame(
        uint256 lottoId,
        address creator,
        string memory gameType
    ) external override onlyRole(ADMIN) {
        creatorGames[creator][gameType].push(lottoId);
    }

    function getPlayerGames(address player, string memory gameType)
        external
        view
        override
        returns (uint256[] memory)
    {
        return playerGames[player][gameType];
    }

    function getCreatorGames(address creator, string memory gameType)
        external
        view
        override
        returns (uint256[] memory)
    {
        return creatorGames[creator][gameType];
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
        onlyRole(ADMIN)
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

    function getAutoIncrementId()
        external
        override
        onlyRole(ADMIN)
        returns (uint256)
    {
        return ++autoIncrementId;
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
        return isClaimed[lottoId][player];
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

    function setPlayer(
        uint256 lottoId,
        address player,
        string memory gameType
    ) external override onlyRole(ADMIN) {
        players[lottoId].push(player);
        if (_isPlayer[player][lottoId] == false) {
            playerGames[player][gameType].push(lottoId);
        }
        _isPlayer[player][lottoId] = true;
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
        return creatorSharesPercentage;
    }

    function setCreatorSharesPercentage(uint256 csp)
        external
        override
        onlyRole(ADMIN)
    {
        creatorSharesPercentage = csp;
    }

    function getCreatorFeesPercentage()
        external
        view
        override
        returns (uint256)
    {
        return creatorFeesPercentage;
    }

    function setCreatorFeesPercentage(uint256 cf)
        external
        override
        onlyRole(ADMIN)
    {
        creatorFeesPercentage = cf;
    }

    function getStats() external view override returns (Statistics memory) {
        return stats;
    }

    function setStats(Statistics memory _stats)
        external
        override
        onlyRole(ADMIN)
    {
        stats = _stats;
    }

    function isCreator(address _creator) external view override returns (bool) {
        return creators[_creator];
    }

    function setCreator(address _creator) external override onlyRole(ADMIN) {
        creators[_creator] = true;
    }
}
