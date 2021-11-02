//SPDX-License-Identifier: Unlicense
pragma solidity 0.8.4;

import "../models.sol";
import "./base.controller.sol";
import "../errors.sol";
import "hardhat/console.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

/* TODO: 
    Multiple winners possible
    Strictly time based
*/
contract PotController is BaseController, AccessControlUpgradeable {
    using SafeMath for uint256;

    // ============================ VARIABLES ============================
    // how much the pot creator is putting up, the pot winner(s) takes this money + all money staked
    mapping(uint256 => uint256) private potAmount;    
    mapping(uint256 => uint256[]) private winningNumbers;
    mapping(uint256 => mapping(uint256 => bool)) private winningNumbersMap;
    mapping(uint256 => address[]) private winners;    
    mapping(uint256 => uint256) private winningsPerWinner;
    mapping(uint256 => mapping(address => bool)) private winningClaimed;

    /* 
        The Type of Guess
            * Numbers: The player must guess just the numbers
            * Order: The player must guess both the number and the order
    */
    mapping(uint256 => PotGuessType) private potGuessType;

    // ============================ INITIALIZER ============================
    function initialize() public initializer {
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _setupRole(ADMIN, msg.sender);
        platformSharePercentage = 10;
        creatorSharesPercentage = 20;
        maxWinningNumbers = 10;
        maxWinners = 10;
    }

    // ============================ GRANTS ============================
    function grantLottoCreator(address _account)
        public
        override
        onlyRole(ADMIN)
    {
        grantRole(LOTTO_CREATOR, _account);
    }

    function grantLottoPlayer(address _account) public override onlyRole(ADMIN) {
        grantRole(LOTTO_PLAYER, _account);
    }

    function grantAdmin(address _account) public override onlyRole(ADMIN) {
        grantRole(ADMIN, _account);
    }

    // ============================ MODIFIERS ============================
    modifier is_valid_pot(Pot memory _pot) {
        require(creator[_pot.lotto.id] != _pot.lotto.creator, ERROR_4);
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
        checkIfWinner(_potId, _player, _guesses);
        return true;
    }

    function checkIfWinner(
        uint256 _potId,
        address _player,
        uint256[] memory _guesses
    ) private {
        bool _won = true;
        if (potGuessType[_potId] == PotGuessType.NUMBERS) {
            // just check that all guesses exists in winning numbers
            for (uint256 i = 0; i < _guesses.length; i = i.add(1)) {
                if (winningNumbersMap[_potId][_guesses[i]] == false) {
                    _won = false;
                    break;
                }
            }
        } else if (potGuessType[_potId] == PotGuessType.ORDER) {
            for (uint256 i = 0; i < _guesses.length; i = i.add(1)) {
                if (_guesses[i] != winningNumbers[_potId][i]) {
                    _won = false;
                    break;
                }
            }
        }

        if (_won) {
            winners[_potId].push(_player);
            isWinner[_potId][_player] = true;
        }
    }

    function claimWinning(uint256 _potId, address _claimer)
        external
        override
        returns (Claim memory)
    {
        require(startTime[_potId] <= block.timestamp, ERROR_14);
        require(endTime[_potId] <= block.timestamp, ERROR_22);

        require(isWinner[_potId][_claimer], ERROR_27);
        require(winningClaimed[_potId][_claimer] == false, ERROR_26);        

        if (isClaimed[_potId] == false) {
            // no one has claimed, calculate winners claims
            uint256 _totalStaked = stakes[_potId];
            // take platform's share
            uint256 _platformShare = _totalStaked
                .mul(platformSharePercentage)
                .div(100);

            uint256 _totalWinners = winners[_potId].length;
            uint256 _creatorShare = _totalStaked
                .mul(creatorSharesPercentage)
                .div(100);

            if (_totalWinners <= 0) {
                _creatorShare = _totalStaked.sub(_platformShare);
            } else {
                winningsPerWinner[_potId] = (
                    _totalStaked.sub(_platformShare).sub(_creatorShare)
                ).div(_totalWinners);
            }

            creatorShares[_potId] = _creatorShare;

            isClaimed[_potId] = true;
        }

        winningClaimed[_potId][_claimer] = true;
        isFinished[_potId] = true;
        
        return
            Claim({
                winner: _claimer,
                winning: winningsPerWinner[_potId]
            });
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

    function creatorClaim(uint256 _potId) override external returns (Claim memory) {
        if(winners[_potId].length > 0) {   
            require(isClaimed[_potId], ERROR_36);
            require(creatorClaimed[_potId] == false, ERROR_37);
        }

        creatorClaimed[_potId] = true;
        return Claim({winner: creator[_potId], winning: creatorShares[_potId]});
    }

    // ============================ EXTERNAL VIEW METHODS ============================
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
        Lotto memory _lotto = Lotto({
            id: lottoId[_potId],
            creator: creator[_potId],
            creatorShares: creatorShares[_potId],
            startTime: startTime[_potId],
            endTime: endTime[_potId],
            maxNumberOfPlayers: 0,
            betAmount: betAmount[_potId],
            winningType: winningType[_potId],
            isFinished: isFinished[_potId],
            stakes: stakes[_potId],
            players: players[_potId],
            winner: winner[_potId],
            winning: winning[_potId]
        });

        Pot memory _pot = Pot({
            lotto: _lotto,
            potAmount: potAmount[_potId],
            winningNumbers: winningNumbers[_potId],
            potGuessType: potGuessType[_potId],
            winners: winners[_potId],
            winningsPerWinner: winningsPerWinner[_potId]
        });

        return _pot;
    }

    function getPotWinning(uint256 _potId) external view returns (uint256) {
        return winningsPerWinner[_potId];
    }
}
