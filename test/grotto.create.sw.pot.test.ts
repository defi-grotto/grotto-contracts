import { Contract } from "@ethersproject/contracts";
import { ethers, waffle, upgrades } from "hardhat";
import chai from "chai";
import { expect } from "chai";
chai.use(waffle.solidity);
import { platformOwner, PotGuessType, PotType, WinningType } from "./models";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { BigNumber } from "@ethersproject/bignumber";

describe.only("Grotto: Create Pot Tests", () => {
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
    await controller.deployed();
    const lottoController = await LottoController.deploy(
      storageController.address
    );
    await lottoController.deployed();
    const potController = await PotController.deploy(storageController.address);
    await potController.deployed();

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

    console.log(`SWPotController Deployed to ${controller.address}`);

    expect(controller.address).to.not.eq(address0);

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

      // uint256 _startTime,
      // uint256 _endTime,
      // uint256 _maxNumberOfPlayers,
      // WinningType _winningType,
      // uint256[] memory _winningNumbers,
      // PotGuessType _pgt,
      // PotType _potType

      const betAmount = ethers.utils.parseEther("0.01");
      await expect(
        grotto.createPot(
          0,
          0,
          10,
          betAmount,
          WinningType.NUMBER_OF_PLAYERS,
          [3, 6, 9],
          PotGuessType.ORDER,
          PotType.SINGLE_WINNER,
          overrides
        )
      ).to.emit(grotto, "PotCreated");
      potIds.push(1);
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

      const betAmount = ethers.utils.parseEther("0.01");
      await expect(
        grotto.createPot(
          0,
          0,
          0,
          betAmount,
          WinningType.NUMBER_OF_PLAYERS,
          [3, 6, 9],
          PotGuessType.ORDER,
          PotType.SINGLE_WINNER,
          overrides
        )
      ).to.be.revertedWith("Inv. No. of players");
    } catch (error) {
      console.log(error);
      expect(error).to.equal(undefined);
    }
  });

  it("should not create a pot if lotto bet amount is not greater than 0", async () => {
    try {
      const overrides = {
        value: ethers.utils.parseEther("1"),
      };
      const betAmount = BigNumber.from(0);
      await expect(
        grotto.createPot(
          0,
          0,
          10,
          betAmount,
          WinningType.NUMBER_OF_PLAYERS,
          [3, 6, 9],
          PotGuessType.ORDER,
          PotType.SINGLE_WINNER,
          overrides
        )
      ).to.be.revertedWith("Inv. lotto bet amount");
    } catch (error) {
      console.log(error);
      expect(error).to.equal(undefined);
    }
  });

  it("should not create a pot if pot amount is not greater than 0", async () => {
    try {
      const betAmount = ethers.utils.parseEther("0.01");
      await expect(
        grotto.createPot(
          0,
          0,
          10,
          betAmount,
          WinningType.NUMBER_OF_PLAYERS,
          [3, 6, 9],
          PotGuessType.ORDER,
          PotType.SINGLE_WINNER
        )
      ).to.be.revertedWith("Inv. Pot BetAmount");
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

      const betAmount = ethers.utils.parseEther("0.01");
      await expect(
        grotto.createPot(
          1000,
          200,
          10,
          betAmount,
          WinningType.TIME_BASED,
          [3, 6, 9],
          PotGuessType.ORDER,
          PotType.SINGLE_WINNER,
          overrides
        )
      ).to.be.revertedWith("Start time must be less than end time");
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

      const betAmount = ethers.utils.parseEther("0.01");
      await expect(
        grotto.createPot(
          200,
          1000,
          10,
          betAmount,
          WinningType.TIME_BASED,
          [3, 6, 9],
          PotGuessType.ORDER,
          PotType.SINGLE_WINNER,
          overrides
        )
      ).to.be.revertedWith("End time must be in the future");
    } catch (error) {
      console.log(error);
      expect(error).to.equal(undefined);
    }
  });

  it("should create a pot with winning type = time based", async () => {
    try {
      const overrides = {
        value: ethers.utils.parseEther("0.01"),
      };

      const betAmount = ethers.utils.parseEther("0.01");
      const endTime = Math.floor((new Date().getTime() + 8.64e7) / 1000); // + 24 hours;
      const startTime = Math.floor(new Date().getTime() / 1000);
      await expect(
        grotto.createPot(
          startTime,
          endTime,
          0,
          betAmount,
          WinningType.TIME_BASED,
          [3, 6, 9],
          PotGuessType.ORDER,
          PotType.SINGLE_WINNER,
          overrides
        )
      ).to.emit(grotto, "PotCreated");
      potIds.push(2);
    } catch (error) {
      console.log(error);
      expect(error).to.equal(undefined);
    }
  });

  it("should not create a pot if there's not at least one winning number", async () => {
    try {
      const overrides = {
        value: ethers.utils.parseEther("0.01"),
      };

      const betAmount = ethers.utils.parseEther("0.01");
      const endTime = Math.floor((new Date().getTime() + 8.64e7) / 1000); // + 24 hours;
      const startTime = Math.floor(new Date().getTime() / 1000);
      await expect(
        grotto.createPot(
          startTime,
          endTime,
          10,
          betAmount,
          WinningType.TIME_BASED,
          [],
          PotGuessType.ORDER,
          PotType.SINGLE_WINNER,
          overrides
        )
      ).to.be.revertedWith("'Inv. Winning Number");
    } catch (error) {
      console.log(error);
      expect(error).to.equal(undefined);
    }
  });

  it("should get pot by id", async () => {
    try {
      const pot = await reader.getPotById(1);
      expect(pot.lotto.id.toNumber()).to.be.eq(1);
      expect(pot.lotto.creator).to.be.eq(accounts[0].address);
      expect(pot.winningNumbers).to.be.an("array");
      expect(pot.winningNumbers[0]).to.eq(3);
      expect(pot.winningNumbers[1]).to.eq(6);
      expect(pot.winningNumbers[2]).to.eq(9);
    } catch (error) {
      console.log(error);
      expect(error).to.equal(undefined);
    }
  });
});
