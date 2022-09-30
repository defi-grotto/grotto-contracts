//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.4;

pragma experimental ABIEncoderV2;
import "../libraries/models.sol";
import "../libraries/controllers/interface/controller.interface.sol";
import "../libraries/controllers/interface/storage.interface.sol";
import "../libraries/grotto.interface.sol";
import "../libraries/errors.sol";

contract LottoReader {
    // ============================ VARIABLES ============================
    address private lottoControllerAddress;
    address private storageControllerAddress;

    ControllerInterface private lottoController;
    StorageInterface private storageController;

    address owner;

    uint256 private constant MAX_PAGE = 20;

    // ============================ INITIALIZER ============================
    constructor(
        address _lottoControllerAddress,
        address _storageControllerAddress
    ) {
        owner = msg.sender;
        lottoControllerAddress = _lottoControllerAddress;
        lottoController = ControllerInterface(lottoControllerAddress);
        storageControllerAddress = _storageControllerAddress;
        storageController = StorageInterface(_storageControllerAddress);
    }

    function getPaginated(
        uint256 page,
        uint256 count,
        address creatorOrPlayer,
        bool isPlayer
    ) external view returns (Lotto[] memory) {
        if (count > MAX_PAGE) {
            count = MAX_PAGE;
        }

        uint256[] memory lottoIds;

        if (creatorOrPlayer == address(0)) {
            lottoIds = lottoController.getAllLottos();
        } else {
            if (isPlayer) {
                lottoIds = storageController.getPlayerGames(
                    creatorOrPlayer,
                    "LOTTO"
                );
            } else {
                lottoIds = storageController.getCreatorGames(
                    creatorOrPlayer,
                    "LOTTO"
                );
            }
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

    function getAll() external view returns (uint256[] memory) {
        return lottoController.getAllLottos();
    }

    function getCompleted() external view returns (uint256[] memory) {
        return lottoController.getCompletedLottos();
    }

    function getById(uint256 _lottoId) external view returns (Lotto memory) {
        return lottoController.getLottoById(_lottoId);
    }

    function getStats() external view returns (Statistics memory) {
        return storageController.getStats();
    }

    function getIsClaimed(uint256 _lottoId, address claimant)
        external
        view
        returns (bool)
    {
        return storageController.getIsClaimed(_lottoId, claimant);
    }

    function getPlayerWinnings(uint256 _lottoId, address player)
        external
        view
        returns (Claim memory)
    {
        return lottoController.getPlayerWinnings(_lottoId, player);
    }

    function getCreatorWinnings(uint256 _lottoId)
        external
        view
        returns (Claim memory)
    {
        return lottoController.getCreatorWinnings(_lottoId);
    }
}
