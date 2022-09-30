//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.4;

import "../models.sol";
import "./base.controller.sol";
import "../errors.sol";
import "./interface/storage.interface.sol";
import "hardhat/console.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

contract LottoController is BaseController, AccessControl {
    using SafeMath for uint256;

    StorageInterface private storageController;
    address private storageControllerAddress;

    uint256[] private lottoIds;
    mapping(uint256 => int256) lottoIdIndex;

    uint256[] private completedLottoIds;

    // ============================ INITIALIZER ============================
    constructor(address _storageControllerAddress) {
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _setupRole(ADMIN, msg.sender);
        storageControllerAddress = _storageControllerAddress;
        storageController = StorageInterface(_storageControllerAddress);
    }

    // ============================ GRANTS ============================
    function grantLottoCreator(address account)
        public
        override
        onlyRole(ADMIN)
    {
        grantRole(LOTTO_CREATOR, account);
    }

    function grantLottoPlayer(address account) public override onlyRole(ADMIN) {
        grantRole(LOTTO_PLAYER, account);
    }

    function grantAdmin(address account) public override onlyRole(ADMIN) {
        grantRole(ADMIN, account);
    }

    // ============================ EXTERNAL METHODS ============================
    function addNewLotto(Lotto memory _lotto)
        external
        override
        onlyRole(LOTTO_CREATOR)
        returns (uint256)
    {
        require(_lotto.betAmount > 0, ERROR_7);

        if (_lotto.winningType == WinningType.TIME_BASED) {
            require(_lotto.startTime < _lotto.endTime, ERROR_6);
            require(_lotto.endTime > block.timestamp, ERROR_10);
        }

        if (_lotto.winningType == WinningType.NUMBER_OF_PLAYERS) {
            require(_lotto.maxNumberOfPlayers > 0, ERROR_8);
        }

        _lotto.id = storageController.getAutoIncrementId();
        _lotto.status.isPot = false;

        storageController.setLotto(_lotto.id, _lotto);
        storageController.addCreatorGame(_lotto.id, _lotto.creator, "LOTTO");

        lottoIds.push(_lotto.id);
        lottoIdIndex[_lotto.id] = int256(lottoIds.length - 1);

        return _lotto.id;
    }

    // ============================ EXTERNAL VIEW METHODS ============================
    function isLottoId(uint256 _lottoId) external view override returns (bool) {
        Lotto memory _exists = storageController.getLottoById(_lottoId);
        return
            _exists.id > 0 &&
            _exists.creator != address(0) &&
            _exists.status.isPot == false;
    }

    function getAllLottos() external view override returns (uint256[] memory) {
        return lottoIds;
    }

    function getCompletedLottos()
        external
        view
        override
        returns (uint256[] memory)
    {
        return completedLottoIds;
    }

    function getLottoById(uint256 _lottoId)
        external
        view
        override
        returns (Lotto memory)
    {
        Lotto memory _exists = storageController.getLottoById(_lottoId);
        require(
            _exists.id > 0 &&
                _exists.creator != address(0) &&
                _exists.status.isPot == false,
            ERROR_32
        );
        _exists.players = storageController.getPlayers(_lottoId);
        return _exists;
    }

    // ============================ EXTERNAL METHODS ============================
    function getCreatorWinnings(uint256 _lottoId)
        public
        view
        override
        returns (Claim memory)
    {
        Lotto memory _exists = storageController.getLottoById(_lottoId);
        if (_exists.winner == address(0)) {
            _exists.creatorShares = _exists.stakes;
        }
        return Claim({winner: _exists.creator, winning: _exists.creatorShares});
    }

    function getPlayerWinnings(uint256 _lottoId, address _claimer)
        public
        view
        override
        returns (Claim memory)
    {                
        Lotto memory _exists = storageController.getLottoById(_lottoId);

        if(_claimer != _exists.winner){
            _claimer = address(0);
        }

        return Claim({winner: _claimer, winning: _exists.winning});
    }

    function creatorClaim(uint256 _lottoId)
        external
        virtual
        override
        returns (Claim memory)
    {
        Lotto memory _exists = storageController.getLottoById(_lottoId);
        require(!_exists.status.isPot, ERROR_19);
        require(_exists.status.creatorClaimed == false, ERROR_37);

        if (_exists.winningType == WinningType.TIME_BASED) {
            require(_exists.endTime < block.timestamp, ERROR_22);
        } else if (_exists.winningType == WinningType.NUMBER_OF_PLAYERS) {
            require(
                _exists.maxNumberOfPlayers ==
                    storageController.getPlayers(_lottoId),
                ERROR_22
            );
        }

        if (_exists.winner == address(0)) {
            _exists.creatorShares = _exists.stakes;
        }

        removeFromLottoIds(_lottoId);
        _exists.status.isFinished = true;
        _exists.status.creatorClaimed = true;

        storageController.setIsClaimed(_lottoId, _exists.creator, true);

        storageController.setLotto(_lottoId, _exists);
        return Claim({winner: _exists.creator, winning: _exists.creatorShares});
    }

    function claimWinning(uint256 _lottoId, address _claimer)
        external
        override
        returns (Claim memory)
    {
        Lotto memory _exists = storageController.getLottoById(_lottoId);
        require(_exists.status.isFinished, ERROR_22);
        require(!_exists.status.isPot, ERROR_19);
        require(storageController.getIsWinner(_lottoId, _claimer), ERROR_27);
        require(
            storageController.getIsClaimed(_lottoId, _claimer) == false,
            ERROR_23
        );

        storageController.setIsClaimed(_lottoId, _claimer, true);

        removeFromLottoIds(_lottoId);
        return Claim({winner: _exists.winner, winning: _exists.winning});
    }

    function playLotto(
        uint256 _lottoId,
        uint256 _betPlaced,
        address _player
    ) external override onlyRole(LOTTO_PLAYER) returns (bool) {
        Lotto memory _exists = storageController.getLottoById(_lottoId);

        require(_exists.creator != address(0), ERROR_19);
        require(_exists.status.isFinished == false, ERROR_17);
        require(_betPlaced >= _exists.betAmount, ERROR_18);
        require(_player != _exists.creator, ERROR_21);
        require(_exists.startTime < block.timestamp, ERROR_14);

        if (
            _exists.winningType == WinningType.TIME_BASED &&
            _exists.endTime < block.timestamp
        ) {
            findLottoWinner(_lottoId);
        } else {
            _exists.stakes = _exists.stakes.add(_betPlaced);

            storageController.setPlayer(_lottoId, _player, "LOTTO");

            storageController.setLotto(_lottoId, _exists);
            findLottoWinner(_lottoId);
        }

        return true;
    }

    // TODO: Remove this
    function endLotto(uint256 _lottoId, address _caller)
        external
        override
        onlyRole(ADMIN)
        returns (bool)
    {
        Lotto memory _exists = storageController.getLottoById(_lottoId);
        // lotto must have ended
        require(
            _exists.winningType == WinningType.TIME_BASED &&
                _exists.endTime < block.timestamp,
            ERROR_22
        );

        bool _canEndLotto = false;
        if (_caller == _exists.creator) {
            _canEndLotto = true;
        } else if (storageController.isPlayer(_caller, _lottoId)) {
            _canEndLotto = true;
        }

        if (_canEndLotto) {
            removeFromLottoIds(_lottoId);
            return true;
        }

        return false;
    }

    function forceEnd(uint256 _lottoId)
        external
        override
        onlyRole(ADMIN)
        returns (bool)
    {
        Lotto memory _exists = storageController.getLottoById(_lottoId);
        _exists.endTime = block.timestamp;
        storageController.setLotto(_lottoId, _exists);
        return true;
    }

    // ============================ PRIVATE METHODS ============================
    function removeFromLottoIds(uint256 _lottoId) private {
        /**
            Say we have lottoIds = [3,4,5,6], lottoIdIndex = [3:0, 4:1, 5:2, 6:3]
            Say we want to remove _lottoId = 5
            index = 2
            lastIndex = 3
            lastId = 6
            lottoIds[2] = 6
            lottoIdIndex[6] = 2;
            lottoIds.pop = [3, 4, 6], lottoIdIndex = [3:0, 4:1, 6:2, 6:3]
         */
        int256 index = lottoIdIndex[_lottoId];
        if (index >= 0) {
            uint256 lastId = lottoIds[lottoIds.length - 1];
            lottoIds[uint256(index)] = lastId;
            lottoIdIndex[lastId] = index;
            lottoIdIndex[_lottoId] = -1;
            lottoIds.pop();
            completedLottoIds.push(_lottoId);
        }
    }

    function findLottoWinner(uint256 _lottoId) private {
        Lotto memory _exists = storageController.getLottoById(_lottoId);
        uint256 totalStaked = _exists.stakes;
        uint256 current = block.timestamp;
        // if no winner found, everything belongs to creator...for now
        uint256 _creatorShares = totalStaked;
        uint256 players = storageController.getPlayers(_lottoId);

        if (
            (!_exists.status.isFinished &&
                !_exists.status.isPot &&
                (_exists.winningType == WinningType.NUMBER_OF_PLAYERS &&
                    players == _exists.maxNumberOfPlayers)) ||
            (_exists.winningType == WinningType.TIME_BASED &&
                _exists.endTime <= current)
        ) {
            // once we find a winner, creator shares should reduce
            _creatorShares = totalStaked
                .mul(storageController.getCreatorSharesPercentage())
                .div(100);

            totalStaked = totalStaked.sub(_creatorShares);

            // perform a bunch of operations to determine randBase
            bytes32 randBase = keccak256(
                abi.encode(
                    storageController.getRandBase(),
                    players,
                    _exists.creator,
                    _exists.betAmount,
                    _exists.stakes,
                    _creatorShares,
                    current
                )
            );

            // make randBase better, the more winners are found,
            // the less likely someone will be able to guess the next winner
            storageController.setRandBase(randBase);

            uint256 winnerIndex = uint256(
                keccak256(abi.encode(totalStaked, randBase))
            ) % (storageController.getPlayers(_lottoId));

            address lottoWinner = storageController.findPlayerByIndex(
                _lottoId,
                winnerIndex
            );
            _exists.winner = lottoWinner;
            _exists.winning = totalStaked;
            _exists.status.isFinished = true;

            storageController.setIsWinner(_lottoId, lottoWinner, true);
            storageController.setWinner(_lottoId, lottoWinner);

            removeFromLottoIds(_lottoId);
        }

        _exists.creatorShares = _creatorShares;
        storageController.setLotto(_lottoId, _exists);
    }
}
