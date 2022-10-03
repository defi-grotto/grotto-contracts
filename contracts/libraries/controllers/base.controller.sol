//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.4;

import "./interface/controller.interface.sol";
import "../errors.sol";
import "../models.sol";
import "hardhat/console.sol";

abstract contract BaseController is ControllerInterface {
    bytes32 public constant LOTTO_CREATOR = keccak256("LOTTO_CREATOR_ROLE");
    bytes32 public constant LOTTO_PLAYER = keccak256("LOTTO_PLAYER_ROLE");
    bytes32 public constant ADMIN = keccak256("ADMIN_ROLE");

    // ============================ VIRTUAL METHODS, NEEDS OVERRIDING ============================
    function addNewLotto(Lotto memory)
        external
        virtual
        override
        returns (uint256)
    {}

    function getLottoById(uint256)
        external
        view
        virtual
        override
        returns (Lotto memory)
    {}

    function getCompletedLottos()
        external
        view
        virtual
        override
        returns (uint256[] memory)
    {}

    function getAllLottos()
        external
        view
        virtual
        override
        returns (uint256[] memory)
    {}

    function getAllPots()
        external
        view
        virtual
        override
        returns (uint256[] memory)
    {}

    function getCompletedPots()
        external
        view
        virtual
        override
        returns (uint256[] memory)
    {}

    function playLotto(
        uint256,
        uint256,
        address
    ) external virtual override returns (bool) {}

    function findWinner(uint256 lottoId) external virtual override {}

    function isLottoId(uint256) external view virtual override returns (bool) {}

    function addNewPot(Pot memory)
        external
        virtual
        override
        returns (uint256)
    {}

    function playPot(
        uint256,
        uint256,
        address,
        uint256[] memory
    ) external virtual override returns (bool) {}

    function getPotById(uint256)
        external
        view
        virtual
        override
        returns (Pot memory)
    {}

    function isPotId(uint256) external view virtual override returns (bool) {}
}
