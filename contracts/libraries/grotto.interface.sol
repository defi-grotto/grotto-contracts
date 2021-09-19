//SPDX-License-Identifier: Unlicense
pragma solidity 0.8.3;
import "./models.sol";

interface GrottoInterface {
    event LottoCreated(Lotto lotto);
    event PotCreated(Pot pot);
    event BetPlaced(uint256 lottoId, uint256 amount, address player);
}