//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.4;

import "../../models.sol";

interface StorageInterface {
    function grantAdminRole(address who) external;

    function getLottoById(uint256 lottoId) external view returns (Lotto memory);

    function setLotto(uint256 lottoId, Lotto memory lotto) external;

    function getPotById(uint256 potId) external view returns (Pot memory);

    function setPot(uint256 potId, Pot memory pot) external;

    function getAutoIncrementId() external returns (uint256);

    function getIsWinner(uint256 lottoId, address player)
        external
        view
        returns (bool);

    function setIsWinner(
        uint256 lottoId,
        address player,
        bool _isWinner
    ) external;

    function getIsClaimed(uint256 lottoId, address player)
        external
        view
        returns (bool);

    function setIsClaimed(
        uint256 lottoId,
        address player,
        bool _isClaimed
    ) external;

    function getPlayers(uint256 lottoId)
        external
        view
        returns (address[] memory);

    function setPlayer(uint256 lottoId, address player) external;

    function getWinners(uint256 lottoId)
        external
        view
        returns (address[] memory);

    function setWinner(uint256 lottoId, address player) external;

    function getPlatformSharePercentage() external view returns (uint256);

    function setPlatformSharePercentage(uint256 psp) external;

    function getCreatorSharesPercentage() external view returns (uint256);

    function setCreatorSharesPercentage(uint256 csp) external;

    function getCreatorFees() external view returns (uint256);

    function setCreatorFees(uint256 cf) external;
}
