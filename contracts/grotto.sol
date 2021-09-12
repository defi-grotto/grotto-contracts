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
    ERROR_9: result from savePot must be true
 */

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
        bool result = store.saveLotto(lotto);
        require(result, "ERROR_9");
        emit LottoCreated(lotto);
    }

    function createPot(Pot memory pot) external payable {
        pot.potAmount = msg.value;
        bool result = store.savePot(pot);
        require(result, "ERROR_13");
        emit PotCreated(pot);
    }    

    function play() external payable {
        
    }

    function claim() external payable {

    }

    function getLottos() external view returns (uint256[] memory) {
        return store.getLottos();
    }

    function getPots() external view returns (uint256[] memory) {
        return store.getPots();
    }    
}