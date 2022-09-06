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

    uint256 private constant MAX_PAGE = 20;

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

    function getLottosPaginated(
        uint256 page,
        uint256 count,
        address creator
    ) external view returns (Lotto[] memory) {
        if (count > MAX_PAGE) {
            count = MAX_PAGE;
        }

        uint256[] memory lottoIds;

        if (creator == address(0)) {
            lottoIds = lottoController.getAllLottos();
        } else {
            lottoIds = storageController.getCreatorGames(creator, "LOTTO");
        }

        uint256 startIndex = 0;
        uint256 endIndex = lottoIds.length;

        if (lottoIds.length >= (page * count)) {
            startIndex = lottoIds.length - (page * count);
        }

        if (lottoIds.length >= (count * (page - 1))) {
            endIndex = lottoIds.length - (count * (page - 1));
        }

        Lotto[] memory lottos = new Lotto[](endIndex - startIndex);

        uint256 counter = 0;
        for (uint256 i = startIndex; i < endIndex; i++) {
            lottos[counter++] = lottoController.getLottoById(lottoIds[i]);
        }

        return lottos;
    }

    function getPotsPaginated(
        uint256 page,
        uint256 count,
        address creator
    ) external view returns (Pot[] memory) {
        return _getPotsPaginated(potController, page, count, creator, "POT");
    }

    function getSingleWinnerPotsPaginated(
        uint256 page,
        uint256 count,
        address creator
    ) external view returns (Pot[] memory) {
        return
            _getPotsPaginated(
                singleWinnerPotController,
                page,
                count,
                creator,
                "SW_POT"
            );
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

    function getSingleWinnerCompletedPots()
        external
        view
        returns (uint256[] memory)
    {
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

    function getStats() external view returns (Statistics memory) {
        return storageController.getStats();
    }

    function getPlayerGames(address player, string memory gameType) external view returns (uint256[] memory) {
        return storageController.getPlayerGames(player, gameType);
    }

    function getCreatorGames(address creator, string memory gameType) external view returns (uint256[] memory) {
        return storageController.getCreatorGames(creator, gameType);        
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

    function _getPotsPaginated(
        ControllerInterface controller,
        uint256 page,
        uint256 count,
        address creator,
        string memory gameType
    ) private view returns (Pot[] memory) {
        if (count > MAX_PAGE) {
            count = MAX_PAGE;
        }

        // if (creator == address(0)) {
        //     lottoIds = lottoController.getAllLottos();
        // } else {
        //     lottoIds = storageController.getCreatorGames(creator, "LOTTO");
        // }
        uint256[] memory potIds;

        if (creator == address(0)) {
            potIds = controller.getAllPots();
        } else {
            potIds = storageController.getCreatorGames(creator, gameType);
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
