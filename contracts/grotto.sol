//SPDX-License-Identifier: Unlicense
pragma solidity 0.8.4;

pragma experimental ABIEncoderV2;
import "hardhat/console.sol";
import "./libraries/models.sol";
import "./libraries/controllers/interface/controller.interface.sol";
import "./libraries/controllers/interface/storage.interface.sol";
import "./libraries/grotto.interface.sol";
import "./libraries/errors.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

contract Grotto is GrottoInterface, Initializable {
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
    function initialize(
        address _lottoControllerAddress,
        address _potControllerAddress,
        address _singleWinnerPotControllerAddress,
        address _storageControllerAddress
    ) public initializer {
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

    // ============================ EXTERNAL METHODS ============================
    function createLotto(
        uint256 _startTime,
        uint256 _endTime,
        uint256 _maxNumberOfPlayers,
        WinningType _winningType
    ) external payable {
        Lotto memory _lotto;
        _lotto.betAmount = msg.value;
        _lotto.stakes = msg.value;
        _lotto.creator = msg.sender;
        _lotto.startTime = _startTime;
        _lotto.endTime = _endTime;
        _lotto.maxNumberOfPlayers = _maxNumberOfPlayers;
        _lotto.winningType = _winningType;

        uint256 creatorFees = storageController.getCreatorFees();
        _lotto.stakes = msg.value - creatorFees;
        bool sent = false;
        (sent, ) = payable(owner).call{value: creatorFees}("");
        require(sent, "CANCL");

        uint256 _lottoId = lottoController.addNewLotto(_lotto);

        emit LottoCreated(_lottoId);
    }

    function createPot(
        uint256 _startTime,
        uint256 _endTime,
        uint256 _maxNumberOfPlayers,
        uint256 _betAmount,
        WinningType _winningType,
        uint256[] memory _winningNumbers,
        PotGuessType _pgt,
        PotType _potType
    ) external payable {
        Lotto memory _lotto;
        Pot memory _pot;
        _lotto.creator = msg.sender;
        _pot.potAmount = msg.value;
        _lotto.stakes = msg.value;
        _lotto.startTime = _startTime;
        _lotto.endTime = _endTime;
        _lotto.maxNumberOfPlayers = _maxNumberOfPlayers;
        _lotto.winningType = _winningType;
        _lotto.betAmount = _betAmount;
        _pot.lotto = _lotto;
        _pot.winningNumbers = _winningNumbers;
        _pot.potGuessType = _pgt;
        _pot.potType = _potType;

        ControllerInterface _controller;
        if (_pot.potType == PotType.MULTIPLE_WINNER) {
            _controller = potController;
        } else {
            _controller = singleWinnerPotController;
        }
        uint256 creatorFees = storageController.getCreatorFees();
        _pot.potAmount = msg.value - creatorFees;
        bool sent = false;
        (sent, ) = payable(owner).call{value: creatorFees}("");
        require(sent, "CANCL");

        uint256 _potId = _controller.addNewPot(_pot);
        emit PotCreated(_potId);
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

    function playSingleWinnerPot(uint256 _potId, uint256[] memory _guesses)
        external
        payable
    {
        ControllerInterface _controller = singleWinnerPotController;
        bool _result = _controller.playPot(
            _potId,
            msg.value,
            msg.sender,
            _guesses
        );
        require(_result, ERROR_24);
        emit BetPlaced(_potId, msg.value, msg.sender);
    }

    function playPot(uint256 _potId, uint256[] memory _guesses)
        external
        payable
    {
        ControllerInterface _controller = potController;
        bool _result = _controller.playPot(
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

        bool sent = false;
        (sent, ) = payable(_claim.winner).call{value: _claim.winning}("");
        require(sent, "CANCL");

        emit CreatorClaimed(_lottoId);
    }

    function claimPlatform(uint256 _lottoId) external payable {
        ControllerInterface _controller = _getController(_lottoId);
        Claim memory _claim = _controller.platformClaim(_lottoId);

        require(_claim.winning != 0, ERROR_35);

        bool sent = false;
        (sent, ) = payable(owner).call{value: _claim.winning}("");
        require(sent, "CANCL");

        emit PlatformClaimed(_lottoId);
    }

    function claim(uint256 _lottoId) external payable {
        ControllerInterface _controller = _getController(_lottoId);
        Claim memory _claim = _controller.claimWinning(_lottoId, msg.sender);

        // it's possible that there's no winner for pots
        if (_claim.winner != address(0) && _claim.winning > 0) {
            bool sent = false;
            (sent, ) = payable(_claim.winner).call{value: _claim.winning}("");
            require(sent, "CANCL");
        }

        emit Claimed(_lottoId);
    }

    function forceEnd(uint256 _lottoId) external {
        require(msg.sender == owner, ERROR_30);
        ControllerInterface _controller = _getController(_lottoId);
        require(_controller.forceEnd(_lottoId), ERROR_29);
    }

    function getAllLottos() external view returns (uint256[] memory) {
        return storageController.getAllIds();
    }

    function getCompletedLottos() external view returns (uint256[] memory) {
        return storageController.getCompletedIds();
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
