import { Contract } from "@ethersproject/contracts";
import { ethers, waffle } from "hardhat";
import chai from "chai";
import { expect } from "chai";
chai.use(waffle.solidity);
import { Lotto, Pot, PotGuessType, WinningType } from "../scripts/models";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { BigNumber } from "@ethersproject/bignumber";

describe("Grotto: Create Pot Tests", () => {
  let accounts: SignerWithAddress[];
  const address0 = "0x0000000000000000000000000000000000000000";
  let grotto: Contract;
  let pot: Pot;

  before(async () => {
    accounts = await ethers.getSigners();
    const lotto: Lotto = {
      id: 1,
      creator: accounts[1].address,
      numberOfWinners: 1,
      winnersShares: [100],
      startTime: 0, //Math.floor(new Date().getTime() / 1000),
      endTime: 0, //Math.floor((new Date().getTime() + 8.64e7) / 1000), // + 24 hours
      betAmount: BigNumber.from(0),
      numberOfPlayers: 10,
      winningType: WinningType.NUMBER_OF_PLAYERS,
    };

    pot = {
      lotto: lotto,
      potAmount: BigNumber.from(0),
      winningNumbers: [33, 12, 99],
      potGuessType: PotGuessType.BOTH,
    };
  });

  it("should create grotto contract", async () => {
    const Grotto = await ethers.getContractFactory("Grotto");
    const Storage = await ethers.getContractFactory("Storage");

    const storage = await (await Storage.deploy()).deployed();
    console.log(`Storage Deployed to ${storage.address}`);
    expect(storage.address).to.not.eq(address0);

    grotto = await (await Grotto.deploy(storage.address)).deployed();
    console.log(`Grotto Deployed to ${grotto.address}`);
    expect(grotto.address).to.not.eq(address0);
  });

  it("should create a pot", async () => {
    try {
      const overrides = {
        value: ethers.utils.parseEther("1"),
      };

      pot.lotto.betAmount = ethers.utils.parseEther("0.01");
      await expect(grotto.createPot(pot, overrides)).to.emit(
        grotto,
        "PotCreated"
      );
    } catch (error) {
      console.log(error);
      expect(error).to.equal(undefined);
    }
  });

  it("should not create a pot with same user and id", async () => {
    try {
      const overrides = {
        value: ethers.utils.parseEther("1"),
      };
      await expect(grotto.createPot(pot, overrides)).to.be.revertedWith(
        "ERROR_4"
      );
    } catch (error) {
      console.log(error);
      expect(error).to.equal(undefined);
    }
  });

  it("should not create a pot if winning type is number of users and number of players is not greater 0", async () => {
    try {
      const overrides = {
        value: ethers.utils.parseEther("1"),
      };

      pot.lotto.id = 2;
      pot.lotto.numberOfPlayers = 0;
      await expect(grotto.createPot(pot, overrides)).to.be.revertedWith(
        "ERROR_8"
      );
    } catch (error) {
      console.log(error);
      expect(error).to.equal(undefined);
    }
  });

  it("should not create a pot if pot amount is not greater than 0", async () => {
    try {
      pot.lotto.id = 2;
      pot.lotto.numberOfPlayers = 100;
      pot.lotto.betAmount = ethers.utils.parseEther("0.01");
      await expect(grotto.createPot(pot)).to.be.revertedWith("ERROR_11");
    } catch (error) {
      console.log(error);
      expect(error).to.equal(undefined);
    }
  });

  it("should not create a pot if get amount is not greater than 0", async () => {
    try {
      pot.lotto.id = 2;
      pot.lotto.numberOfPlayers = 100;
      pot.lotto.betAmount = BigNumber.from(0);
      const overrides = {
        value: ethers.utils.parseEther("1"),
      };
      await expect(grotto.createPot(pot)).to.be.revertedWith("ERROR_7");
    } catch (error) {
      console.log(error);
      expect(error).to.equal(undefined);
    }
  });

  it("should not create a pot if number of winners and winners shares length don't match", async () => {
    try {
      const overrides = {
        value: ethers.utils.parseEther("0.01"),
      };

      pot.lotto.id = 2;
      pot.lotto.numberOfWinners = 2;
      pot.lotto.betAmount = ethers.utils.parseEther("0.01");
      await expect(grotto.createPot(pot, overrides)).to.be.revertedWith(
        "ERROR_5"
      );
    } catch (error) {
      console.log(error);
      expect(error).to.equal(undefined);
    }
  });

  it("should not create a pot if winning type is time based and start time is not less than end time", async () => {
    try {
      const overrides = {
        value: ethers.utils.parseEther("0.01"),
      };

      pot.lotto.id = 2;
      pot.lotto.numberOfWinners = 1;
      pot.lotto.winningType = WinningType.TIME_BASED;
      await expect(grotto.createPot(pot, overrides)).to.be.revertedWith(
        "ERROR_6"
      );
    } catch (error) {
      console.log(error);
      expect(error).to.equal(undefined);
    }
  });

  it("should not create a pot if winning type is time based and end time is not in future", async () => {
    try {
      const overrides = {
        value: ethers.utils.parseEther("0.01"),
      };

      pot.lotto.id = 2;
      pot.lotto.winningType = WinningType.TIME_BASED;
      pot.lotto.endTime = 1;
      await expect(grotto.createPot(pot, overrides)).to.be.revertedWith(
        "ERROR_10"
      );
    } catch (error) {
      console.log(error);
      expect(error).to.equal(undefined);
    }
  });

  it("should create a pots with winning type = time based", async () => {
    try {
      const overrides = {
        value: ethers.utils.parseEther("0.01"),
      };

      pot.lotto.id = 2;
      pot.lotto.winningType = WinningType.TIME_BASED;
      pot.lotto.endTime = Math.floor((new Date().getTime() + 8.64e7) / 1000); // + 24 hours;
      await expect(grotto.createPot(pot, overrides)).to.emit(
        grotto,
        "PotCreated"
      );
    } catch (error) {
      console.log(error);
      expect(error).to.equal(undefined);
    }
  });

  it("should not create a pot if there's not at least one winning number", async () => {
    try {
      pot.lotto.id = 3;
      pot.winningNumbers = [];
      const overrides = {
        value: ethers.utils.parseEther("0.001"),
      };
      
      await expect(grotto.createPot(pot, overrides)).to.be.revertedWith("ERROR_12");
    } catch (error) {
      console.log(error);
      expect(error).to.equal(undefined);
    }
  });  

  // it("should get running lottos", async () => {
  //   try {
  //     const runningLottos = await grotto.getRunningLottos();
  //     expect(runningLottos).to.be.an('array');
  //     expect(runningLottos[0]).to.be.an('array');
  //     expect(runningLottos[1]).to.be.an('array');
  //     expect(runningLottos[0]).to.have.property("id");
  //     expect(runningLottos[0].id.toNumber()).to.be.eq(1);
  //     expect(runningLottos[1]).to.have.property("id");
  //     expect(runningLottos[1].id.toNumber()).to.be.eq(2);
  //     expect(runningLottos[0]).to.have.property("creator");
  //     expect(runningLottos[0].creator).to.be.eq(accounts[1].address);
  //     expect(runningLottos[1]).to.have.property("creator");
  //     expect(runningLottos[1].creator).to.be.eq(accounts[1].address);
  //   } catch (error) {
  //     console.log(error);
  //     expect(error).to.equal(undefined);
  //   }
  // });
});
