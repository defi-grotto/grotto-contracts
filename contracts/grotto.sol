//SPDX-License-Identifier: Unlicense
pragma solidity 0.8.4;

pragma experimental ABIEncoderV2;
import "hardhat/console.sol";
import "./libraries/models.sol";
import "./libraries/controllers/controller.interface.sol";
import "./libraries/grotto.interface.sol";
import "./libraries/errors.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

contract Grotto is GrottoInterface, Initializable {
    // ============================ VARIABLES ============================
    address private lottoControllerAddress;
    address private potControllerAddress;

    ControllerInterface private lottoController;
    ControllerInterface private potController;

    address owner;

    // ============================ INITIALIZER ============================
    function initialize(
        address _lottoControllerAddress,
        address _potControllerAddress
    ) public initializer {
        owner = msg.sender;
        lottoControllerAddress = _lottoControllerAddress;
        lottoController = ControllerInterface(lottoControllerAddress);

        potControllerAddress = _potControllerAddress;
        potController = ControllerInterface(potControllerAddress);
    }

    // ============================ EXTERNAL METHODS ============================
    function createLotto(Lotto memory _lotto) external payable {
        _lotto.betAmount = msg.value;
        _lotto.stakes = msg.value;
        _lotto.creator = msg.sender;
        bool _result = lottoController.addNewLotto(_lotto);
        require(_result, ERROR_9);
        emit LottoCreated(_lotto);
    }

    function createPot(Pot memory _pot) external payable {
        _pot.lotto.creator = msg.sender;
        _pot.potAmount = msg.value;
        _pot.lotto.stakes = msg.value;
        bool _result = potController.addNewPot(_pot);
        require(_result, ERROR_13);
        emit PotCreated(_pot);
    }

    function playLotto(uint256 _lottoId) external payable {
        bool _result = lottoController.playLotto(
            _lottoId,
            msg.value,
            msg.sender
        );
        require(_result, ERROR_20);
        emit BetPlaced(_lottoId, msg.value, msg.sender);
    }

    function playPot(uint256 _potId, uint256[] memory _guesses)
        external
        payable
    {
        bool _result = potController.playPot(
            _potId,
            msg.value,
            msg.sender,
            _guesses
        );
        require(_result, ERROR_24);
        emit BetPlaced(_potId, msg.value, msg.sender);
    }

    function claimCreator(uint256 _lottoId) external payable {
        ControllerInterface _controller = _getController(_lottoId);
        Claim memory _claim = _controller.creatorClaim(_lottoId);

        require(_claim.winner != address(0), ERROR_34);
        require(_claim.winning != 0, ERROR_35);

        payable(_claim.winner).transfer(_claim.winning);
        
        emit CreatorClaimed(_lottoId);
    }

    function claim(uint256 _lottoId) external payable {
        ControllerInterface _controller = _getController(_lottoId);
        Claim memory _claim = _controller.claimWinning(_lottoId, msg.sender);

        // it's possible that there's no winner for pots
        if (_claim.winner != address(0) && _claim.winning > 0) {
            payable(_claim.winner).transfer(_claim.winning);
        }

        emit Claimed(_lottoId);
    }

    function forceEnd(uint256 _lottoId) external {
        require(msg.sender == owner, ERROR_30);
        ControllerInterface _controller = _getController(_lottoId);
        require(_controller.forceEnd(_lottoId), ERROR_29);
    }

    // ============================ EXTERNAL VIEW METHODS ============================
    function getLottoById(uint256 _lottoId)
        external
        view
        returns (Lotto memory)
    {
        return lottoController.getLottoById(_lottoId);
    }

    function getPotById(uint256 _potId) external view returns (Pot memory) {
        return potController.getPotById(_potId);
    }

    function getTotalStaked(uint256 _lottoId) external view returns (uint256) {
        ControllerInterface controller = _getController(_lottoId);
        return controller.getTotalStaked(_lottoId);
    }

    // ============================ PRIVATE VIEW METHODS ============================
    function _getController(uint256 _lottoId)
        private
        view
        returns (ControllerInterface)
    {
        ControllerInterface _controller;
        if (
            address(lottoController) != address(0) &&
            lottoController.isLottoId(_lottoId)
        ) {
            _controller = lottoController;
        } else if (
            address(potController) != address(0) &&
            potController.isPotId(_lottoId)
        ) {
            _controller = potController;
        }

        return _controller;
    }
}
