//SPDX-License-Identifier: Unlicense
pragma solidity 0.8.4;

import "./controller.interface.sol";
import "../errors.sol";

abstract contract BaseController is ControllerInterface {
    bytes32 public constant LOTTO_CREATOR = keccak256("LOTTO_CREATOR_ROLE");
    bytes32 public constant LOTTO_PLAYER = keccak256("LOTTO_PLAYER_ROLE");
    bytes32 public constant ADMIN = keccak256("ADMIN_ROLE");

    mapping(uint256 => bool) activeIdsMap;

    uint256 autoIncrementId = 0;
    uint256[] completedIds;

    // games that the player played in
    mapping(address => mapping(uint256 => bool)) playedIn;
    mapping(address => uint256[]) participated;

    // games that the player has claimed
    mapping(address => uint256[]) userClaims;

    address internal platformOwner;
    mapping(uint256 => uint256) internal platformShares;
    mapping(uint256 => uint256) internal creatorShares;

    uint256 internal platformSharePercentage;
    uint256 internal creatorSharesPercentage;

    uint256 internal maxWinningNumbers;
    uint256 internal maxWinners;

    // Lotto Data Structure
    // id of the lotto/pot
    mapping(uint256 => uint256) internal lottoId;
    mapping(uint256 => address) internal creator;
    mapping(uint256 => uint256) internal startTime;
    mapping(uint256 => uint256) internal endTime;
    // for a no of players based lotto/pot, how many players before winner is calculated and lotto stopped
    mapping(uint256 => uint256) internal maxNumberOfPlayers;
    // how much a person must bet
    mapping(uint256 => uint256) internal betAmount;
    /*
        Type of Winning
            * Time Based: 
                * For lotto: it is finished after X time, the winner is randomly selected
                * For pot: if a winner is not found after X time, pot creator gets all the stakes
                    if a winner is found, they get the potAmount + stakes...there can be no multiple winners in a pot
            * Number of players: 
                For lotto: it is finished after X number of people played, the winner is randomly selected
                For pot: if a winner is not found after X number of players have played, pot creator gets all the stakes
                    if a winner is found, they get the potAmount + stakes...there can be no multiple winners in a pot
    */
    mapping(uint256 => WinningType) internal winningType;
    mapping(uint256 => bool) internal isFinished;
    mapping(uint256 => bool) internal isClaimed;
    mapping(uint256 => bool) internal creatorClaimed;
    mapping(uint256 => bool) internal platformClaimed;
    // all the money staked on the lotto/pot so far
    mapping(uint256 => uint256) internal stakes;
    // all the players in the lotto/pot
    mapping(uint256 => address[]) internal players;
    // list of winners
    mapping(uint256 => address) internal winner;
    // each winner's winning
    mapping(uint256 => uint256) internal winning;

    mapping(uint256 => bool) internal isPot;
    mapping(uint256 => mapping(address => bool)) internal isWinner;

    // ============================ MODIFIERS============================
    modifier is_valid_lotto(Lotto memory _lotto) {
        require(_lotto.betAmount > 0, ERROR_7);

        require(creator[_lotto.id] != _lotto.creator, ERROR_4);

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
        require(creator[_lottoId] != address(0), ERROR_19);
        require(isFinished[_lottoId] == false, ERROR_17);
        require(_betPlaced >= betAmount[_lottoId], ERROR_18);
        require(_player != creator[_lottoId], ERROR_21);
        _;
    }

    modifier still_running(uint256 _lottoId) {
        if (winningType[_lottoId] == WinningType.TIME_BASED) {
            require(startTime[_lottoId] <= block.timestamp, ERROR_14);
            require(endTime[_lottoId] > block.timestamp, ERROR_15);
        } else if (winningType[_lottoId] == WinningType.NUMBER_OF_PLAYERS) {
            require(
                players[_lottoId].length < maxNumberOfPlayers[_lottoId],
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
        return stakes[_lottoId];
    }

    // ============================ VIRTUAL METHODS, NEEDS OVERRIDING ============================
    function addNewLotto(Lotto memory)
        external
        virtual
        override
        returns (bool)
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

    function addNewPot(Pot memory) external virtual override returns (bool) {}

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
