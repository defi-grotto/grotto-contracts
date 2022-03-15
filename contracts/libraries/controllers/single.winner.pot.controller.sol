//SPDX-License-Identifier: Unlicense
pragma solidity 0.8.4;

import "../models.sol";
import "./base.controller.sol";
import "../errors.sol";
import "hardhat/console.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

contract SingleWinnerPotController is BaseController, AccessControlUpgradeable {
    using SafeMath for uint256;

    // ============================ VARIABLES ============================
    // how much the pot creator is putting up, the pot winner(s) takes this money + all money staked
    mapping(uint256 => mapping(uint256 => bool)) private winningNumbersMap;
    mapping(uint256 => mapping(address => bool)) private winningClaimed;

    // ============================ INITIALIZER ============================
    function initialize() public initializer {
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _setupRole(ADMIN, msg.sender);
        platformSharePercentage = 10;
        creatorFees = 0;
        creatorSharesPercentage = 20;
        autoIncrementId = 0;
    }

    // ============================ GRANTS ============================
    function grantLottoCreator(address _account)
        public
        override
        onlyRole(ADMIN)
    {
        grantRole(LOTTO_CREATOR, _account);
    }

    function grantLottoPlayer(address _account)
        public
        override
        onlyRole(ADMIN)
    {
        grantRole(LOTTO_PLAYER, _account);
    }

    function grantAdmin(address _account) public override onlyRole(ADMIN) {
        grantRole(ADMIN, _account);
    }

    // ============================ MODIFIERS ============================
    modifier is_valid_pot(Pot memory _pot) {
        Pot memory _exists = pots[_pot.lotto.id];
        require(_exists.lotto.creator != _pot.lotto.creator, ERROR_4);
        require(_pot.potAmount > 0, ERROR_11);
        require(_pot.winningNumbers.length > 0, ERROR_12);
        require(_pot.winningNumbers.length <= 10, ERROR_33);
        _;
    }

    // ============================ EXTERNAL METHODS ============================
    function addNewPot(Pot memory _pot)
        external
        override
        onlyRole(LOTTO_CREATOR)
        is_valid_lotto(_pot.lotto)
        is_valid_pot(_pot)
        returns (uint256)
    {
        _pot.lotto.id = ++autoIncrementId;
        for (uint256 i = 0; i < _pot.winningNumbers.length; i = i.add(1)) {
            winningNumbersMap[_pot.lotto.id][_pot.winningNumbers[i]] = true;
        }
        _pot.lotto.status.isPot= true;
        activeIdsMap[_pot.lotto.id] = true;
        allIds.push(_pot.lotto.id);
        return _pot.lotto.id;
    }

    function playPot(
        uint256 _potId,
        uint256 _betPlaced,
        address _player,
        uint256[] memory _guesses
    )
        external
        override
        can_play_lotto(_potId, _betPlaced, _player)
        still_running(_potId)
        onlyRole(LOTTO_PLAYER)
        returns (bool)
    {
        Pot memory _exists = pots[_potId];
        _exists.lotto.stakes = _exists.lotto.stakes.add(_betPlaced);
        _exists.lotto.players[_exists.lotto.players.length] = _player;

        if (!playedIn[_player][_potId]) {
            participated[_player].push(_potId);
            playedIn[_player][_potId] = true;
        }

        checkIfWinner(_potId, _player, _guesses);
        return true;
    }

    function checkIfWinner(
        uint256 _potId,
        address _player,
        uint256[] memory _guesses
    ) private {
        Pot memory _exists = pots[_potId];
        bool _won = true;
        if (_exists.potGuessType == PotGuessType.NUMBERS) {
            // just check that all guesses exists in winning numbers
            for (uint256 i = 0; i < _guesses.length; i = i.add(1)) {
                if (winningNumbersMap[_potId][_guesses[i]] == false) {
                    _won = false;
                    break;
                }
            }
        } else if (_exists.potGuessType == PotGuessType.ORDER) {
            for (uint256 i = 0; i < _guesses.length; i = i.add(1)) {
                if (_guesses[i] != _exists.winningNumbers[i]) {
                    _won = false;
                    break;
                }
            }
        }

        if (_won) {
            _exists.lotto.winner = _player;
            isWinner[_potId][_player] = true;
            _exists.lotto.status.isFinished = true;
        }
    }

    function claimWinning(uint256 _potId, address _claimer)
        external
        override
        returns (Claim memory)
    {
        Pot memory _exists = pots[_potId];
        require(_exists.lotto.startTime <= block.timestamp, ERROR_14);
        require(_exists.lotto.endTime <= block.timestamp, ERROR_22);

        require(isWinner[_potId][_claimer], ERROR_27);
        require(winningClaimed[_potId][_claimer] == false, ERROR_26);

        if (_exists.lotto.status.isClaimed == false) {
            // no one has claimed, calculate winners claims
            uint256 _totalStaked = _exists.lotto.stakes;
            // take platform's share
            uint256 _platformShare = _totalStaked
                .mul(platformSharePercentage)
                .div(100);

            uint256 _totalWinners = 1;
            uint256 _creatorShare = _totalStaked
                .mul(creatorSharesPercentage)
                .div(100);

            if (_totalWinners <= 0) {
                _creatorShare = _totalStaked.sub(_platformShare);
            } else {
                _exists.winningsPerWinner = (
                    _totalStaked.sub(_platformShare).sub(_creatorShare)
                ).div(_totalWinners);
            }

            _exists.lotto.creatorShares = _creatorShare;
            _exists.lotto.platformShares = _platformShare;

            _exists.lotto.status.isClaimed = true;
        }

        winningClaimed[_potId][_claimer] = true;
        _exists.lotto.status.isFinished = true;

        activeIdsMap[_potId] = false;
        completedIds.push(_potId);

        userClaims[_claimer].push(_potId);

        return
            Claim({winner: _claimer, winning: _exists.winningsPerWinner});
    }

    function forceEnd(uint256 _potId)
        external
        override
        view
        onlyRole(ADMIN)
        returns (bool)
    {
        Pot memory _exists = pots[_potId];
        _exists.lotto.endTime = block.timestamp;
        return true;
    }

    function platformClaim(uint256 _potId)
        external
        override
        view
        returns (Claim memory)
    {
        Pot memory _exists = pots[_potId];
        require(_exists.lotto.status.platformClaimed == false, ERROR_37);
        require(_exists.lotto.startTime <= block.timestamp, ERROR_14);
        require(_exists.lotto.endTime <= block.timestamp, ERROR_22);

        _exists.lotto.status.platformClaimed = true;
        return
            Claim({winner: address(0), winning: _exists.lotto.platformShares});
    }

    function creatorClaim(uint256 _potId)
        external
        override
        view
        returns (Claim memory)
    {
        Pot memory _exists = pots[_potId];
        require(_exists.lotto.status.creatorClaimed == false, ERROR_37);
        require(_exists.lotto.startTime <= block.timestamp, ERROR_14);
        require(_exists.lotto.endTime <= block.timestamp, ERROR_22);

        if (_exists.winners.length > 0) {
            require(_exists.lotto.status.isClaimed, ERROR_36);
        } else {
            uint256 _totalStaked = _exists.lotto.stakes;
            uint256 _platformShare = _totalStaked
                .mul(platformSharePercentage)
                .div(100);

            uint256 _creatorShare = _totalStaked
                .mul(creatorSharesPercentage)
                .div(100);

            _creatorShare = _totalStaked.sub(_platformShare);

            _exists.lotto.creatorShares = _creatorShare;
            _exists.lotto.platformShares = _platformShare;
        }

        _exists.lotto.status.creatorClaimed = true;
        return
            Claim({
                winner: _exists.lotto.creator,
                winning: _exists.lotto.creatorShares
            });
    }

    // ============================ EXTERNAL VIEW METHODS ============================
    function isPotId(uint256 _potId) external view override returns (bool) {
        Pot memory _exists = pots[_potId];
        return
            _exists.lotto.id > 0 &&
            _exists.lotto.creator != address(0) &&
            _exists.lotto.status.isPot== true &&
            _exists.potType == PotType.SINGLE_WINNER;
    }

    function getPotById(uint256 _potId)
        external
        view
        override
        returns (Pot memory)
    {
        Pot memory _exists = pots[_potId];
        require(
            _exists.lotto.id > 0 &&
                _exists.lotto.creator != address(0) &&
                _exists.lotto.status.isPot== true &&
                _exists.potType == PotType.MULTIPLE_WINNER,
            ERROR_31
        );
        return _exists;
    }

    function getPotWinning(uint256 _potId) external view returns (uint256) {
        Pot memory _exists = pots[_potId];
        return _exists.winningsPerWinner;
    }
}
