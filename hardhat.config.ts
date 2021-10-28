import { task } from "hardhat/config";
import "@nomiclabs/hardhat-ethers";
import "@nomiclabs/hardhat-waffle";
import "hardhat-contract-sizer";
import "@openzeppelin/hardhat-upgrades";


task("accounts", "Prints the list of accounts", async (taskArgs, hre) => {
  console.log(hre.config.solidity);
  const accounts = await hre.ethers.getSigners();

  for (const account of accounts) {
    console.log(account.address);
  }
});

module.exports = {
  solidity: {
    version: "0.8.4",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200000
      }
    }
  },
  contractSizer: {
    alphaSort: true,
    runOnCompile: true,
    strict: true
  }
};
