//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.4;
import "./models.sol";

interface GrottoInterface {
    event LottoCreated(uint256 indexed lottoId);
    event PotCreated(uint256 indexed potId);
    event BetPlaced(uint256 indexed lottoId, uint256 amount, address indexed player);
    event Claimed(uint256 indexed lottoId);
    event CreatorClaimed(uint256 indexed lottoId);
    event PlatformClaimed(uint256 indexed lottoId);    
}