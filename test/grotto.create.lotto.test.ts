import { Contract } from "@ethersproject/contracts";
import { ethers, waffle } from "hardhat";
import chai from "chai";
import { expect } from "chai";
chai.use(waffle.solidity);
import { Lotto, platformOwner, WinningType } from "../scripts/models";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { BigNumber } from "@ethersproject/bignumber";

describe("Grotto: Create Lotto Tests", () => {
  let accounts: SignerWithAddress[];
  const address0 = "0x0000000000000000000000000000000000000000";  
  let grotto: Contract;
  let lotto: Lotto;

  before(async () => {
    accounts = await ethers.getSigners();
    lotto = {
      id: 1,
      creator: accounts[1].address,
      startTime: 0, //Math.floor(new Date().getTime() / 1000),
      endTime: 0, //Math.floor((new Date().getTime() + 8.64e7) / 1000), // + 24 hours
      betAmount: BigNumber.from(0),
      maxNumberOfPlayers: 10,
      winningType: WinningType.NUMBER_OF_PLAYERS,
      isFinished: false,
      players: [],
      stakes: BigNumber.from(0),
      winner: address0,
      winning: 0,
    };

    const Grotto = await ethers.getContractFactory("Grotto");
    const Controller = await ethers.getContractFactory("Controller");

    const controller = await (await Controller.deploy()).deployed();
    console.log(`Storage Deployed to ${controller.address}`);
    expect(controller.address).to.not.eq(address0);

    grotto = await (await Grotto.deploy(controller.address, platformOwner)).deployed();
    console.log(`Grotto Deployed to ${grotto.address}`);
  });

  it("should create grotto contract", async () => {
    expect(grotto.address).to.not.eq(address0);
  });

  it("should create a lotto", async () => {
    try {
      const overrides = {
        value: ethers.utils.parseEther("0.01"),
      };

      await expect(grotto.createLotto(lotto, overrides)).to.emit(
        grotto,
        "LottoCreated"
      );
    } catch (error) {
      console.log(error);
      expect(error).to.equal(undefined);
    }
  });

  it("should not create a lotto with same user and id", async () => {
    try {
      const overrides = {
        value: ethers.utils.parseEther("0.01"),
      };
      await expect(grotto.createLotto(lotto, overrides)).to.be.revertedWith(
        "Lotto with same ID and Creator already exists"
      );
    } catch (error) {
      console.log(error);
      expect(error).to.equal(undefined);
    }
  });

  it("should not create a lotto if winning type is number of users and number of players is not greater 0", async () => {
    try {
      const overrides = {
        value: ethers.utils.parseEther("0.01"),
      };

      lotto.id = 2;
      lotto.maxNumberOfPlayers = 0;
      await expect(grotto.createLotto(lotto, overrides)).to.be.revertedWith(
        "Number of players must be greater than 0"
      );
    } catch (error) {
      console.log(error);
      expect(error).to.equal(undefined);
    }
  });

  it("should not create a lotto if bet amount is not greater than 0", async () => {
    try {
      lotto.id = 2;
      lotto.maxNumberOfPlayers = 100;
      await expect(grotto.createLotto(lotto)).to.be.revertedWith(
        "Can not create a lotto with 0 bet amount"
      );
    } catch (error) {
      console.log(error);
      expect(error).to.equal(undefined);
    }
  });


  it("should not create a lotto if winning type is time based and start time is not less than end time", async () => {
    try {
      const overrides = {
        value: ethers.utils.parseEther("0.01"),
      };

      lotto.id = 2;
      lotto.winningType = WinningType.TIME_BASED;
      await expect(grotto.createLotto(lotto, overrides)).to.be.revertedWith(
        "Start time must be less than end time"
      );
    } catch (error) {
      console.log(error);
      expect(error).to.equal(undefined);
    }
  });

  it("should not create a lotto if winning type is time based and end time is not in future", async () => {
    try {
      const overrides = {
        value: ethers.utils.parseEther("0.01"),
      };

      lotto.id = 2;
      lotto.winningType = WinningType.TIME_BASED;
      lotto.endTime = 1;
      await expect(grotto.createLotto(lotto, overrides)).to.be.revertedWith(
        "End time must be in the future"
      );
    } catch (error) {
      console.log(error);
      expect(error).to.equal(undefined);
    }
  });

  it("should create a lotto with winning type = time based", async () => {
    try {
      const overrides = {
        value: ethers.utils.parseEther("0.01"),
      };

      lotto.id = 2;
      lotto.winningType = WinningType.TIME_BASED;
      lotto.endTime = Math.floor((new Date().getTime() + 8.64e7) / 1000); // + 24 hours;
      await expect(grotto.createLotto(lotto, overrides)).to.emit(
        grotto,
        "LottoCreated"
      );
    } catch (error) {
      console.log(error);
      expect(error).to.equal(undefined);
    }
  });

  it("should get running lottos", async () => {
    try {
      const lotto = await grotto.getLottoById(1);
      expect(lotto.id.toNumber()).to.be.eq(1);
      expect(lotto.creator).to.be.eq(accounts[0].address);
    } catch (error) {
      console.log(error);
      expect(error).to.equal(undefined);
    }
  });
});
