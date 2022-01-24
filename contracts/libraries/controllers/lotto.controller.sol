//SPDX-License-Identifier: Unlicense
pragma solidity 0.8.11;

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
        creatorSharesPercentage = 20;
        maxWinningNumbers = 10;
        maxWinners = 10;
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

        activeIdsMap[_lotto.id] = true;

        return true;
    }

    // ============================ EXTERNAL VIEW METHODS ============================
    function isLottoId(uint256 _lottoId) external view override returns (bool) {
        return isPot[_lottoId] == false;
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

    // ============================ EXTERNAL METHODS ============================
    function claimWinning(uint256 _lottoId, address _claimer)
        external
        override
        returns (Claim memory)
    {
        require(isFinished[_lottoId], ERROR_22);
        require(!isClaimed[_lottoId], ERROR_23);
        require(isWinner[_lottoId][_claimer], ERROR_27);
        isClaimed[_lottoId] = true;

        activeIdsMap[_lottoId] = false;
        completedIds.push(_lottoId);

        userClaims[_claimer].push(_lottoId);
        
        return Claim({winner: winner[_lottoId], winning: winning[_lottoId]});
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
        stakes[_lottoId] = stakes[_lottoId].add(_betPlaced);
        players[_lottoId].push(_player);

        if(!playedIn[_player][_lottoId]) {
            participated[_player].push(_lottoId);
            playedIn[_player][_lottoId] = true;
        }

        findLottoWinner(_lottoId);        
        return true;
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

    function platformClaim(uint256 _lottoId)
        external
        override
        returns (Claim memory)
    {
        require(platformClaimed[_lottoId] == false, ERROR_37);
        require(startTime[_lottoId] <= block.timestamp, ERROR_14);
        require(endTime[_lottoId] <= block.timestamp, ERROR_22);
        
        platformClaimed[_lottoId] = true;
        return Claim({winner: address(0), winning: platformShares[_lottoId]});        
    }
    

    function creatorClaim(uint256 _lottoId)
        external
        virtual
        override
        returns (Claim memory)
    {
        require(creatorClaimed[_lottoId] == false, ERROR_37);
        require(startTime[_lottoId] <= block.timestamp, ERROR_14);
        require(endTime[_lottoId] <= block.timestamp, ERROR_22);
        creatorClaimed[_lottoId] = true;
        return Claim({winner: creator[_lottoId], winning: creatorShares[_lottoId]});        
    }

    // ============================ PRIVATE METHODS ============================
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
                    uint256 totalStaked = stakes[_lottoId];

                    // take platform's share
                    uint256 _platformShare = totalStaked
                        .mul(platformSharePercentage)
                        .div(100);
                    uint256 _creatorShares = totalStaked
                        .mul(creatorSharesPercentage)
                        .div(100);

                    totalStaked = totalStaked.sub(_platformShare).sub(
                        _creatorShares
                    );

                    bytes32 randBase = keccak256(abi.encode(players[0]));
                    randBase = keccak256(
                        abi.encode(
                            randBase,
                            players[players[_lottoId].length.div(2)]
                        )
                    );
                    randBase = keccak256(
                        abi.encode(
                            randBase,
                            players[players[_lottoId].length.sub(1)]
                        )
                    );

                    uint256 winnerIndex = uint256(
                        keccak256(abi.encode(totalStaked, randBase))
                    ) % (players[_lottoId].length);

                    address lottoWinner = players[_lottoId][winnerIndex];
                    winner[_lottoId] = lottoWinner;
                    winning[_lottoId] = totalStaked;
                    isFinished[_lottoId] = true;

                    isWinner[_lottoId][lottoWinner] = true;

                    platformShares[_lottoId] = _platformShare;
                    creatorShares[_lottoId] = _creatorShares;

                    // TODO: Reward both winner and creator with grotto tokens
                }
            }
        }
    }
}
