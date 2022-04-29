//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.4;

import "../models.sol";
import "./base.controller.sol";
import "../errors.sol";
import "hardhat/console.sol";
import "./interface/storage.interface.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

contract PotController is BaseController, AccessControlUpgradeable {
    using SafeMath for uint256;

    // ============================ VARIABLES ============================
    // how much the pot creator is putting up, the pot winner(s) takes this money + all money staked
    mapping(uint256 => mapping(uint256 => bool)) private winningNumbersMap;
    mapping(uint256 => mapping(address => bool)) private winningClaimed;

    StorageInterface private storageController;
    address private storageControllerAddress;

    // ============================ INITIALIZER ============================
    function initialize(address _storageControllerAddress) public initializer {
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _setupRole(ADMIN, msg.sender);
        storageControllerAddress = _storageControllerAddress;
        storageController = StorageInterface(_storageControllerAddress);
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

    // ============================ EXTERNAL METHODS ============================
    function addNewPot(Pot memory _pot)
        external
        override
        onlyRole(LOTTO_CREATOR)
        returns (uint256)
    {
        Lotto memory _lotto = _pot.lotto;
        require(_lotto.betAmount > 0, ERROR_7);

        if (_lotto.winningType == WinningType.TIME_BASED) {
            require(_lotto.startTime < _lotto.endTime, ERROR_6);
            require(_lotto.endTime > block.timestamp, ERROR_10);
        }

        if (_lotto.winningType == WinningType.NUMBER_OF_PLAYERS) {
            require(_lotto.maxNumberOfPlayers > 0, ERROR_8);
        }

        require(_pot.potAmount > 0, ERROR_11);
        require(_pot.winningNumbers.length > 0, ERROR_12);
        require(_pot.winningNumbers.length <= 10, ERROR_33);

        _pot.lotto.id = storageController.getAutoIncrementId();
        for (uint256 i = 0; i < _pot.winningNumbers.length; i = i.add(1)) {
            winningNumbersMap[_pot.lotto.id][_pot.winningNumbers[i]] = true;
        }
        _pot.lotto.status.isPot = true;
        storageController.setId(_pot.lotto.id);

        storageController.setPot(_pot.lotto.id, _pot);
        return _pot.lotto.id;
    }

    function playPot(
        uint256 _potId,
        uint256 _betPlaced,
        address _player,
        uint256[] memory _guesses
    ) external override onlyRole(LOTTO_PLAYER) returns (bool) {
        Pot memory _exists = storageController.getPotById(_potId);

        if (_exists.lotto.winningType == WinningType.TIME_BASED) {
            require(_exists.lotto.startTime <= block.timestamp, ERROR_14);
        } else if (_exists.lotto.winningType == WinningType.NUMBER_OF_PLAYERS) {
            require(
                storageController.getPlayers(_potId).length <
                    _exists.lotto.maxNumberOfPlayers,
                ERROR_16
            );
        }
        require(_exists.lotto.creator != address(0), ERROR_19);
        require(_exists.lotto.status.isFinished == false, ERROR_17);
        require(_betPlaced >= _exists.lotto.betAmount, ERROR_18);
        require(_player != _exists.lotto.creator, ERROR_21);

        _exists.lotto.stakes = _exists.lotto.stakes.add(_betPlaced);
        storageController.setPlayer(_potId, _player);

        storageController.setPot(_potId, _exists);

        checkIfWinner(_potId, _player, _guesses);
        return true;
    }

    function checkIfWinner(
        uint256 _potId,
        address _player,
        uint256[] memory _guesses
    ) internal {
        Pot memory _exists = storageController.getPotById(_potId);
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
            storageController.setIsWinner(_potId, _player, true);
            storageController.setWinner(_potId, _player);
        }

        storageController.setPot(_potId, _exists);
    }

    function claimWinning(uint256 _potId, address _claimer)
        external
        override
        returns (Claim memory)
    {
        Pot memory _exists = storageController.getPotById(_potId);
        if (_exists.lotto.winningType == WinningType.TIME_BASED) {
            require(_exists.lotto.startTime <= block.timestamp, ERROR_14);
            require(_exists.lotto.endTime <= block.timestamp, ERROR_22);
        } else if (_exists.lotto.winningType == WinningType.NUMBER_OF_PLAYERS) {
            require(
                _exists.lotto.maxNumberOfPlayers ==
                    storageController.getPlayers(_potId).length,
                ERROR_22
            );
        }
        require(storageController.getIsWinner(_potId, _claimer), ERROR_27);
        require(winningClaimed[_potId][_claimer] == false, ERROR_26);

        if (_exists.lotto.status.isClaimed == false) {
            // no one has claimed, calculate winners claims
            uint256 _totalStaked = _exists.lotto.stakes;
            // take platform's share
            uint256 _platformShare = _totalStaked
                .mul(storageController.getPlatformSharePercentage())
                .div(100);

            uint256 _totalWinners = storageController.getWinners(_potId).length;

            uint256 _creatorShare = _totalStaked
                .mul(storageController.getCreatorSharesPercentage())
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

        storageController.setCompletedId(_potId);
        storageController.setIsClaimed(_potId, _claimer, true);
        storageController.setPot(_potId, _exists);

        return Claim({winner: _claimer, winning: _exists.winningsPerWinner});
    }

    function forceEnd(uint256 _potId)
        external
        override
        onlyRole(ADMIN)
        returns (bool)
    {
        Pot memory _exists = storageController.getPotById(_potId);
        if (_exists.lotto.winningType == WinningType.TIME_BASED) {
            _exists.lotto.endTime = block.timestamp;
        }

        storageController.setPot(_potId, _exists);
        return true;
    }

    function platformClaim(uint256 _potId)
        external
        override
        returns (Claim memory)
    {
        Pot memory _exists = storageController.getPotById(_potId);
        require(_exists.lotto.status.platformClaimed == false, ERROR_37);
        if (_exists.lotto.winningType == WinningType.TIME_BASED) {
            require(_exists.lotto.startTime <= block.timestamp, ERROR_14);
            require(_exists.lotto.endTime <= block.timestamp, ERROR_22);
        } else if (_exists.lotto.winningType == WinningType.NUMBER_OF_PLAYERS) {
            require(
                _exists.lotto.maxNumberOfPlayers ==
                    storageController.getPlayers(_potId).length,
                ERROR_22
            );
        }

        require(_exists.lotto.status.isClaimed, ERROR_36);

        _exists.lotto.status.platformClaimed = true;

        storageController.setPot(_potId, _exists);
        return
            Claim({winner: address(0), winning: _exists.lotto.platformShares});
    }

    function creatorClaim(uint256 _potId)
        external
        override
        returns (Claim memory)
    {
        Pot memory _exists = storageController.getPotById(_potId);
        require(_exists.lotto.status.creatorClaimed == false, ERROR_37);
        if (_exists.lotto.winningType == WinningType.TIME_BASED) {
            require(_exists.lotto.startTime <= block.timestamp, ERROR_14);
            require(_exists.lotto.endTime <= block.timestamp, ERROR_22);
        } else if (_exists.lotto.winningType == WinningType.NUMBER_OF_PLAYERS) {
            require(
                _exists.lotto.maxNumberOfPlayers ==
                    storageController.getPlayers(_potId).length,
                ERROR_22
            );
        }

        uint256 _totalWinners = storageController.getWinners(_potId).length;
        if (_totalWinners > 0) {
            require(_exists.lotto.status.isClaimed, ERROR_36);
        }

        uint256 _totalStaked = _exists.lotto.stakes;
        uint256 _platformShare = _totalStaked
            .mul(storageController.getPlatformSharePercentage())
            .div(100);

        uint256 _creatorShare = _totalStaked
            .mul(storageController.getCreatorSharesPercentage())
            .div(100);

        _creatorShare = _totalStaked.sub(_platformShare);

        _exists.lotto.creatorShares = _creatorShare;
        _exists.lotto.platformShares = _platformShare;

        _exists.lotto.status.creatorClaimed = true;

        storageController.setPot(_potId, _exists);

        return
            Claim({
                winner: _exists.lotto.creator,
                winning: _exists.lotto.creatorShares
            });
    }

    // ============================ EXTERNAL VIEW METHODS ============================
    function isPotId(uint256 _potId) external view override returns (bool) {
        Pot memory _exists = storageController.getPotById(_potId);
        return
            _exists.lotto.id > 0 &&
            _exists.lotto.creator != address(0) &&
            _exists.lotto.status.isPot == true &&
            _exists.potType == PotType.MULTIPLE_WINNER;
    }

    function getPotById(uint256 _potId)
        external
        view
        override
        returns (Pot memory)
    {
        Pot memory _exists = storageController.getPotById(_potId);
        require(
            _exists.lotto.id > 0 &&
                _exists.lotto.creator != address(0) &&
                _exists.lotto.status.isPot == true &&
                _exists.potType == PotType.MULTIPLE_WINNER,
            ERROR_31
        );
        _exists.winners = storageController.getWinners(_potId);
        _exists.lotto.players = storageController.getPlayers(_potId);
        return _exists;
    }

    function getPotWinning(uint256 _potId) external view returns (uint256) {
        Pot memory _exists = storageController.getPotById(_potId);
        return _exists.winningsPerWinner;
    }
}
