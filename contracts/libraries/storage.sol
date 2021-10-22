//SPDX-License-Identifier: Unlicense
pragma solidity 0.8.3;
import "./models.sol";
import "./storage.interface.sol";
import "./errors.sol";
import "hardhat/console.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

contract Storage is StorageInterface {
    using SafeMath for uint256;

    address private grotto = address(0);
    address private grottoCaller = address(0);

    // Lotto Data Structure
    // id of the lotto/pot
    mapping(uint256 => uint256) lottoId;
    mapping(uint256 => address) creator;
    // how many people can win the lotto/pot
    mapping(uint256 => uint256) numberOfWinners;
    // Depending on numberOfWinners, an array of each winners shares. Must add up to 100
    mapping(uint256 => uint256[]) winnersShares;
    mapping(uint256 => uint256) startTime;
    mapping(uint256 => uint256) endTime;
    // for a no of players based lotto/pot, how many players before winner is calculated and lotto stopped
    mapping(uint256 => uint256) maxNumberOfPlayers;
    // how much a person must bet
    mapping(uint256 => uint256) betAmount;
    /*
        Type of Winning
            * Time Based: 
                * For lotto: it is finished after X time, the winner is randomly selected
                * For pot: if a winner is not found after X time, pot creator gets all the stakes
                            if a winner (or winners) are found, they get the potAmount + stakes
            * Number of players: 
                For lotto: it is finished after X number of people played, the winner is randomly selected
                For pot: if a winner is not found after X number of players have played, pot creator gets all the stakes
                        if a winner (or winners) are found, they get the potAmount + stakes
    */
    mapping(uint256 => WinningType) winningType;
    mapping(uint256 => bool) isFinished;
    mapping(uint256 => bool) isClaimed;
    // all the money staked on the lotto/pot so far
    mapping(uint256 => uint256) stakes;
    // all the players in the lotto/pot
    mapping(uint256 => address[]) players;
    // list of winners
    mapping(uint256 => address[]) winners;
    // a map of winners for easy access without for loop
    mapping(uint256 => mapping(address => address)) winnersMap;
    // each winner's winning
    mapping(uint256 => uint256[]) winnings;
    // a map of winnings for easy access without for loop
    mapping(uint256 => mapping(address => uint256)) winningsMap;

    // Pot Data Structure
    // how much the pot creator is putting up, the pot winner(s) takes this money + all money staked
    mapping(uint256 => uint256) potAmount;
    // The numbers the players must guess
    mapping(uint256 => uint256[]) winningNumbers;

    mapping(uint256 => bool) isPot;
    /* 
        The Type of Guess
            * Numbers: The player must guess just the numbers
            * Order: The player must guess both the number and the order
    */
    mapping(uint256 => PotGuessType) potGuessType;

    modifier is_authorized() {
        require(msg.sender == grotto, ERROR_3);
        _;
    }

    modifier is_valid_lotto(Lotto memory _lotto) {
        require(_lotto.betAmount > 0, ERROR_7);        

        require(creator[_lotto.id] != _lotto.creator, ERROR_4);
        require(
            _lotto.numberOfWinners == _lotto.winnersShares.length,
            ERROR_5
        );

        require(_lotto.numberOfWinners < 10, ERROR_25);

        uint256 sum = 0;

        for (uint256 i = 0; i < _lotto.numberOfWinners; i = i.add(1)) {
            sum = sum.add(_lotto.winnersShares[i]);
        }

        require(sum == 100, ERROR_26);

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
        require(!isFinished[_lottoId], ERROR_17);
        require(_betPlaced >= betAmount[_lottoId], ERROR_18);
        require(_player != creator[_lottoId], ERROR_21);
        _;
    }

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

    function addNewLotto(Lotto memory _lotto)
        external
        override
        is_authorized
        is_valid_lotto(_lotto)
        returns (bool)
    {
        lottoId[_lotto.id] = _lotto.id;
        creator[_lotto.id] = _lotto.creator;
        numberOfWinners[_lotto.id] = _lotto.numberOfWinners;
        winnersShares[_lotto.id] = _lotto.winnersShares;
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
        numberOfWinners[_pot.lotto.id] = _pot.lotto.numberOfWinners;
        winnersShares[_pot.lotto.id] = _pot.lotto.winnersShares;
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
        potGuessType[_pot.lotto.id] = _pot.potGuessType;
        isPot[_pot.lotto.id] = true;
        return true;
    }

    function findClaimer(uint256 _lottoId, address _claimer)
        external
        view
        override
        returns (address, uint256)
    {
        return (
            winnersMap[_lottoId][_claimer],
            winningsMap[_lottoId][_claimer]
        );
    }

    function getLottoById(uint256 _lottoId)
        external
        view
        override
        returns (Lotto memory)
    {
        return
            Lotto({
                id: lottoId[_lottoId],
                creator: creator[_lottoId],
                numberOfWinners: numberOfWinners[_lottoId],
                winnersShares: winnersShares[_lottoId],
                startTime: startTime[_lottoId],
                endTime: endTime[_lottoId],
                maxNumberOfPlayers: maxNumberOfPlayers[_lottoId],
                betAmount: betAmount[_lottoId],
                winningType: winningType[_lottoId],
                isFinished: isFinished[_lottoId],
                stakes: stakes[_lottoId],
                players: players[_lottoId],
                winners: winners[_lottoId],
                winnings: winnings[_lottoId]
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
            numberOfWinners: numberOfWinners[_potId],
            winnersShares: winnersShares[_potId],
            startTime: startTime[_potId],
            endTime: endTime[_potId],
            maxNumberOfPlayers: maxNumberOfPlayers[_potId],
            betAmount: betAmount[_potId],
            winningType: winningType[_potId],
            isFinished: isFinished[_potId],
            stakes: stakes[_potId],
            players: players[_potId],
            winners: winners[_potId],
            winnings: winnings[_potId]
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
        address _player
    )
        external
        override
        can_play_lotto(_potId, _betPlaced, _player)
        still_running(_potId)
        returns (bool)
    {
        stakes[_potId] = stakes[_potId].add(_betPlaced);
        players[_potId].push(_player);
        findLottoWinner(_potId);
        return true;
    }

    function findLottoWinner(uint256 _lottoId) private {
        uint256 current = block.timestamp;

        if (
            winningType[_lottoId] == WinningType.NUMBER_OF_PLAYERS &&
            players[_lottoId].length == maxNumberOfPlayers[_lottoId]
        ) {
            _findLottoWinner(_lottoId);
        } else if (
            winningType[_lottoId] == WinningType.TIME_BASED &&
            endTime[_lottoId] <= current
        ) {
            _findLottoWinner(_lottoId);
        }
    }

    function _findLottoWinner(uint256 _lottoId) private {
        uint256 totalStaked = stakes[_lottoId];

        for (uint256 i = 0; i < numberOfWinners[_lottoId]; i = i.add(1)) {
            uint256 mid = players[_lottoId].length.div(2);
            uint256 end = players[_lottoId].length.sub(1);
            bytes32 randBase = keccak256(abi.encodePacked(players[i]));
            randBase = keccak256(abi.encodePacked(randBase, players[mid]));
            randBase = keccak256(abi.encodePacked(randBase, players[end]));

            uint256 winnerIndex = uint256(
                keccak256(abi.encodePacked(totalStaked, randBase))
            ) % (players[_lottoId].length);

            address lottoWinner = players[_lottoId][winnerIndex];
            uint256 eachShare = totalStaked.mul(winnersShares[_lottoId][i]).div(
                100
            );
            winners[_lottoId].push(lottoWinner);
            winnersMap[_lottoId][lottoWinner] = lottoWinner;
            winnings[_lottoId].push(eachShare);
            winningsMap[_lottoId][lottoWinner] = eachShare;
        }
        isFinished[_lottoId] = true;
    }

    function claimLottoWinnings(uint256 _lottoId)
        external
        override
        returns (bool)
    {
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
