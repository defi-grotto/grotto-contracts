//SPDX-License-Identifier: Unlicense
pragma solidity 0.8.3;
import "./models.sol";

interface StorageInterface {
    function addNewLotto(Lotto memory lotto) external returns (bool);

    function addNewPot(Pot memory pot) external returns (bool);

    function setGrotto(address grotto, address parent) external;

    function getLottoById(uint256 lottoId) external view returns (Lotto memory);

    function findClaimer(uint256 lottoId, address claimer) external view returns (address, uint256);

    function getPotById(uint256 lottoId) external view returns (Pot memory);

    function playLotto(uint256 lottoId, uint256 betPlaced, address player) external returns (bool);

    function playPot(uint256 potId, uint256 betPlaced, address player) external returns (bool);

    function claimLottoWinnings(uint256 lottoId) external returns (bool);

    function forceEndLotto(uint256 lottoId) external returns (bool);
}
