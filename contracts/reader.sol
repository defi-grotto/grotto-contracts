//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.4;

pragma experimental ABIEncoderV2;
import "hardhat/console.sol";
import "./libraries/models.sol";
import "./libraries/controllers/interface/controller.interface.sol";
import "./libraries/controllers/interface/storage.interface.sol";
import "./libraries/grotto.interface.sol";
import "./libraries/errors.sol";

contract Reader {
    // ============================ VARIABLES ============================
    address private lottoControllerAddress;
    address private potControllerAddress;
    address private singleWinnerPotControllerAddress;
    address private storageControllerAddress;

    ControllerInterface private lottoController;
    ControllerInterface private potController;
    ControllerInterface private singleWinnerPotController;
    StorageInterface private storageController;

    address owner;

    // ============================ INITIALIZER ============================
    constructor(
        address _lottoControllerAddress,
        address _potControllerAddress,
        address _singleWinnerPotControllerAddress,
        address _storageControllerAddress
    ) {
        owner = msg.sender;
        lottoControllerAddress = _lottoControllerAddress;
        lottoController = ControllerInterface(lottoControllerAddress);
        potControllerAddress = _potControllerAddress;
        potController = ControllerInterface(potControllerAddress);
        singleWinnerPotControllerAddress = _singleWinnerPotControllerAddress;
        singleWinnerPotController = ControllerInterface(
            singleWinnerPotControllerAddress
        );
        storageControllerAddress = _storageControllerAddress;
        storageController = StorageInterface(_storageControllerAddress);
    }

    function getLottos() external view returns (uint256[] memory) {
        return lottoController.getAllLottos();
    }

    function getCompletedLottos() external view returns (uint256[] memory) {
        return lottoController.getCompletedLottos();
    }

    function getPots() external view returns (uint256[] memory) {
        return potController.getAllPots();
    }

    function getCompletedPots() external view returns (uint256[] memory) {
        return potController.getCompletedPots();
    }

    function getSingleWinnerPots() external view returns (uint256[] memory) {
        return singleWinnerPotController.getAllPots();
    }
 
    function getSingleWinnerCompletedPots() external view returns (uint256[] memory) {
        return singleWinnerPotController.getCompletedPots();
    }    

    function getLottoById(uint256 _lottoId)
        external
        view
        returns (Lotto memory)
    {
        return lottoController.getLottoById(_lottoId);
    }

    function getPotById(uint256 _potId) external view returns (Pot memory) {
        ControllerInterface _controller = _getController(_potId);
        return _controller.getPotById(_potId);
    }

    

    // ============================ PRIVATE VIEW METHODS ============================
    function _getController(uint256 _lottoId)
        private
        view
        returns (ControllerInterface)
    {
        ControllerInterface _controller;
        if (lottoController.isLottoId(_lottoId)) {
            _controller = lottoController;
        } else if (potController.isPotId(_lottoId)) {
            _controller = potController;
        } else if (singleWinnerPotController.isPotId(_lottoId)) {
            _controller = singleWinnerPotController;
        }

        return _controller;
    }
}
