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
        
        lottoIds.push(_lotto.id);    

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

    function getCompletedLottos() external view override returns (uint256[] memory) {
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
    function claimWinning(uint256 _lottoId, address _claimer)
        external
        override
        returns (Claim memory)
    {
        Lotto memory _exists = storageController.getLottoById(_lottoId);
        require(_exists.status.isFinished, ERROR_22);
        require(!_exists.status.isPot, ERROR_19);
        require(storageController.getIsWinner(_lottoId, _claimer), ERROR_27);
        require(storageController.getIsClaimed(_lottoId, _claimer) == false, ERROR_23);
        _exists.status.isPot = true;
    
        completedLottoIds.push(_lottoId);

        storageController.setIsClaimed(_lottoId, _claimer, true);

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

            storageController.setPlayer(_lottoId, _player);

            storageController.setLotto(_lottoId, _exists);
            findLottoWinner(_lottoId);
        }
        return true;
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

    function platformClaim(uint256 _lottoId)
        external
        override
        returns (Claim memory)
    {
        Lotto memory _exists = storageController.getLottoById(_lottoId);
        require(_exists.status.platformClaimed == false, ERROR_37);
        require(_exists.startTime <= block.timestamp, ERROR_14);
        require(_exists.endTime <= block.timestamp, ERROR_22);

        _exists.status.platformClaimed = true;
        storageController.setLotto(_lottoId, _exists);
        return Claim({winner: address(0), winning: _exists.platformShares});
    }

    function creatorClaim(uint256 _lottoId)
        external
        virtual
        override
        returns (Claim memory)
    {
        Lotto memory _exists = storageController.getLottoById(_lottoId);
        require(_exists.status.creatorClaimed == false, ERROR_37);
        require(_exists.startTime <= block.timestamp, ERROR_14);
        require(_exists.endTime <= block.timestamp, ERROR_22);
        _exists.status.creatorClaimed = true;
        storageController.setLotto(_lottoId, _exists);
        return Claim({winner: _exists.creator, winning: _exists.creatorShares});
    }

    // ============================ PRIVATE METHODS ============================
    function findLottoWinner(uint256 _lottoId) private {
        uint256 current = block.timestamp;
        Lotto memory _exists = storageController.getLottoById(_lottoId);
        if (
            (!_exists.status.isFinished &&
                !_exists.status.isPot &&
                (_exists.winningType == WinningType.NUMBER_OF_PLAYERS &&
                    storageController.getPlayers(_lottoId).length == _exists.maxNumberOfPlayers)) ||
            (_exists.winningType == WinningType.TIME_BASED &&
                _exists.endTime <= current)
        ) {
            uint256 totalStaked = _exists.stakes;

            // take platform's share
            uint256 _platformShare = totalStaked
                .mul(storageController.getPlatformSharePercentage())
                .div(100);
            uint256 _creatorShares = totalStaked
                .mul(storageController.getCreatorSharesPercentage())
                .div(100);

            totalStaked = totalStaked.sub(_platformShare).sub(_creatorShares);

            bytes32 randBase = keccak256(abi.encode(storageController.getPlayers(_lottoId)[0]));
            randBase = keccak256(
                abi.encode(
                    randBase,
                    storageController.getPlayers(_lottoId)[storageController.getPlayers(_lottoId).length.div(2)]
                )
            );
            randBase = keccak256(
                abi.encode(
                    randBase,
                    storageController.getPlayers(_lottoId)[storageController.getPlayers(_lottoId).length.sub(1)]
                )
            );

            uint256 winnerIndex = uint256(
                keccak256(abi.encode(totalStaked, randBase))
            ) % (storageController.getPlayers(_lottoId).length);

            address lottoWinner = storageController.getPlayers(_lottoId)[winnerIndex];
            _exists.winner = lottoWinner;
            _exists.winning = totalStaked;
            _exists.status.isFinished = true;

            storageController.setIsWinner(_lottoId, lottoWinner, true);

            _exists.platformShares = _platformShare;
            _exists.creatorShares = _creatorShares;

            storageController.setLotto(_lottoId, _exists);
            // TODO: Reward both winner and creator with grotto tokens
        }
    }
}
