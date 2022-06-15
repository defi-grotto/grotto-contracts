import { Contract } from "@ethersproject/contracts";
import { ethers, waffle } from "hardhat";
import chai from "chai";
import { expect } from "chai";
chai.use(waffle.solidity);
import { PotGuessType, PotType, WinningType } from "./models";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

describe("Grotto: Play Pot Tests", () => {
  let accounts: SignerWithAddress[];
  const address0 = "0x0000000000000000000000000000000000000000";
  let grotto: Contract;
  let reader: Contract;

  const potIds: Array<number> = [];
  before(async () => {
    accounts = await ethers.getSigners();

    console.log("Creating Contracts: ", accounts[0].address);

    const Storage = await ethers.getContractFactory("Storage");
    const Grotto = await ethers.getContractFactory("Grotto");
    const Reader = await ethers.getContractFactory("Reader");
    const LottoController = await ethers.getContractFactory("LottoController");
    const PotController = await ethers.getContractFactory("PotController");
    const SingleWinnerPotController = await ethers.getContractFactory(
      "SingleWinnerPotController"
    );

    const storageController = await Storage.deploy();
    await storageController.deployed();
    const controller = await SingleWinnerPotController.deploy(
      storageController.address
    );

    const lottoController = await LottoController.deploy(
      storageController.address
    );
    await lottoController.deployed();

    const potController = await PotController.deploy(storageController.address);
    await potController.deployed();

    await controller.deployed();
    await potController.deployed();
    await lottoController.deployed();

    grotto = await Grotto.deploy(
      lottoController.address,
      potController.address,
      controller.address,
      storageController.address
    );

    reader = await Reader.deploy(
      lottoController.address,
      potController.address,
      controller.address,
      storageController.address
    );    

    await controller.grantLottoCreator(grotto.address);
    await controller.grantLottoPlayer(grotto.address);
    await controller.grantAdmin(grotto.address);

    await storageController.grantAdminRole(lottoController.address);
    await storageController.grantAdminRole(controller.address);
    await storageController.grantAdminRole(potController.address);
    await storageController.grantAdminRole(grotto.address);

    console.log(`SingleWinnerPotController Deployed to ${controller.address}`);

    expect(controller.address).to.not.eq(address0);

    console.log(`Grotto Deployed to ${grotto.address}`);
  });

  it("should create grotto contract", async () => {
    expect(grotto.address).to.not.eq(address0);
  });

  it("should create a number of player pot winning type", async () => {
    try {
      const overrides = {
        value: ethers.utils.parseEther("10"),
      };

      const betAmount = ethers.utils.parseEther("10");
      await expect(
        grotto.createPot(
          0,
          0,
          10,
          betAmount,
          WinningType.NUMBER_OF_PLAYERS,
          [3, 6, 9, 3],
          PotGuessType.ORDER,
          PotType.SINGLE_WINNER,
          overrides
        )
      ).to.emit(grotto, "PotCreated");
      potIds.push(potIds.length + 1);
    } catch (error) {
      console.log(error);
      expect(error).to.equal(undefined);
    }
  });

  it("should create a time based winning type", async () => {
    try {
      const overrides = {
        value: ethers.utils.parseEther("10"),
      };

      const betAmount = ethers.utils.parseEther("10");

      const _startTime = Math.floor(new Date().getTime() / 1000);
      const _endTime = Math.floor((new Date().getTime() + 8.64e7) / 1000); // + 24 hours

      await expect(
        grotto.createPot(
          _startTime,
          _endTime,
          0,
          betAmount,
          WinningType.TIME_BASED,
          [3, 6, 9, 3],
          PotGuessType.ORDER,
          PotType.SINGLE_WINNER,
          overrides
        )
      ).to.emit(grotto, "PotCreated");
      potIds.push(potIds.length + 1);
    } catch (error) {
      console.log(error);
      expect(error).to.equal(undefined);
    }
  });

  it("should play number of players pot", async () => {
    try {
      const overrides = {
        value: ethers.utils.parseEther("10"),
      };

      const guesses = [3, 6, 9, 1];
      const player1 = await grotto.connect(accounts[2]);
      await expect(
        player1.playSingleWinnerPot(potIds[0], guesses, overrides)
      ).to.emit(grotto, "BetPlaced");
    } catch (error) {
      console.log(error);
      expect(error).to.equal(undefined);
    }
  });

  it("should play time based pot", async () => {
    try {
      const overrides = {
        value: ethers.utils.parseEther("10"),
      };

      const guesses = [3, 6, 9, 1];
      const player1 = await grotto.connect(accounts[2]);
      await expect(
        player1.playSingleWinnerPot(potIds[1], guesses, overrides)
      ).to.emit(grotto, "BetPlaced");
    } catch (error) {
      console.log(error);
      expect(error).to.equal(undefined);
    }
  });

  it("should not play pot by creator", async () => {
    try {
      const overrides = {
        value: ethers.utils.parseEther("10"),
      };
      const guesses = [3, 6, 9, 1];
      await expect(
        grotto.playSingleWinnerPot(potIds[0], guesses, overrides)
      ).to.be.revertedWith("Creator can not play");
    } catch (error) {
      console.log(error);
      expect(error).to.equal(undefined);
    }
  });

  it("should not play pot with non-existent lotto id", async () => {
    try {
      const overrides = {
        value: ethers.utils.parseEther("10"),
      };
      const guesses = [3, 6, 9, 1];
      const player1 = await grotto.connect(accounts[1]);
      await expect(
        player1.playSingleWinnerPot(potIds.length + 1001, guesses, overrides)
      ).to.be.revertedWith("Lotto does not exist");
    } catch (error) {
      console.log(error);
      expect(error).to.equal(undefined);
    }
  });

  it("should not play pot if bet amount is lower that what is set by creator", async () => {
    try {
      const overrides = {
        value: ethers.utils.parseEther("0.001"),
      };
      const guesses = [3, 6, 9, 1];
      const player1 = await grotto.connect(accounts[1]);
      await expect(
        player1.playSingleWinnerPot(potIds.length, guesses, overrides)
      ).to.be.revertedWith("BetPlaced is too low");
    } catch (error) {
      console.log(error);
      expect(error).to.equal(undefined);
    }
  });

  it("should not claim winnings before pot is finished", async () => {
    await expect(grotto.claim(potIds.length)).to.be.revertedWith(
      "Lotto is not finished"
    );
  });

  it("should not find a winner if numbers matched but not in order", async () => {
    try {
      const overrides = {
        value: ethers.utils.parseEther("10"),
      };
      const betAmount = ethers.utils.parseEther("10");
      const _startTime = Math.floor(new Date().getTime() / 1000);
      const _endTime = Math.floor((new Date().getTime() + 8.64e7) / 1000); // + 24 hours

      await expect(
        grotto.createPot(
          _startTime,
          _endTime,
          0,
          betAmount,
          WinningType.TIME_BASED,
          [3, 6, 9, 3],
          PotGuessType.ORDER,
          PotType.SINGLE_WINNER,
          overrides
        )
      ).to.emit(grotto, "PotCreated");
      potIds.push(potIds.length + 1);

      // Numbers matched but not order
      let guesses = [3, 6, 3, 9];
      const player2 = await grotto.connect(accounts[3]);
      await expect(
        player2.playSingleWinnerPot(potIds[2], guesses, overrides)
      ).to.emit(grotto, "BetPlaced");

      // Numbers matched but not order, should allow a bet to be placed
      guesses = [3, 6, 3, 9];
      const player3 = await grotto.connect(accounts[4]);
      await expect(
        player3.playSingleWinnerPot(potIds[2], guesses, overrides)
      ).to.emit(grotto, "BetPlaced");

      await grotto.forceEnd(potIds[2]);

      await expect(player2.claim(potIds[2])).to.be.revertedWith(
        "Claimer is not a winner"
      );

      await expect(player3.claim(potIds[2])).to.be.revertedWith(
        "Claimer is not a winner"
      );
    } catch (error) {
      console.log(error);
      expect(error).to.equal(undefined);
    }
  });

  it("should send everything to creator if no winner found", async () => {
    try {
      const overrides = {
        value: ethers.utils.parseEther("10"),
      };
      const betAmount = ethers.utils.parseEther("10");
      const _startTime = Math.floor(new Date().getTime() / 1000);
      const _endTime = Math.floor((new Date().getTime() + 8.64e7) / 1000); // + 24 hours
      await expect(
        grotto.createPot(
          _startTime,
          _endTime,
          0,
          betAmount,
          WinningType.TIME_BASED,
          [3, 6, 9, 3],
          PotGuessType.ORDER,
          PotType.SINGLE_WINNER,
          overrides
        )
      ).to.emit(grotto, "PotCreated");
      potIds.push(potIds.length + 1);

      // Numbers matched but not order
      let guesses = [3, 6, 3, 9];
      const player3 = await grotto.connect(accounts[4]);
      await expect(
        player3.playSingleWinnerPot(potIds[3], guesses, overrides)
      ).to.emit(grotto, "BetPlaced");

      // Numbers matched but not order
      guesses = [3, 6, 3, 9];
      const player2 = await grotto.connect(accounts[3]);
      await expect(
        player2.playSingleWinnerPot(potIds[3], guesses, overrides)
      ).to.emit(grotto, "BetPlaced");

      // Numbers matched but not order
      guesses = [3, 6, 3, 9];
      const player4 = await grotto.connect(accounts[5]);
      await expect(
        player4.playSingleWinnerPot(potIds[3], guesses, overrides)
      ).to.emit(grotto, "BetPlaced");

      await grotto.forceEnd(potIds[3]);

      let pot = await reader.getPotById(potIds[3]);

      expect(pot.lotto.creator).to.equal(accounts[0].address);

      const balanceBefore = await ethers.provider.getBalance(
        accounts[0].address
      );
      await grotto.claimCreator(potIds.length);

      const balanceAfter = await ethers.provider.getBalance(
        accounts[0].address
      );
      expect(+ethers.utils.formatEther(balanceBefore)).to.be.lessThan(
        +ethers.utils.formatEther(balanceAfter)
      );
    } catch (error) {
      console.log(error);
      expect(error).to.equal(undefined);
    }
  });

  it("should find a winner if numbers matched and in order", async () => {
    try {
      const overrides = {
        value: ethers.utils.parseEther("10"),
      };
      const betAmount = ethers.utils.parseEther("10");
      const _startTime = Math.floor(new Date().getTime() / 1000);
      const _endTime = Math.floor((new Date().getTime() + 8.64e7) / 1000); // + 24 hours

      await expect(
        grotto.createPot(
          _startTime,
          _endTime,
          0,
          betAmount,
          WinningType.TIME_BASED,
          [3, 6, 9, 3],
          PotGuessType.ORDER,
          PotType.SINGLE_WINNER,
          overrides
        )
      ).to.emit(grotto, "PotCreated");
      potIds.push(potIds.length + 1);

      // Numbers matched but not order
      let guesses = [3, 6, 3, 9];
      const player2 = await grotto.connect(accounts[3]);
      await expect(
        player2.playSingleWinnerPot(potIds[4], guesses, overrides)
      ).to.emit(grotto, "BetPlaced");

      // Numbers matched and in order
      guesses = [3, 6, 9, 3];
      const player3 = await grotto.connect(accounts[4]);
      await expect(
        player3.playSingleWinnerPot(potIds[4], guesses, overrides)
      ).to.emit(grotto, "BetPlaced");

      await grotto.forceEnd(potIds[4]);

      await expect(player2.claim(potIds[4])).to.be.revertedWith(
        "Claimer is not a winner"
      );

      await expect(player3.claim(potIds[4])).to.emit(player3, "Claimed");

      await expect(player3.claim(potIds[4])).to.be.revertedWith("Pot claimed");
    } catch (error) {
      console.log(error);
      expect(error).to.equal(undefined);
    }
  });
 
  it('should get some stats', async () => {
    const stats = await reader.getStats();
    console.log("Total Played: ", ethers.utils.formatEther(stats.totalPlayed.toString()));
    console.log("Total Players: ", stats.totalPlayers.toString());
    console.log("Total Games: ", stats.totalGames.toString());
    console.log("Total Lotto: ", stats.totalLotto.toString());
    console.log("Total Pot: ", stats.totalPot.toString());
    console.log("Total SingleWinnerPot: ", stats.totalSingleWinnerPot.toString());
    console.log("Total totalCreators: ", stats.totalCreators.toString());
    console.log("Total Creator Shares: ", ethers.utils.formatEther(stats.totalCreatorShares.toString()));
    console.log("Total Platform Shares: ", ethers.utils.formatEther(stats.totalPlatformShares.toString()));
    console.log("Total Players Shares: ", ethers.utils.formatEther(stats.totalPlayerShares.toString()));    
  });
});
