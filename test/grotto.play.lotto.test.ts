import { Contract } from "@ethersproject/contracts";
import { ethers, waffle } from "hardhat";
import chai from "chai";
import { expect } from "chai";
chai.use(waffle.solidity);
import { Lotto, WinningType } from "../scripts/models";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { BigNumber } from "@ethersproject/bignumber";

describe("Grotto: Play Lotto Tests", () => {
  let accounts: SignerWithAddress[];
  const address0 = "0x0000000000000000000000000000000000000000";
  let grotto: Contract;
  let nopLotto: Lotto;
  let tbLotto: Lotto;

  before(async () => {
    accounts = await ethers.getSigners();
    nopLotto = {
      id: 10,
      creator: accounts[1].address,
      numberOfWinners: 1,
      winnersShares: [100],
      startTime: 0, //Math.floor(new Date().getTime() / 1000),
      endTime: 0, //Math.floor((new Date().getTime() + 8.64e7) / 1000), // + 24 hours
      betAmount: BigNumber.from(0),
      maxNumberOfPlayers: 3,
      winningType: WinningType.NUMBER_OF_PLAYERS,
      isFinished: false,
      players: [],
      stakes: BigNumber.from(0),
      winner: address0,
    };

    tbLotto = {
      id: 100,
      creator: accounts[1].address,
      numberOfWinners: 1,
      winnersShares: [100],
      startTime: Math.floor(new Date().getTime() / 1000),
      endTime: Math.floor((new Date().getTime() + 8.64e7) / 1000), // + 24 hours
      betAmount: BigNumber.from(0),
      maxNumberOfPlayers: 0,
      winningType: WinningType.TIME_BASED,
      isFinished: false,
      players: [],
      stakes: BigNumber.from(0),
      winner: address0,
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

  it("should create a number of player lotto winning type", async () => {
    try {
      const overrides = {
        value: ethers.utils.parseEther("0.01"),
      };

      await expect(grotto.createLotto(nopLotto, overrides)).to.emit(
        grotto,
        "LottoCreated"
      );
    } catch (error) {
      console.log(error);
      expect(error).to.equal(undefined);
    }
  });

  it("should play number of players lotto", async () => {
    try {
      const overrides = {
        value: ethers.utils.parseEther("0.01"),
      };      
      const player1 = await grotto.connect(accounts[2]);
      await expect(player1.playLotto(nopLotto.id, overrides)).to.emit(grotto, "BetPlaced");
    } catch (error) {
      console.log(error);
      expect(error).to.equal(undefined);
    }
  });
});
