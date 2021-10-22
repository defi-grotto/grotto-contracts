//SPDX-License-Identifier: Unlicense
pragma solidity 0.8.3;
pragma experimental ABIEncoderV2;
import "hardhat/console.sol";
import "./libraries/models.sol";
import "./libraries/storage.interface.sol";
import "./libraries/grotto.interface.sol";
import "./libraries/errors.sol";


contract Grotto is GrottoInterface {
    address private creator;

    address private storeAddress = address(0);

    StorageInterface private store;

    constructor(address _storeAddress) {
        creator = msg.sender;
        storeAddress = _storeAddress;
        store = StorageInterface(storeAddress);

        store.setGrotto(address(this), creator);
    }

    function createLotto(Lotto memory lotto) external payable {
        lotto.betAmount = msg.value;        
        bool result = store.addNewLotto(lotto);
        require(result, ERROR_9);
        emit LottoCreated(lotto);
    }

    function createPot(Pot memory pot) external payable {
        pot.potAmount = msg.value;
        bool result = store.addNewPot(pot);
        require(result, ERROR_13);
        emit PotCreated(pot);
    }

    function playLotto(uint256 lottoId) external payable {
        bool result = store.playLotto(lottoId, msg.value, msg.sender);
        require(result, ERROR_20);
        emit BetPlaced(lottoId, msg.value, msg.sender);
    }     

    function playPot(uint256 potId) external payable {
        bool result = store.playPot(potId, msg.value, msg.sender);
        require(result, ERROR_24);
        emit BetPlaced(potId, msg.value, msg.sender);        
    }    

    function findWinners(uint256 lottoId) external {
        
    }

    function claim(uint256 lottoId) external payable {
        address claimer = msg.sender;
        require(store.claimLottoWinnings(lottoId));

        (address winner, uint256 winning) = store.findClaimer(lottoId, claimer);

        require(winner != address(0), ERROR_27);
        require(winning != 0, ERROR_28);        

        payable(winner).transfer(winning);
        
        emit Claimed(lottoId);
    }

    function getLottoById(uint256 lottoId) external view returns (Lotto memory) {
        return store.getLottoById(lottoId);
    }

    function getPotById(uint256 potId) external view returns (Pot memory) {
        return store.getPotById(potId);
    }

    function forceEndLotto(uint256 lottoId) external {
        require(msg.sender == creator, ERROR_30);
        require(store.forceEndLotto(lottoId), ERROR_29);    
    }

    function getTime() external view returns (uint256) {
        return block.timestamp;
    }
}