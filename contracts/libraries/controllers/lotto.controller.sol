//SPDX-License-Identifier: Unlicense
pragma solidity 0.8.4;

import "../models.sol";
import "./base.controller.sol";
import "../errors.sol";
import "hardhat/console.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

contract LottoController is BaseController, AccessControlUpgradeable {
    using SafeMath for uint256;

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
        is_valid_lotto(_lotto)
        returns (uint256)
    {
        _lotto.id = ++autoIncrementId;
        _lotto.status.isPot = false;

        activeIdsMap[_lotto.id] = true;

        lottos[_lotto.id] = _lotto;
        emit LottoCreated(_lotto.id);

        return _lotto.id;
    }

    // ============================ EXTERNAL VIEW METHODS ============================
    function isLottoId(uint256 _lottoId) external view override returns (bool) {
        Lotto memory _exists = lottos[_lottoId];
        return
            _exists.id > 0 &&
            _exists.creator != address(0) &&
            _exists.status.isPot == false;
    }

    function getLottoById(uint256 _lottoId)
        external
        view
        override
        returns (Lotto memory)
    {
        Lotto memory _exists = lottos[_lottoId];
        require(
            _exists.id > 0 &&
                _exists.creator != address(0) &&
                _exists.status.isPot == false,
            ERROR_32
        );
        return _exists;
    }

    // ============================ EXTERNAL METHODS ============================
    function claimWinning(uint256 _lottoId, address _claimer)
        external
        override
        returns (Claim memory)
    {
        Lotto memory _exists = lottos[_lottoId];
        require(_exists.status.isFinished, ERROR_22);
        require(!_exists.status.isPot, ERROR_23);
        require(isWinner[_lottoId][_claimer], ERROR_27);
        _exists.status.isPot = true;

        activeIdsMap[_lottoId] = false;
        completedIds.push(_lottoId);

        userClaims[_claimer].push(_lottoId);

        return Claim({winner: _exists.winner, winning: _exists.winning});
    }

    function playLotto(
        uint256 _lottoId,
        uint256 _betPlaced,
        address _player
    )
        external
        override
        can_play_lotto(_lottoId, _betPlaced, _player)
        still_running(_lottoId)
        onlyRole(LOTTO_PLAYER)
        returns (bool)
    {
        Lotto memory _exists = lottos[_lottoId];
        _exists.stakes = _exists.stakes.add(_betPlaced);
        _exists.players[_exists.players.length] = _player;

        if (!playedIn[_player][_lottoId]) {
            participated[_player].push(_lottoId);
            playedIn[_player][_lottoId] = true;
        }

        findLottoWinner(_lottoId);
        return true;
    }

    function forceEnd(uint256 _lottoId)
        external
        view
        override
        onlyRole(ADMIN)
        returns (bool)
    {
        Lotto memory _exists = lottos[_lottoId];
        _exists.endTime = block.timestamp;
        return true;
    }

    function platformClaim(uint256 _lottoId)
        external
        view
        override
        returns (Claim memory)
    {
        Lotto memory _exists = lottos[_lottoId];
        require(_exists.status.platformClaimed == false, ERROR_37);
        require(_exists.startTime <= block.timestamp, ERROR_14);
        require(_exists.endTime <= block.timestamp, ERROR_22);

        _exists.status.platformClaimed = true;
        return Claim({winner: address(0), winning: _exists.platformShares});
    }

    function creatorClaim(uint256 _lottoId)
        external
        virtual
        override
        returns (Claim memory)
    {
        Lotto memory _exists = lottos[_lottoId];
        require(_exists.status.creatorClaimed == false, ERROR_37);
        require(_exists.startTime <= block.timestamp, ERROR_14);
        require(_exists.endTime <= block.timestamp, ERROR_22);
        _exists.status.creatorClaimed = true;
        return Claim({winner: _exists.creator, winning: _exists.creatorShares});
    }

    // ============================ PRIVATE METHODS ============================
    function findLottoWinner(uint256 _lottoId) private {
        uint256 current = block.timestamp;
        Lotto memory _exists = lottos[_lottoId];
        if (
            (!_exists.status.isFinished &&
                !_exists.status.isPot &&
                (_exists.winningType == WinningType.NUMBER_OF_PLAYERS &&
                    _exists.players.length == _exists.maxNumberOfPlayers)) ||
            (_exists.winningType == WinningType.TIME_BASED &&
                _exists.endTime <= current)
        ) {
            uint256 totalStaked = _exists.stakes;

            // take platform's share
            uint256 _platformShare = totalStaked
                .mul(platformSharePercentage)
                .div(100);
            uint256 _creatorShares = totalStaked
                .mul(creatorSharesPercentage)
                .div(100);

            totalStaked = totalStaked.sub(_platformShare).sub(_creatorShares);

            bytes32 randBase = keccak256(abi.encode(_exists.players[0]));
            randBase = keccak256(
                abi.encode(
                    randBase,
                    _exists.players[_exists.players.length.div(2)]
                )
            );
            randBase = keccak256(
                abi.encode(
                    randBase,
                    _exists.players[_exists.players.length.sub(1)]
                )
            );

            uint256 winnerIndex = uint256(
                keccak256(abi.encode(totalStaked, randBase))
            ) % (_exists.players.length);

            address lottoWinner = _exists.players[winnerIndex];
            _exists.winner = lottoWinner;
            _exists.winning = totalStaked;
            _exists.status.isFinished = true;

            isWinner[_lottoId][lottoWinner] = true;

            _exists.platformShares = _platformShare;
            _exists.creatorShares = _creatorShares;

            // TODO: Reward both winner and creator with grotto tokens
        }
    }
}
