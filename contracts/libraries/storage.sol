//SPDX-License-Identifier: Unlicense
pragma solidity 0.8.3;
import "./models.sol";
import "./storage.interface.sol";
import "hardhat/console.sol";

contract Storage is StorageInterface {
    Lotto[] private runningLottos;
    mapping(uint256 => Lotto) private lottoIdMap;
    Pot[] private runningPots;
    mapping(uint256 => Pot) private potIdMap;
    FinishedLotto[] private finishedLottos;
    mapping(uint256 => FinishedLotto) private finishedLottoIdMap;

    address private grotto = address(0);
    address private grottoCaller = address(0);

    modifier is_authorized() {
        require(msg.sender == grotto, "ERROR_3");
        _;
    }

    modifier is_valid_lotto(Lotto memory _lotto) {
        require(_lotto.betAmount > 0, "ERROR_7");
        Lotto memory savedLotto = lottoIdMap[_lotto.id];
        require(savedLotto.creator != _lotto.creator, "ERROR_4");
        require(
            _lotto.numberOfWinners == _lotto.winnersShares.length,
            "ERROR_5"
        );

        if (_lotto.winningType == WinningType.TIME_BASED) {
            require(_lotto.startTime < _lotto.endTime, "ERROR_6");
            require(_lotto.endTime > block.timestamp, "ERROR_10");
        }

        if (_lotto.winningType == WinningType.NUMBER_OF_PLAYERS) {
            require(_lotto.numberOfPlayers > 0, "ERROR_8");
        }
        _;
    }

    modifier is_valid_pot(Pot memory _pot) {
        Pot memory savedPot = potIdMap[_pot.lotto.id];
        require(savedPot.lotto.creator != _pot.lotto.creator, "ERROR_4");        
        require(_pot.potAmount > 0, "ERROR_11");
        require(_pot.winningNumbers.length > 0, "ERROR_12");
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
            revert("ERROR_2");
        }
    }

    function saveLotto(Lotto memory _lotto)
        external
        override
        is_authorized
        is_valid_lotto(_lotto)
        returns (bool)
    {
        lottoIdMap[_lotto.id] = _lotto;
        runningLottos.push(_lotto);

        return true;
    }

    function savePot(Pot memory _pot)
        external
        override
        is_authorized
        is_valid_lotto(_pot.lotto)
        is_valid_pot(_pot)
        returns (bool)
    {
        potIdMap[_pot.lotto.id] = _pot;
        runningPots.push(_pot);

        return true;
    }

    function getRunningPots() external view override returns (Pot[] memory) {
        return runningPots;
    }

    function getRunningLottos()
        external
        view
        override
        returns (Lotto[] memory)
    {
        return runningLottos;
    }
}
