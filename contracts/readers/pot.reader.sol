//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.4;

pragma experimental ABIEncoderV2;
import "../libraries/models.sol";
import "../libraries/controllers/interface/controller.interface.sol";
import "../libraries/controllers/interface/storage.interface.sol";
import "../libraries/grotto.interface.sol";
import "../libraries/errors.sol";

contract PotReader {
    // ============================ VARIABLES ============================
    address private potControllerAddress;
    address private singleWinnerPotControllerAddress;
    address private storageControllerAddress;

    ControllerInterface private potController;
    ControllerInterface private singleWinnerPotController;
    StorageInterface private storageController;

    address owner;

    uint256 private constant MAX_PAGE = 20;

    // ============================ INITIALIZER ============================
    constructor(
        address _potControllerAddress,
        address _singleWinnerPotControllerAddress,
        address _storageControllerAddress
    ) {
        owner = msg.sender;
        potControllerAddress = _potControllerAddress;
        potController = ControllerInterface(potControllerAddress);
        singleWinnerPotControllerAddress = _singleWinnerPotControllerAddress;
        singleWinnerPotController = ControllerInterface(
            singleWinnerPotControllerAddress
        );
        storageControllerAddress = _storageControllerAddress;
        storageController = StorageInterface(_storageControllerAddress);
    }

    function getPaginated(
        uint256 page,
        uint256 count,
        address creator,
        bool isPlayer,
        bool isSingleWinner
    ) external view returns (Pot[] memory) {
        ControllerInterface _controller = potController;
        string memory gameType = "POT";

        if (isSingleWinner) {
            _controller = singleWinnerPotController;
            gameType = "SW_POT";
        }

        return
            _getPotsPaginated(
                _controller,
                page,
                count,
                creator,
                isPlayer,
                gameType
            );
    }

    function getAll(bool isSingleWinner)
        external
        view
        returns (uint256[] memory)
    {
        ControllerInterface _controller = potController;

        if (isSingleWinner) {
            _controller = singleWinnerPotController;
        }
        return _controller.getAllPots();
    }

    function getCompleted(bool isSingleWinner)
        external
        view
        returns (uint256[] memory)
    {
        ControllerInterface _controller = potController;

        if (isSingleWinner) {
            _controller = singleWinnerPotController;
        }
        return _controller.getCompletedPots();
    }

    function getById(uint256 _potId) external view returns (Pot memory) {
        ControllerInterface _controller = _getController(_potId);
        return _controller.getPotById(_potId);
    }

    function getStats() external view returns (Statistics memory) {
        return storageController.getStats();
    }

    function getIsClaimed(uint256 _potId, address claimant) external view returns (bool) {
        return storageController.getIsClaimed(_potId, claimant);
    }

    // ============================ PRIVATE VIEW METHODS ============================
    function _getController(uint256 _lottoId)
        private
        view
        returns (ControllerInterface)
    {
        ControllerInterface _controller;
        if (potController.isPotId(_lottoId)) {
            _controller = potController;
        } else if (singleWinnerPotController.isPotId(_lottoId)) {
            _controller = singleWinnerPotController;
        }

        return _controller;
    }

    function _getPotsPaginated(
        ControllerInterface controller,
        uint256 page,
        uint256 count,
        address creator,
        bool isPlayer,
        string memory gameType
    ) private view returns (Pot[] memory) {
        if (count > MAX_PAGE) {
            count = MAX_PAGE;
        }

        uint256[] memory potIds;

        if (creator == address(0)) {
            potIds = controller.getAllPots();
        } else {
            if (isPlayer) {
                potIds = storageController.getPlayerGames(creator, gameType);
            } else {
                potIds = storageController.getCreatorGames(creator, gameType);
            }
        }

        uint256 startIndex = 0;
        uint256 endIndex = potIds.length;

        if (potIds.length >= (page * count)) {
            startIndex = potIds.length - (page * count);
        }

        if (potIds.length >= (count * (page - 1))) {
            endIndex = potIds.length - (count * (page - 1));
        }

        Pot[] memory pots = new Pot[](endIndex - startIndex);

        uint256 counter = 0;
        for (uint256 i = startIndex; i < endIndex; i++) {
            pots[counter++] = controller.getPotById(potIds[i]);
        }

        return pots;
    }
}
