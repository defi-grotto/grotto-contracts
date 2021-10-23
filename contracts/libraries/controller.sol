//SPDX-License-Identifier: Unlicense
pragma solidity 0.8.3;
import "./models.sol";
import "./controller.interface.sol";
import "./errors.sol";
import "hardhat/console.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

contract Controller is ControllerInterface {
    using SafeMath for uint256;

    address private grotto = address(0);
    address private grottoCaller = address(0);
    address private platformOwner = address(0);
    uint256 private platformShare;
    mapping(uint256 => uint256) private platformShares;
    mapping(uint256 => uint256) private creatorShares;

    uint256 private platformSharePercentage = 10;
    uint256 private creatorSharesPercentage = 20;

    uint256 private maxWinningNumbers = 10;
    uint256 private maxWinners = 10;

    // Lotto Data Structure
    // id of the lotto/pot
    mapping(uint256 => uint256) private lottoId;
    mapping(uint256 => address) private creator;
    mapping(uint256 => uint256) private startTime;
    mapping(uint256 => uint256) private endTime;
    // for a no of players based lotto/pot, how many players before winner is calculated and lotto stopped
    mapping(uint256 => uint256) private maxNumberOfPlayers;
    // how much a person must bet
    mapping(uint256 => uint256) private betAmount;
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
    mapping(uint256 => WinningType) private winningType;
    mapping(uint256 => bool) private isFinished;
    mapping(uint256 => bool) private isClaimed;
    // all the money staked on the lotto/pot so far
    mapping(uint256 => uint256) private stakes;
    // all the players in the lotto/pot
    mapping(uint256 => address[]) private players;
    // list of winners
    mapping(uint256 => address) private winner;
    // each winner's winning
    mapping(uint256 => uint256) private winning;

    // Pot Data Structure
    // how much the pot creator is putting up, the pot winner(s) takes this money + all money staked
    mapping(uint256 => uint256) private potAmount;
    // The numbers the players must guess
    mapping(uint256 => uint256[]) private winningNumbers;
    mapping(uint256 => mapping(uint256 => bool)) private winningNumbersMap;

    mapping(uint256 => bool) private isPot;
    /* 
        The Type of Guess
            * Numbers: The player must guess just the numbers
            * Order: The player must guess both the number and the order
    */
    mapping(uint256 => PotGuessType) private potGuessType;

    modifier is_authorized() {
        require(msg.sender == grotto, ERROR_3);
        _;
    }

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

    modifier is_valid_pot(Pot memory _pot) {
        require(creator[_pot.lotto.id] != _pot.lotto.creator, ERROR_4);
        require(_pot.potAmount > 0, ERROR_11);
        require(_pot.winningNumbers.length > 0, ERROR_12);
        require(_pot.winningNumbers.length <= 10, ERROR_33);
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

    // TODO: This method exposes a vulnerability....should check msg.sender somewhere
    function setGrotto(address _grotto, address _grottoCaller)
        external
        override
    {
        if (grotto == address(0) && grottoCaller == address(0)) {
            grotto = _grotto;
            grottoCaller = _grottoCaller;
        } else if (grottoCaller == _grottoCaller) {
            grotto = _grotto;
        } else {
            revert(ERROR_2);
        }
    }

    function setPlatformOwner(address _owner, address _grottoCaller)
        external
        override
    {
        if (grotto == address(0) && grottoCaller == address(0)) {
            platformOwner = _owner;
            grottoCaller = _grottoCaller;
        } else if (grottoCaller == _grottoCaller) {
            platformOwner = _owner;
        } else {
            revert(ERROR_2);
        }
    }

    function addNewLotto(Lotto memory _lotto)
        external
        override
        is_authorized
        is_valid_lotto(_lotto)
        returns (bool)
    {
        lottoId[_lotto.id] = _lotto.id;
        creator[_lotto.id] = _lotto.creator;
        startTime[_lotto.id] = _lotto.startTime;
        endTime[_lotto.id] = _lotto.endTime;
        maxNumberOfPlayers[_lotto.id] = _lotto.maxNumberOfPlayers;
        betAmount[_lotto.id] = _lotto.betAmount;
        winningType[_lotto.id] = _lotto.winningType;
        isFinished[_lotto.id] = _lotto.isFinished;
        stakes[_lotto.id] = _lotto.stakes;
        players[_lotto.id] = _lotto.players;
        isPot[_lotto.id] = false;        
        return true;
    }

    function addNewPot(Pot memory _pot)
        external
        override
        is_authorized
        is_valid_lotto(_pot.lotto)
        is_valid_pot(_pot)
        returns (bool)
    {
        lottoId[_pot.lotto.id] = _pot.lotto.id;
        creator[_pot.lotto.id] = _pot.lotto.creator;
        startTime[_pot.lotto.id] = _pot.lotto.startTime;
        endTime[_pot.lotto.id] = _pot.lotto.endTime;
        maxNumberOfPlayers[_pot.lotto.id] = _pot.lotto.maxNumberOfPlayers;
        betAmount[_pot.lotto.id] = _pot.lotto.betAmount;
        winningType[_pot.lotto.id] = _pot.lotto.winningType;
        isFinished[_pot.lotto.id] = _pot.lotto.isFinished;
        stakes[_pot.lotto.id] = _pot.lotto.stakes;
        players[_pot.lotto.id] = _pot.lotto.players;
        potAmount[_pot.lotto.id] = _pot.potAmount;
        winningNumbers[_pot.lotto.id] = _pot.winningNumbers;
        for (uint256 i = 0; i < _pot.winningNumbers.length; i = i.add(1)) {
            winningNumbersMap[_pot.lotto.id][_pot.winningNumbers[i]] = true;
        }
        potGuessType[_pot.lotto.id] = _pot.potGuessType;
        isPot[_pot.lotto.id] = true;
        return true;
    }

    function getClaim(uint256 _lottoId, address _claimer)
        external
        view
        override
        returns (Claim memory)
    {
        require(winner[_lottoId] == _claimer || creator[_lottoId] == _claimer || platformOwner == _claimer, ERROR_25);
        return Claim ({
            winner: winner[_lottoId],
            creator: creator[_lottoId],
            winning: winning[_lottoId],
            creatorShares: creatorShares[_lottoId]
        });
    }

    function getLottoById(uint256 _lottoId)
        external
        view
        override
        returns (Lotto memory)
    {
        require(isPot[_lottoId] == false, ERROR_32);
        return
            Lotto({
                id: lottoId[_lottoId],
                creator: creator[_lottoId],
                creatorShares: creatorShares[_lottoId],
                startTime: startTime[_lottoId],
                endTime: endTime[_lottoId],
                maxNumberOfPlayers: maxNumberOfPlayers[_lottoId],
                betAmount: betAmount[_lottoId],
                winningType: winningType[_lottoId],
                isFinished: isFinished[_lottoId],
                stakes: stakes[_lottoId],
                players: players[_lottoId],
                winner: winner[_lottoId],
                winning: winning[_lottoId]
            });
    }

    function getPotById(uint256 _potId)
        external
        view
        override
        returns (Pot memory)
    {
        require(isPot[_potId], ERROR_31);
        Lotto memory lotto = Lotto({
            id: lottoId[_potId],
            creator: creator[_potId],
            creatorShares: creatorShares[_potId],
            startTime: startTime[_potId],
            endTime: endTime[_potId],
            maxNumberOfPlayers: maxNumberOfPlayers[_potId],
            betAmount: betAmount[_potId],
            winningType: winningType[_potId],
            isFinished: isFinished[_potId],
            stakes: stakes[_potId],
            players: players[_potId],
            winner: winner[_potId],
            winning: winning[_potId]
        });

        Pot memory pot = Pot({
            lotto: lotto,
            potAmount: potAmount[_potId],
            winningNumbers: winningNumbers[_potId],
            potGuessType: potGuessType[_potId]
        });

        return pot;
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
        returns (bool)
    {
        stakes[_lottoId] = stakes[_lottoId].add(_betPlaced);
        players[_lottoId].push(_player);
        findLottoWinner(_lottoId);
        return true;
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
        returns (bool)
    {
        stakes[_potId] = stakes[_potId].add(_betPlaced);
        players[_potId].push(_player);
        findPotWinner(_potId, _player, _guesses);
        return true;
    }

    function findPotWinner(
        uint256 _potId,
        address _player,
        uint256[] memory _guesses
    ) private {
        uint256 current = block.timestamp;

        if (!isFinished[_potId]) {
            if (isPot[_potId]) {
                if (
                    (winningType[_potId] == WinningType.NUMBER_OF_PLAYERS &&
                        players[_potId].length == maxNumberOfPlayers[_potId]) ||
                    (winningType[_potId] == WinningType.TIME_BASED &&
                        endTime[_potId] <= current)
                ) {
                    // TODO: no winner found, send all money to pot creator
                } else {
                    _findPotWinner(_potId, _player, _guesses);
                }
            }
        }
    }

    function findLottoWinner(uint256 _lottoId) private {
        uint256 current = block.timestamp;

        if (!isFinished[_lottoId]) {
            if (!isPot[_lottoId]) {
                if (
                    (winningType[_lottoId] == WinningType.NUMBER_OF_PLAYERS &&
                        players[_lottoId].length ==
                        maxNumberOfPlayers[_lottoId]) ||
                    (winningType[_lottoId] == WinningType.TIME_BASED &&
                        endTime[_lottoId] <= current)
                ) {
                    _findLottoWinner(_lottoId);
                }
            }
        }
    }

    function _findPotWinner(
        uint256 _potId,
        address _player,
        uint256[] memory _guesses
    ) private {
        // is there a winner?
        bool won = true;
        if (potGuessType[_potId] == PotGuessType.NUMBERS) {
            // just check that all guesses exists in winning numbers
            for (uint256 i = 0; i < _guesses.length; i = i.add(1)) {
                if (winningNumbersMap[_potId][_guesses[i]] == false) {
                    won = false;
                    break;
                }
            }
        } else if (potGuessType[_potId] == PotGuessType.ORDER) {
            for (uint256 i = 0; i < _guesses.length; i = i.add(1)) {
                if (_guesses[i] != winningNumbers[_potId][i]) {
                    won = false;
                    break;
                }
            }
        }

        if (won) {
            uint256 totalStaked = stakes[_potId].add(potAmount[_potId]);

            // take platform's share
            uint256 _platformShare = totalStaked
                .mul(platformSharePercentage)
                .div(100);
            uint256 _creatorShares = totalStaked.mul(creatorSharesPercentage).div(
                100
            );

            totalStaked = totalStaked.sub(_platformShare).sub(_creatorShares);

            winner[_potId] = _player;
            winning[_potId] = totalStaked;
            isFinished[_potId] = true;

            platformShare = platformShare.add(_platformShare);
            platformShares[_potId] = _platformShare;
            creatorShares[_potId] = _creatorShares;

            // TODO: Reward both winner and creator with grotto tokens
        }
    }

    function _findLottoWinner(uint256 _lottoId) private {
        uint256 totalStaked = stakes[_lottoId];

        // take platform's share
        uint256 _platformShare = totalStaked.mul(platformSharePercentage).div(
            100
        );
        uint256 _creatorShares = totalStaked.mul(creatorSharesPercentage).div(100);

        totalStaked = totalStaked.sub(_platformShare).sub(_creatorShares);

        bytes32 randBase = keccak256(abi.encode(players[0]));
        randBase = keccak256(
            abi.encode(randBase, players[players[_lottoId].length.div(2)])
        );
        randBase = keccak256(
            abi.encode(randBase, players[players[_lottoId].length.sub(1)])
        );

        uint256 winnerIndex = uint256(
            keccak256(abi.encode(totalStaked, randBase))
        ) % (players[_lottoId].length);

        address lottoWinner = players[_lottoId][winnerIndex];
        winner[_lottoId] = lottoWinner;
        winning[_lottoId] = totalStaked;
        isFinished[_lottoId] = true;

        platformShare = platformShare.add(_platformShare);
        platformShares[_lottoId] = _platformShare;
        creatorShares[_lottoId] = _creatorShares;

        // TODO: Reward both winner and creator with grotto tokens
    }

    function claimWinnings(uint256 _lottoId) external override returns (bool) {
        require(isFinished[_lottoId], ERROR_22);
        require(!isClaimed[_lottoId], ERROR_23);
        isClaimed[_lottoId] = true;
        return true;
    }

    function forceEndLotto(uint256 _lottoId) external override returns (bool) {
        endTime[_lottoId] = block.timestamp;
        return true;
    }
}
