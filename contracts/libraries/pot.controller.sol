//SPDX-License-Identifier: Unlicense
pragma solidity 0.8.4;

import "./models.sol";
import "./base.controller.sol";
import "./errors.sol";
import "hardhat/console.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

contract PotController is
    BaseController,
    AccessControlUpgradeable
{
    using SafeMath for uint256;

    // Pot Data Structure
    // how much the pot creator is putting up, the pot winner(s) takes this money + all money staked
    mapping(uint256 => uint256) private potAmount;
    // The numbers the players must guess
    mapping(uint256 => uint256[]) private winningNumbers;
    mapping(uint256 => mapping(uint256 => bool)) private winningNumbersMap;

    /* 
        The Type of Guess
            * Numbers: The player must guess just the numbers
            * Order: The player must guess both the number and the order
    */
    mapping(uint256 => PotGuessType) private potGuessType;

    function initialize() public initializer {
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _setupRole(ADMIN, msg.sender);
        platformSharePercentage = 10;
        creatorSharesPercentage = 20;
        maxWinningNumbers = 10;
        maxWinners = 10;
    }

    function grantLottoCreator(address account) public override onlyRole(ADMIN) {
        grantRole(LOTTO_CREATOR, account);
    }

    function grantLottoPlayer(address account) public override onlyRole(ADMIN) {
        grantRole(LOTTO_PLAYER, account);
    }

    function grantAdmin(address account) public override onlyRole(ADMIN) {
        grantRole(ADMIN, account);
    }

    modifier is_valid_pot(Pot memory _pot) {
        require(creator[_pot.lotto.id] != _pot.lotto.creator, ERROR_4);
        require(_pot.potAmount > 0, ERROR_11);
        require(_pot.winningNumbers.length > 0, ERROR_12);
        require(_pot.winningNumbers.length <= 10, ERROR_33);
        _;
    }

    function addNewPot(Pot memory _pot)
        external
        override
        onlyRole(LOTTO_CREATOR)
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

    function isPotId(uint256 _potId) external view override returns (bool) {
        return isPot[_potId];
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
                    uint256 totalStaked = stakes[_potId].add(potAmount[_potId]);

                    // take platform's share
                    uint256 _platformShare = totalStaked
                        .mul(platformSharePercentage)
                        .div(100);

                    uint256 _creatorShares = totalStaked.sub(_platformShare);

                    isFinished[_potId] = true;
                    platformShare = platformShare.add(_platformShare);
                    platformShares[_potId] = _platformShare;
                    creatorShares[_potId] = _creatorShares;
                } else {
                    _findPotWinner(_potId, _player, _guesses);
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
            uint256 _creatorShares = totalStaked
                .mul(creatorSharesPercentage)
                .div(100);

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

    function forceEnd(uint256 _lottoId)
        external
        override
        onlyRole(ADMIN)
        returns (bool)
    {
        endTime[_lottoId] = block.timestamp;
        return true;
    }
}
