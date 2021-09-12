//SPDX-License-Identifier: Unlicense
pragma solidity 0.8.3;
import "./models.sol";

interface StorageInterface {
    function saveLotto(Lotto memory lotto) external returns (bool);

    function savePot(Pot memory pot) external returns (bool);

    function setGrotto(address grotto, address parent) external;

    function getLottos() external view returns (uint256[] memory);

    function getPots() external view returns (uint256[] memory);

    function getLottoById(uint256 lottoId) external view returns (Lotto memory);

    function getPotById(uint256 lottoId) external view returns (Pot memory);
}
