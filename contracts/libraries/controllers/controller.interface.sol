//SPDX-License-Identifier: Unlicense
pragma solidity 0.8.11;
import "../models.sol";

interface ControllerInterface {
    function addNewLotto(Lotto memory lotto) external returns (bool);

    function addNewPot(Pot memory pot) external returns (bool);

    function getLottoById(uint256 lottoId) external view returns (Lotto memory);

    function getPotById(uint256 lottoId) external view returns (Pot memory);

    function playLotto(
        uint256 lottoId,
        uint256 betPlaced,
        address player
    ) external returns (bool);

    function playPot(
        uint256 potId,
        uint256 betPlaced,
        address player,
        uint256[] memory guesses
    ) external returns (bool);

    function forceEnd(uint256 lottoId) external returns (bool);

    function isLottoId(uint256 lottoId) external view returns (bool);

    function isPotId(uint256 potId) external view returns (bool);

    function grantLottoCreator(address account) external;

    function grantLottoPlayer(address account) external;

    function grantAdmin(address account) external;

    function claimWinning(uint256 lottoId, address claimer) external returns (Claim memory);

    function creatorClaim(uint256 lottoId) external returns (Claim memory);

    function platformClaim(uint256 lottoId) external returns (Claim memory);

    function getTotalStaked(uint256 lottoId) external view returns (uint256);
}
