//SPDX-License-Identifier: Unlicense
pragma solidity 0.8.4;

import "./controller.interface.sol";
import "../errors.sol";
import "../models.sol";

abstract contract BaseController is ControllerInterface {
    bytes32 public constant LOTTO_CREATOR = keccak256("LOTTO_CREATOR_ROLE");
    bytes32 public constant LOTTO_PLAYER = keccak256("LOTTO_PLAYER_ROLE");
    bytes32 public constant ADMIN = keccak256("ADMIN_ROLE");

    mapping(uint256 => bool) activeIdsMap;
    mapping(uint256 => Lotto) lottos;
    mapping(uint256 => Pot) pots;

    uint256 autoIncrementId;
    uint256[] completedIds;

    // games that the player played in
    mapping(address => mapping(uint256 => bool)) playedIn;
    mapping(uint256 => mapping(address => bool)) isWinner;
    mapping(address => uint256[]) participated;

    // games that the player has claimed
    mapping(address => uint256[]) userClaims;

    address internal platformOwner;

    uint256 internal platformSharePercentage;
    uint256 internal creatorFees;
    uint256 internal creatorSharesPercentage;

    // ============================ MODIFIERS============================
    modifier is_valid_lotto(Lotto memory _lotto) {
        Lotto memory _exists = lottos[_lotto.id];

        require(_lotto.betAmount > 0, ERROR_7);
        require(_exists.creator != _lotto.creator, ERROR_4);

        if (_lotto.winningType == WinningType.TIME_BASED) {
            require(_lotto.startTime < _lotto.endTime, ERROR_6);
            require(_lotto.endTime > block.timestamp, ERROR_10);
        }

        if (_lotto.winningType == WinningType.NUMBER_OF_PLAYERS) {
            require(_lotto.maxNumberOfPlayers > 0, ERROR_8);
        }
        _;
    }

    modifier can_play_lotto(
        uint256 _lottoId,
        uint256 _betPlaced,
        address _player
    ) {
        Lotto memory _exists = lottos[_lottoId];
        require(_exists.creator != address(0), ERROR_19);
        require(_exists.status.isFinished == false, ERROR_17);
        require(_betPlaced >= _exists.betAmount, ERROR_18);
        require(_player != _exists.creator, ERROR_21);
        _;
    }

    modifier still_running(uint256 _lottoId) {
        Lotto memory _exists = lottos[_lottoId];
        if (_exists.winningType == WinningType.TIME_BASED) {
            require(_exists.startTime <= block.timestamp, ERROR_14);
            require(_exists.endTime > block.timestamp, ERROR_15);
        } else if (_exists.winningType == WinningType.NUMBER_OF_PLAYERS) {
            require(
                _exists.players.length < _exists.maxNumberOfPlayers,
                ERROR_16
            );
        }
        _;
    }

    // ============================ EXTERNAL VIEW METHODS ============================
    function getTotalStaked(uint256 _lottoId)
        external
        view
        override
        returns (uint256)
    {
        Lotto memory _exists = lottos[_lottoId];
        return _exists.stakes;
    }

    function getCreatorFees() public view override returns (uint256) {
        return creatorFees;
    }

    // ============================ VIRTUAL METHODS, NEEDS OVERRIDING ============================
    function addNewLotto(Lotto memory)
        external
        virtual
        override
        returns (uint256)
    {}

    function getLottoById(uint256)
        external
        view
        virtual
        override
        returns (Lotto memory)
    {}

    function playLotto(
        uint256,
        uint256,
        address
    ) external virtual override returns (bool) {}

    function isLottoId(uint256) external view virtual override returns (bool) {}

    function addNewPot(Pot memory) external virtual override returns (uint256) {}

    function playPot(
        uint256,
        uint256,
        address,
        uint256[] memory
    ) external virtual override returns (bool) {}

    function getPotById(uint256)
        external
        view
        virtual
        override
        returns (Pot memory)
    {}

    function isPotId(uint256) external view virtual override returns (bool) {}
}
