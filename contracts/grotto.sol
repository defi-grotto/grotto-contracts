//SPDX-License-Identifier: Unlicense
pragma solidity 0.8.3;
pragma experimental ABIEncoderV2;
import "hardhat/console.sol";
import "./libraries/models.sol";
import "./libraries/controller.interface.sol";
import "./libraries/grotto.interface.sol";
import "./libraries/errors.sol";


contract Grotto is GrottoInterface {
    address private creator;

    address private storeAddress = address(0);

    ControllerInterface private controller;

    constructor(address _storeAddress, address _owner) {
        creator = msg.sender;
        storeAddress = _storeAddress;
        controller = ControllerInterface(storeAddress);

        controller.setGrotto(address(this), creator);
        controller.setPlatformOwner(_owner, creator);
    }

    function createLotto(Lotto memory lotto) external payable {
        lotto.betAmount = msg.value;   
        lotto.creator = msg.sender;     
        bool result = controller.addNewLotto(lotto);
        require(result, ERROR_9);
        emit LottoCreated(lotto);
    }

    function createPot(Pot memory pot) external payable {
        pot.lotto.creator = msg.sender;     
        pot.potAmount = msg.value;
        bool result = controller.addNewPot(pot);
        require(result, ERROR_13);
        emit PotCreated(pot);
    }

    function playLotto(uint256 lottoId) external payable {
        bool result = controller.playLotto(lottoId, msg.value, msg.sender);
        require(result, ERROR_20);
        emit BetPlaced(lottoId, msg.value, msg.sender);
    }     

    function playPot(uint256 potId, uint256[] memory guesses) external payable {
        bool result = controller.playPot(potId, msg.value, msg.sender, guesses);
        require(result, ERROR_24);
        emit BetPlaced(potId, msg.value, msg.sender);        
    }    

    function findWinners(uint256 lottoId) external {
        
    }

    function claim(uint256 lottoId) external payable {
        address claimer = msg.sender;
        require(controller.claimWinnings(lottoId));

        (address winner, uint256 winning) = controller.findClaimer(lottoId, claimer);

        require(winner != address(0), ERROR_27);
        require(winning != 0, ERROR_28);        

        payable(winner).transfer(winning);
        
        emit Claimed(lottoId);
    }

    function getLottoById(uint256 lottoId) external view returns (Lotto memory) {
        return controller.getLottoById(lottoId);
    }

    function getPotById(uint256 potId) external view returns (Pot memory) {
        return controller.getPotById(potId);
    }

    function forceEndLotto(uint256 lottoId) external {
        require(msg.sender == creator, ERROR_30);
        require(controller.forceEndLotto(lottoId), ERROR_29);    
    }

    function getTime() external view returns (uint256) {
        return block.timestamp;
    }
}