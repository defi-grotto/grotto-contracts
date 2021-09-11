//SPDX-License-Identifier: Unlicense
pragma solidity 0.8.3;
import "./models.sol";


interface StorageInterface {
    function saveLotto(Lotto memory lotto) external returns (bool);
    function setGrotto(address grotto, address parent) external;
    function getRunningLottos() external view returns (Lotto[] memory);
}