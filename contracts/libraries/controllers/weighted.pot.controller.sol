//SPDX-License-Identifier: Unlicense
pragma solidity 0.8.9;

import "../models.sol";
import "./base.controller.sol";
import "../errors.sol";
import "hardhat/console.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

contract WeightedPotController is BaseController, AccessControlUpgradeable {
    using SafeMath for uint256;
}