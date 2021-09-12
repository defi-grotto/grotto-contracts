import { Contract } from "@ethersproject/contracts";
import { ethers, waffle } from "hardhat";
import chai from "chai";
import { expect } from "chai";
chai.use(waffle.solidity);
import { Lotto, WinningType } from "../scripts/models";
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
      numberOfWinners: 1,
      winnersShares: [100],
      startTime: 0, //Math.floor(new Date().getTime() / 1000),
      endTime: 0, //Math.floor((new Date().getTime() + 8.64e7) / 1000), // + 24 hours
      betAmount: BigNumber.from(0),
      numberOfPlayers: 10,
      winningType: WinningType.NUMBER_OF_PLAYERS,
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
        "ERROR_4"
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
      lotto.numberOfPlayers = 0;
      await expect(grotto.createLotto(lotto, overrides)).to.be.revertedWith(
        "ERROR_8"
      );
    } catch (error) {
      console.log(error);
      expect(error).to.equal(undefined);
    }
  });

  it("should not create a lotto if bet amount is not greater than 0", async () => {
    try {
      lotto.id = 2;
      lotto.numberOfPlayers = 100;
      await expect(grotto.createLotto(lotto)).to.be.revertedWith("ERROR_7");
    } catch (error) {
      console.log(error);
      expect(error).to.equal(undefined);
    }
  });

  it("should not create a lotto if number of winners and winners shares length don't match", async () => {
    try {
      const overrides = {
        value: ethers.utils.parseEther("0.01"),
      };

      lotto.id = 2;
      lotto.numberOfWinners = 2;
      await expect(grotto.createLotto(lotto, overrides)).to.be.revertedWith(
        "ERROR_5"
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
      lotto.numberOfWinners = 1;
      lotto.winningType = WinningType.TIME_BASED;
      await expect(grotto.createLotto(lotto, overrides)).to.be.revertedWith(
        "ERROR_6"
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
        "ERROR_10"
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
      const lottoIds = await grotto.getLottos();

      expect(lottoIds).to.be.an('array');
      expect(lottoIds[0]).to.be.eq(1);
      expect(lottoIds[1]).to.be.eq(2);
    } catch (error) {
      console.log(error);
      expect(error).to.equal(undefined);
    }
  });
});
