//SPDX-License-Identifier: Unlicense
pragma solidity 0.8.4;

pragma experimental ABIEncoderV2;
import "hardhat/console.sol";
import "./libraries/models.sol";
import "./libraries/controller.interface.sol";
import "./libraries/grotto.interface.sol";
import "./libraries/errors.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";



contract Grotto is GrottoInterface, OwnableUpgradeable {
    address private lottoControllerAddress;
    address private potControllerAddress;

    ControllerInterface private lottoController;    
    ControllerInterface private potController;    

    function initialize(address _lottoControllerAddress, address _potControllerAddress) public initializer {
        lottoControllerAddress = _lottoControllerAddress;
        lottoController = ControllerInterface(lottoControllerAddress);

        potControllerAddress = _potControllerAddress;
        potController = ControllerInterface(potControllerAddress);        
    }

    function createLotto(Lotto memory lotto) external payable {
        lotto.betAmount = msg.value;   
        lotto.stakes = msg.value;
        lotto.creator = msg.sender;             
        bool result = lottoController.addNewLotto(lotto);
        require(result, ERROR_9);
        emit LottoCreated(lotto);
    }

    function createPot(Pot memory pot) external payable {
        pot.lotto.creator = msg.sender;     
        pot.potAmount = msg.value;
        bool result = potController.addNewPot(pot);
        require(result, ERROR_13);
        emit PotCreated(pot);
    }

    function playLotto(uint256 lottoId) external payable {
        bool result = lottoController.playLotto(lottoId, msg.value, msg.sender);
        require(result, ERROR_20);
        emit BetPlaced(lottoId, msg.value, msg.sender);
    }     

    function playPot(uint256 potId, uint256[] memory guesses) external payable {
        bool result = potController.playPot(potId, msg.value, msg.sender, guesses);
        require(result, ERROR_24);
        emit BetPlaced(potId, msg.value, msg.sender);        
    }    

    function findWinners(uint256 lottoId) external {
        
    }

    function claim(uint256 lottoId) external payable {        
        ControllerInterface controller;
        if(lottoController.isLottoId(lottoId)) {
            controller = lottoController;
        } else if(potController.isPotId(lottoId)) {
            controller = potController;
        }

        require(controller.setClaimed(lottoId));

        Claim memory _claim = controller.getClaim(lottoId);

        require(_claim.creator != address(0), ERROR_34);
        require(_claim.creatorShares != 0, ERROR_35);                

        // it's possible that there's no winner for pots
        if(_claim.winner != address(0) && _claim.winning > 0) {
            payable(_claim.winner).transfer(_claim.winning);
        }   

        payable(_claim.creator).transfer(_claim.creatorShares);
        
        emit Claimed(lottoId);
    }

    function getLottoById(uint256 lottoId) external view returns (Lotto memory) {
        return lottoController.getLottoById(lottoId);
    }

    function getPotById(uint256 potId) external view returns (Pot memory) {
        return potController.getPotById(potId);
    }

    function forceEndLotto(uint256 lottoId) external onlyOwner {
        ControllerInterface controller;
        if(lottoController.isLottoId(lottoId)) {
            controller = lottoController;
        } else if(potController.isPotId(lottoId)) {
            controller = potController;
        }

        require(controller.forceEnd(lottoId), ERROR_29);    
    }
}