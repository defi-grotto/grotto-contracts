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

    function setGrotto(address _grotto, address _grottoCaller) external override {
        if(grotto == address(0) && grottoCaller == address(0)) {
            grotto = _grotto;
            grottoCaller = _grottoCaller;
        } else if(grottoCaller == _grottoCaller) {
            grotto = _grotto;
        } else {
            revert("ERROR_2");
        }
    }

    function saveLotto(Lotto memory _lotto) external override returns (bool) {
        require(msg.sender == grotto, "ERROR_3");
        Lotto memory savedLotto = lottoIdMap[_lotto.id];
        require(savedLotto.creator != _lotto.creator, "ERROR_4");
        require(_lotto.numberOfWinners == _lotto.winnersShares.length, "ERROR_5");

        if (_lotto.winningType == WinningType.TIME_BASED) {
            require(_lotto.startTime < _lotto.endTime, "ERROR_6");
            require(_lotto.endTime > block.timestamp, "ERROR_10");
        }

        if (_lotto.winningType == WinningType.NUMBER_OF_PLAYERS) {
            require(_lotto.numberOfPlayers > 0, "ERROR_8");
        }        

        require(_lotto.betAmount > 0, "ERROR_7");

        lottoIdMap[_lotto.id] = _lotto;
        runningLottos.push(_lotto);

        return true;
    }

    function getRunningLottos() external view override returns (Lotto[] memory){
        return runningLottos;
    }
}
