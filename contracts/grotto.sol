//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.4;

pragma experimental ABIEncoderV2;
import "hardhat/console.sol";
import "./libraries/models.sol";
import "./libraries/controllers/interface/controller.interface.sol";
import "./libraries/controllers/interface/storage.interface.sol";
import "./libraries/grotto.interface.sol";
import "./libraries/errors.sol";

contract Grotto is GrottoInterface {
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

    // TODO: Delete lotto admin call
    // TODO: Auto send to platform after every game play

    // ============================ EXTERNAL METHODS ============================
    function createLotto(
        uint256 _startTime,
        uint256 _endTime,
        uint256 _maxNumberOfPlayers,
        WinningType _winningType
    ) external payable {
        Lotto memory _lotto;
        Statistics memory stats = storageController.getStats();
        _lotto.creator = msg.sender;
        _lotto.startTime = _startTime;
        _lotto.endTime = _endTime;
        _lotto.maxNumberOfPlayers = _maxNumberOfPlayers;
        _lotto.winningType = _winningType;

        uint256 platformShares = (msg.value *
            storageController.getPlatformSharePercentage()) / 100;

        _lotto.betAmount = msg.value - platformShares;
        _lotto.stakes = _lotto.betAmount;
        (bool sent, ) = payable(owner).call{value: platformShares}("");
        require(sent, "CANCL");

        stats.totalPlatformShares += platformShares;

        uint256 _lottoId = lottoController.addNewLotto(_lotto);

        if (!storageController.isCreator(msg.sender)) {
            stats.totalCreators += 1;
            storageController.setCreator(msg.sender);
        }
        stats.totalGames += 1;
        storageController.setStats(stats);

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
        Statistics memory stats = storageController.getStats();
        Pot memory _pot;
        _lotto.creator = msg.sender;
        _lotto.startTime = _startTime;
        _lotto.endTime = _endTime;
        _lotto.maxNumberOfPlayers = _maxNumberOfPlayers;
        _lotto.winningType = _winningType;
        _pot.lotto = _lotto;
        _pot.winningNumbers = _winningNumbers;
        _pot.potGuessType = _pgt;
        _pot.potType = _potType;

        ControllerInterface _controller;
        if (_pot.potType == PotType.MULTIPLE_WINNER) {
            _controller = potController;
            stats.totalPot += 1;
        } else {
            _controller = singleWinnerPotController;
            stats.totalSingleWinnerPot += 1;
        }

        uint256 platformShares = (msg.value *
            storageController.getPlatformSharePercentage()) / 100;

        uint256 betAmountPlatforShare = (_betAmount *
            storageController.getPlatformSharePercentage()) / 100;
            
        _lotto.betAmount = _betAmount - betAmountPlatforShare;
        _lotto.stakes = msg.value - platformShares;
        _pot.potAmount = _lotto.stakes;

        (bool sent, ) = payable(owner).call{value: platformShares}("");
        require(sent, "CANCL");
        stats.totalPlatformShares += platformShares;

        uint256 _potId = _controller.addNewPot(_pot);

        if (!storageController.isCreator(msg.sender)) {
            stats.totalCreators += 1;
            storageController.setCreator(msg.sender);
        }
        stats.totalGames += 1;
        stats.totalPot += 1;

        storageController.setStats(stats);
        emit PotCreated(_potId);
    }

    function playLotto(uint256 _lottoId) external payable {
        Statistics memory stats = storageController.getStats();

        uint256 platformShares = (msg.value *
            storageController.getPlatformSharePercentage()) / 100;
        (bool sent, ) = payable(owner).call{value: platformShares}("");
        require(sent, "CANCL");
        stats.totalPlatformShares += platformShares;

        bool _result = lottoController.playLotto(
            _lottoId,
            msg.value - platformShares,
            msg.sender
        );

        stats.totalPlayed += msg.value;
        stats.totalPlayers += 1;
        storageController.setStats(stats);
        require(_result, ERROR_20);
        emit BetPlaced(_lottoId, msg.value, msg.sender);
    }

    function playSingleWinnerPot(uint256 _potId, uint256[] memory _guesses)
        external
        payable
    {
        Statistics memory stats = storageController.getStats();

        uint256 platformShares = (msg.value *
            storageController.getPlatformSharePercentage()) / 100;
        (bool sent, ) = payable(owner).call{value: platformShares}("");
        require(sent, "CANCL");
        stats.totalPlatformShares += platformShares;

        ControllerInterface _controller = singleWinnerPotController;
        bool _result = _controller.playPot(
            _potId,
            msg.value - platformShares,
            msg.sender,
            _guesses
        );
        stats.totalPlayed += msg.value;
        stats.totalPlayers += 1;
        storageController.setStats(stats);
        require(_result, ERROR_24);
        emit BetPlaced(_potId, msg.value, msg.sender);
    }

    function playPot(uint256 _potId, uint256[] memory _guesses)
        external
        payable
    {
        Statistics memory stats = storageController.getStats();

        uint256 platformShares = (msg.value *
            storageController.getPlatformSharePercentage()) / 100;
        (bool sent, ) = payable(owner).call{value: platformShares}("");
        require(sent, "CANCL");
        stats.totalPlatformShares += platformShares;

        ControllerInterface _controller = potController;
        bool _result = _controller.playPot(
            _potId,
            msg.value - platformShares,
            msg.sender,
            _guesses
        );

        stats.totalPlayed += msg.value;
        stats.totalPlayers += 1;
        storageController.setStats(stats);
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

        Statistics memory stats = storageController.getStats();
        stats.totalCreatorShares += _claim.winning;
        storageController.setStats(stats);

        emit CreatorClaimed(_lottoId);
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

        Statistics memory stats = storageController.getStats();
        stats.totalPlayerShares += _claim.winning;
        storageController.setStats(stats);

        emit Claimed(_lottoId);
    }

    function forceEnd(uint256 _lottoId) external {
        require(msg.sender == owner, ERROR_30);
        ControllerInterface _controller = _getController(_lottoId);
        require(_controller.forceEnd(_lottoId), ERROR_29);
    }

    /**
        Should only be called for timebased lottos and 
        should only be called by owner or a player and
        should only be callable if end time has passed
     */
    function endLotto(uint256 _lottoId) external {
        ControllerInterface _controller = _getController(_lottoId);
        require(_controller.endLotto(_lottoId, msg.sender), ERROR_29);
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

    // !!! This method can not go live. I repeat, this method can not go live. !!!
    function withdraw() external {
        require(msg.sender == owner, ERROR_30);
        (bool sent, ) = payable(owner).call{value: address(this).balance}("");
        require(sent, "CANCL");
    }
}
