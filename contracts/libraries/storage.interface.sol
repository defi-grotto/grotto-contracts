//SPDX-License-Identifier: Unlicense
pragma solidity 0.8.3;
import "./models.sol";

interface StorageInterface {
    function addNewLotto(Lotto memory lotto) external returns (bool);

    function addNewPot(Pot memory pot) external returns (bool);

    function setGrotto(address grotto, address parent) external;

    function getLottoById(uint256 lottoId) external view returns (Lotto memory);

    function getPotById(uint256 lottoId) external view returns (Pot memory);

    function playLotto(uint256 lottoId, uint256 betPlaced, address player) external returns (bool);

    function claimLottoWinnings(uint256 _lottoId) external returns (bool);
}
