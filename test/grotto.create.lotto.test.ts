import { Contract } from "@ethersproject/contracts";
import { ethers, waffle, upgrades } from "hardhat";
import chai from "chai";
import { expect } from "chai";
chai.use(waffle.solidity);
import { platformOwner, WinningType } from "./models";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { BigNumber } from "@ethersproject/bignumber";

describe("Grotto: Create Lotto Tests", () => {
  let accounts: SignerWithAddress[];
  const address0 = "0x0000000000000000000000000000000000000000";
  let grotto: Contract;

  const lottoIds: Array<number> = [];
  before(async () => {
    accounts = await ethers.getSigners();

    const Storage = await ethers.getContractFactory("Storage");    
    const PotController = await ethers.getContractFactory("PotController");
    const SingleWinnerPotController = await ethers.getContractFactory("SingleWinnerPotController");

    const storageController = await upgrades.deployProxy(Storage);
    const potController = await upgrades.deployProxy(PotController, [storageController.address]);        
    const swPotController = await upgrades.deployProxy(SingleWinnerPotController, [storageController.address]);

    const Grotto = await ethers.getContractFactory("Grotto");
    const LottoController = await ethers.getContractFactory("LottoController");
    const controller = await upgrades.deployProxy(LottoController, [storageController.address]);

    grotto = await upgrades.deployProxy(Grotto, [
      controller.address,
      potController.address,
      swPotController.address,
      storageController.address
    ]);

    await controller.grantLottoCreator(grotto.address);
    await controller.grantLottoPlayer(grotto.address);
    await controller.grantAdmin(grotto.address);

    await storageController.grantAdminRole(controller.address);
    await storageController.grantAdminRole(potController.address);
    await storageController.grantAdminRole(swPotController.address);


    console.log(`LottoController Deployed to ${controller.address}`);
    expect(controller.address).to.not.eq(address0);
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

      // uint256 _startTime,
      // uint256 _endTime,
      // uint256 _maxNumberOfPlayers,
      // WinningType _winningType
      await expect(
        grotto.createLotto(0, 0, 10, WinningType.NUMBER_OF_PLAYERS, overrides)
      ).to.emit(grotto, "LottoCreated");
      lottoIds.push(1);
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

      await expect(
        grotto.createLotto(0, 0, 0, WinningType.NUMBER_OF_PLAYERS, overrides)
      ).to.be.revertedWith("Inv. No. of players");
    } catch (error) {
      console.log(error);
      expect(error).to.equal(undefined);
    }
  });

  it("should not create a lotto if bet amount is not greater than 0", async () => {
    try {
      await expect(
        grotto.createLotto(0, 0, 10, WinningType.NUMBER_OF_PLAYERS)
      ).to.be.revertedWith("Inv. lotto bet amount");
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

      await expect(
        grotto.createLotto(10, 5, 10, WinningType.TIME_BASED, overrides)
      ).to.be.revertedWith("Start time must be less than end time");
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

      await expect(
        grotto.createLotto(10, 500, 10, WinningType.TIME_BASED, overrides)
      ).to.be.revertedWith("End time must be in the future");
    } catch (error) {
      console.log(error);
      expect(error).to.equal(undefined);
    }
  });

  it("should create a lotto with winning type = time based", async () => {
    try {
      const overrides = {
        value: ethers.utils.parseEther("0.1"),
      };

      const endTime = Math.floor((new Date().getTime() + 8.64e7) / 1000); // + 24 hours;
      const startTime = Math.floor(new Date().getTime() / 1000);
      await expect(
        grotto.createLotto(
          startTime,
          endTime,
          10,
          WinningType.TIME_BASED,
          overrides
        )
      ).to.emit(grotto, "LottoCreated");
      lottoIds.push(2);
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
      expect(ethers.utils.formatEther(lotto.betAmount)).to.be.eq("0.01");
      expect(ethers.utils.formatEther(lotto.stakes)).to.be.eq("0.01");
      expect(lotto.winningType).to.be.eq(WinningType.NUMBER_OF_PLAYERS);      
      const lotto2 = await grotto.getLottoById(2);
      expect(lotto2.id.toNumber()).to.be.eq(2);
      expect(lotto2.creator).to.be.eq(accounts[0].address);
      expect(ethers.utils.formatEther(lotto2.betAmount)).to.be.eq("0.1");
      expect(ethers.utils.formatEther(lotto2.stakes)).to.be.eq("0.1");
      expect(lotto2.winningType).to.be.eq(WinningType.TIME_BASED);      

      const allLottos: Array<BigNumber> = await grotto.getAllLottos();
      let index = 0;
      for(let l of allLottos) {
        expect(l).to.be.eq(lottoIds[index]);
        index++;
      }
    } catch (error) {
      console.log(error);
      expect(error).to.equal(undefined);
    }
  });
});
