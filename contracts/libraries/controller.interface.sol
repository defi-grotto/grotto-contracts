//SPDX-License-Identifier: Unlicense
pragma solidity 0.8.3;
import "./models.sol";

interface ControllerInterface {
    
    function addNewLotto(Lotto memory lotto) external returns (bool);

    function addNewPot(Pot memory pot) external returns (bool);

    function setGrotto(address grotto, address parent) external;
    
    function setPlatformOwner(address owner, address parent) external;

    function getLottoById(uint256 lottoId) external view returns (Lotto memory);

    function getClaim(uint256 lottoId, address claimer) external view returns (Claim memory);

    function getPotById(uint256 lottoId) external view returns (Pot memory);

    function playLotto(uint256 lottoId, uint256 betPlaced, address player) external returns (bool);

    function playPot(uint256 potId, uint256 betPlaced, address player, uint256[] memory guesses) external returns (bool);

    function claimWinnings(uint256 lottoId) external returns (bool);

    function forceEndLotto(uint256 lottoId) external returns (bool);
}
