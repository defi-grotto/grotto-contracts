//SPDX-License-Identifier: Unlicense
pragma solidity 0.8.3;
pragma experimental ABIEncoderV2;
import "hardhat/console.sol";
import "./libraries/models.sol";
import "./libraries/storage.interface.sol";
import "./libraries/grotto.interface.sol";

/**
    ERROR_1: 
    ERROR_2: Called setGrotto on Storage with wrong parameters
    ERROR_3: Attempt to call Storage method with wrong grotto address
    ERROR_4: Lotto with same ID and Creator already exists
    ERROR_5: Winnershares length does not match number of winners
    ERROR_6: Start time must be less than end time
    ERROR_7: Can not create a lotto with 0 bet amount
    ERROR_8: number of players must be greater than 0 for NUMBER_OF_PLAYERS winning type
    ERROR_9: result from saveLotto must be true
    ERROR_10: end time muxt be in the future
    ERROR_11: pot amount must be greater than 0
    ERROR_12: pot winning numbers must be at least 1
    ERROR_13: result from savePot must be true
    ERROR_14: Lotto is not started
    ERROR_15: Lotto has ended
    ERROR_16: Max Number of Players reached
    ERROR_17: Lotto is finished
    ERROR_18: betPlaced is too low
    ERROR_19: Lotto does not exist
    ERROR_20: result from playLotto is false
    ERROR_21: creator can not play
    ERROR_22: Lotto is not finished
    ERROR_23: Lotto is already claimed
    ERROR_24: result from playPot is false
    ERROR_25: Not more than 10 winners per lotto/pot
    ERROR_26: Sum of winningShares array elements must be 100 (100%)
    ERROR_27: Claimer is not a winner
    ERROR_28: Winning is zero
 **/

contract Grotto is GrottoInterface {
    address private caller;

    address private storeAddress = address(0);

    StorageInterface private store;

    constructor(address _storeAddress) {
        caller = msg.sender;
        storeAddress = _storeAddress;
        store = StorageInterface(storeAddress);

        store.setGrotto(address(this), caller);
    }

    function createLotto(Lotto memory lotto) external payable {
        lotto.betAmount = msg.value;        
        bool result = store.addNewLotto(lotto);
        require(result, "ERROR_9");
        emit LottoCreated(lotto);
    }

    function createPot(Pot memory pot) external payable {
        pot.potAmount = msg.value;
        bool result = store.addNewPot(pot);
        require(result, "ERROR_13");
        emit PotCreated(pot);
    }

    function playLotto(uint256 lottoId) external payable {
        bool result = store.playLotto(lottoId, msg.value, msg.sender);
        require(result, "ERROR_20");
        emit BetPlaced(lottoId, msg.value, msg.sender);
    }     

    function playPot(uint256 potId) external payable {
        bool result = store.playPot(potId, msg.value, msg.sender);
        require(result, "ERROR_24");
        emit BetPlaced(potId, msg.value, msg.sender);        
    }    

    function claim(uint256 lottoId) external payable {
        address claimer = msg.sender;
        require(store.claimLottoWinnings(lottoId));

        (address winner, uint256 winning) = store.findClaimer(lottoId, claimer);

        require(winner != address(0), "ERROR_27");
        require(winning != 0, "ERROR_28");        

        payable(winner).transfer(winning);
        
        emit Claimed(lottoId);
    }

    function getLottoById(uint256 lottoId) external view returns (Lotto memory) {
        return store.getLottoById(lottoId);
    }

    function getPotById(uint256 potId) external view returns (Pot memory) {
        return store.getPotById(potId);
    }
}