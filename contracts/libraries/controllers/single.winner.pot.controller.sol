//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.4;

import "../models.sol";
import "./base.controller.sol";
import "../errors.sol";
import "./interface/storage.interface.sol";
import "hardhat/console.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

contract SingleWinnerPotController is BaseController, AccessControl {
    using SafeMath for uint256;

    // ============================ VARIABLES ============================
    mapping(uint256 => mapping(uint256 => bool)) private winningNumbersMap;

    StorageInterface private storageController;
    address private storageControllerAddress;

    uint256[] private potIds;
    mapping(uint256 => int256) potIdIndex;
    uint256[] private completedPotIds;

    // ============================ INITIALIZER ============================
    constructor(address _storageControllerAddress) {
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

    // ============================ MODIFIERS ============================
    modifier is_valid_pot(Pot memory _pot) {
        Pot memory _exists = storageController.getPotById(_pot.lotto.id);
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

        storageController.setPot(_pot.lotto.id, _pot);
        storageController.addCreatorGame(
            _pot.lotto.id,
            _pot.lotto.creator,
            "SW_POT"
        );

        potIds.push(_pot.lotto.id);
        potIdIndex[_lotto.id] = int256(potIds.length - 1);

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
                storageController.getPlayers(_potId) <
                    _exists.lotto.maxNumberOfPlayers,
                ERROR_16
            );
        }
        require(_exists.lotto.creator != address(0), ERROR_19);
        require(_exists.lotto.status.isFinished == false, ERROR_17);
        require(_betPlaced >= _exists.lotto.betAmount, ERROR_18);
        require(_player != _exists.lotto.creator, ERROR_21);

        _exists.lotto.stakes = _exists.lotto.stakes.add(_betPlaced);
        storageController.setPlayer(_potId, _player, "SW_POT");

        storageController.setPot(_potId, _exists);

        if (
            _exists.lotto.winningType == WinningType.TIME_BASED &&
            _exists.lotto.endTime <= block.timestamp
        ) {
            finishPot(_potId);
        } else if (
            _exists.lotto.winningType == WinningType.NUMBER_OF_PLAYERS &&
            storageController.getPlayers(_potId) >=
            _exists.lotto.maxNumberOfPlayers
        ) {
            finishPot(_potId);
        }

        checkIfWinner(_potId, _player, _guesses);
        return true;
    }

    function checkIfWinner(
        uint256 _potId,
        address _player,
        uint256[] memory _guesses
    ) private {
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
            _exists.lotto.winner = _player;
            storageController.setWinner(_potId, _player);
            storageController.setIsWinner(_potId, _player, true);
            _exists.lotto.status.isFinished = true;
            uint256 _totalStaked = _exists.lotto.stakes;
            uint256 _creatorShare = _totalStaked
                .mul(storageController.getCreatorSharesPercentage())
                .div(100);

            _exists.lotto.winning = (_totalStaked.sub(_creatorShare));
            _exists.lotto.creatorShares = _creatorShare;
            _exists.lotto.status.isFinished = true;

            removeFromPotIds(_potId);

            storageController.setPot(_potId, _exists);
        }
    }

    function getCreatorWinnings(uint256 _potId)
        public
        view
        override
        returns (Claim memory)
    {
        Pot memory _exists = storageController.getPotById(_potId);

        uint256 _totalStaked = _exists.lotto.stakes;
        uint256 creatorShares = _totalStaked
            .mul(storageController.getCreatorSharesPercentage())
            .div(100);

        if (_exists.lotto.winner == address(0)) {
            creatorShares = _totalStaked;
        }

        return Claim({winner: _exists.lotto.creator, winning: creatorShares});
    }

    function getPlayerWinnings(uint256 _potId, address _claimer)
        public
        view
        override
        returns (Claim memory)
    {
        Pot memory _exists = storageController.getPotById(_potId);
        if (_claimer != _exists.lotto.winner) {
            _claimer = address(0);
        }
        return Claim({winner: _claimer, winning: _exists.lotto.winning});
    }

    function claimWinning(uint256 _potId, address _claimer)
        external
        override
        returns (Claim memory)
    {
        Pot memory _exists = storageController.getPotById(_potId);
        require(
            storageController.getIsClaimed(_potId, _claimer) == false,
            ERROR_23
        );
        require(storageController.getIsWinner(_potId, _claimer), ERROR_27);
        require(_exists.lotto.status.isFinished, ERROR_22);
        require(_exists.lotto.status.isPot, ERROR_19);

        storageController.setIsClaimed(_potId, _claimer, true);

        removeFromPotIds(_potId);

        return
            Claim({
                winner: _exists.lotto.winner,
                winning: _exists.lotto.winning
            });
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

    function creatorClaim(uint256 _potId)
        external
        override
        returns (Claim memory)
    {
        Pot memory _exists = storageController.getPotById(_potId);
        require(_exists.lotto.status.creatorClaimed == false, ERROR_37);

        if (_exists.lotto.status.isFinished == false) {
            if (_exists.lotto.winningType == WinningType.TIME_BASED) {
                require(_exists.lotto.endTime < block.timestamp, ERROR_22);
            } else if (
                _exists.lotto.winningType == WinningType.NUMBER_OF_PLAYERS
            ) {
                require(
                    _exists.lotto.maxNumberOfPlayers ==
                        storageController.getPlayers(_potId),
                    ERROR_22
                );
            }
        }

        uint256 _totalStaked = _exists.lotto.stakes;
        _exists.lotto.creatorShares = _totalStaked
            .mul(storageController.getCreatorSharesPercentage())
            .div(100);

        if (_exists.lotto.winner == address(0)) {
            _exists.lotto.creatorShares = _exists.lotto.stakes;
        }

        _exists.lotto.status.creatorClaimed = true;

        removeFromPotIds(_potId);

        storageController.setIsClaimed(_potId, _exists.lotto.creator, true);
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
            _exists.potType == PotType.SINGLE_WINNER;
    }

    function getAllPots() external view override returns (uint256[] memory) {
        return potIds;
    }

    function getCompletedPots()
        external
        view
        override
        returns (uint256[] memory)
    {
        return completedPotIds;
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
                _exists.potType == PotType.SINGLE_WINNER,
            ERROR_31
        );

        for (uint256 i = 0; i < _exists.winningNumbers.length; i++) {
            _exists.winningNumbers[i] = 0;
        }
        _exists.lotto.players = storageController.getPlayers(_potId);
        return _exists;
    }

    function getPotWinning(uint256 _potId) external view returns (uint256) {
        Pot memory _exists = storageController.getPotById(_potId);
        return _exists.winningsPerWinner;
    }

    // ============================ PRIVATE METHODS ============================
    function removeFromPotIds(uint256 _potId) private {
        int256 index = potIdIndex[_potId];
        if (index >= 0) {
            uint256 lastId = potIds[potIds.length - 1];
            potIds[uint256(index)] = lastId;
            potIdIndex[lastId] = index;
            potIdIndex[_potId] = -1;
            potIds.pop();
            completedPotIds.push(_potId);
        }
    }

    function finishPot(uint256 _potId) private {
        Pot memory _exists = storageController.getPotById(_potId);
        _exists.lotto.status.isFinished = true;
        removeFromPotIds(_potId);

        storageController.setPot(_potId, _exists);
    }    
}
