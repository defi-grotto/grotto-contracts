import { Contract } from "@ethersproject/contracts";
import { ethers, waffle } from "hardhat";
import chai from "chai";
import { expect } from "chai";
chai.use(waffle.solidity);
import { Lotto, platformOwner, Pot, PotGuessType, WinningType } from "../scripts/models";
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
      maxNumberOfPlayers: 10,
      winningType: WinningType.NUMBER_OF_PLAYERS,
      isFinished: false,
      players: [],
      stakes: BigNumber.from(0),
      winners: [],
      winnings: [],
    };

    pot = {
      lotto: lotto,
      potAmount: BigNumber.from(0),
      winningNumbers: [33, 12, 99],
      potGuessType: PotGuessType.ORDER,
    };

    const Grotto = await ethers.getContractFactory("Grotto");
    const Storage = await ethers.getContractFactory("Storage");

    const storage = await (await Storage.deploy()).deployed();
    console.log(`Storage Deployed to ${storage.address}`);
    expect(storage.address).to.not.eq(address0);

    grotto = await (await Grotto.deploy(storage.address, platformOwner)).deployed();
    console.log(`Grotto Deployed to ${grotto.address}`);
  });

  it("should create grotto contract", async () => {
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
        "Lotto with same ID and Creator already exists"
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
      pot.lotto.maxNumberOfPlayers = 0;
      await expect(grotto.createPot(pot, overrides)).to.be.revertedWith(
        "Number of players must be greater than 0"
      );
    } catch (error) {
      console.log(error);
      expect(error).to.equal(undefined);
    }
  });

  it("should not create a pot if lotto bet amount is not greater than 0", async () => {
    try {
      pot.lotto.id = 2;
      pot.lotto.maxNumberOfPlayers = 100;
      pot.potAmount = ethers.utils.parseEther("0.01");
      pot.lotto.betAmount = BigNumber.from(0);
      await expect(grotto.createPot(pot)).to.be.revertedWith(
        "Can not create a lotto with 0 bet amount"
      );
    } catch (error) {
      console.log(error);
      expect(error).to.equal(undefined);
    }
  });

  it("should not create a pot if bet amount is not greater than 0", async () => {
    try {
      pot.lotto.id = 2;
      pot.lotto.maxNumberOfPlayers = 100;
      pot.potAmount = BigNumber.from(0);
      pot.lotto.betAmount = ethers.utils.parseEther("0.01");
      const overrides = {
        value: ethers.utils.parseEther("1"),
      };
      await expect(grotto.createPot(pot)).to.be.revertedWith(
        "Pot betAmount must be greater than 0"
      );
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
        "Winnershares length does not match number of winners"
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
        "Start time must be less than end time"
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
        "End time must be in the future"
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

      await expect(grotto.createPot(pot, overrides)).to.be.revertedWith(
        "Pot winning numbers must be at least 1"
      );
    } catch (error) {
      console.log(error);
      expect(error).to.equal(undefined);
    }
  });

  it("should get pot by id", async () => {
    try {
      const pot = await grotto.getPotById(1);
      expect(pot.lotto.id.toNumber()).to.be.eq(1);
      expect(pot.lotto.creator).to.be.eq(accounts[1].address);
      expect(pot.winningNumbers).to.be.an("array");
      expect(pot.winningNumbers[0]).to.eq(33);
      expect(pot.winningNumbers[1]).to.eq(12);
      expect(pot.winningNumbers[2]).to.eq(99);
    } catch (error) {
      console.log(error);
      expect(error).to.equal(undefined);
    }
  });
});
