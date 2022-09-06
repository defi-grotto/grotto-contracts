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
        runs: 2000
      }
    }
  },
  contractSizer: {
    alphaSort: true,
    runOnCompile: true,
    strict: true
  },
  networks: {
    local: {
      url: "http://localhost:8545/",
    },
    tbsc: {
      url: "https://data-seed-prebsc-1-s1.binance.org:8545/",
      accounts: ["147d87ddd5baf71ed197ea4fee8710f7f039ec72d0e9ebe5711d13a04f4f92f4"],
    },
    xdai: {
      url: "https://rpc.xdaichain.com/",
      accounts: ["147d87ddd5baf71ed197ea4fee8710f7f039ec72d0e9ebe5711d13a04f4f92f4"],      
    },
    fuji: {
      url: "https://api.avax-test.network/ext/bc/C/rpc",
      accounts: ["498ea38b2b6408be76d6c45b2939c2f195a16ac4bca7e62772fc549c7a798176"]
    },    
    sokol: {
      url: "https://sokol.poa.network",
      accounts: ["147d87ddd5baf71ed197ea4fee8710f7f039ec72d0e9ebe5711d13a04f4f92f4"],      
    }    
  },
  mocha: {
    timeout: 120000
  },  
};
