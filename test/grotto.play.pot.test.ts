import { Contract } from "@ethersproject/contracts";
import { ethers, waffle } from "hardhat";
import chai from "chai";
import { expect } from "chai";
chai.use(waffle.solidity);
import { Lotto, platformOwner, Pot, PotGuessType, WinningType } from "../scripts/models";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { BigNumber } from "@ethersproject/bignumber";

describe.only("Grotto: Play Pot Tests", () => {
  let accounts: SignerWithAddress[];
  const address0 = "0x0000000000000000000000000000000000000000";
  let grotto: Contract;
  let nopLotto: Lotto;
  let tbLotto: Lotto;

  let nopPot: Pot;
  let tbPot: Pot;

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
      winners: [],
      winnings: []
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
      winners: [],
      winnings: []
    };

    nopPot = {
      lotto: nopLotto,
      potAmount: BigNumber.from(1),
      potGuessType: PotGuessType.ORDER,
      winningNumbers: [3, 6, 9, 3]
    };

    tbPot = {
      lotto: tbLotto,
      potAmount: BigNumber.from(0),
      potGuessType: PotGuessType.ORDER,
      winningNumbers: [3, 6, 9, 3]      
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

  it("should create a number of player pot winning type", async () => {
    try {
      const overrides = {
        value: ethers.utils.parseEther("0.01"),
      };

      nopPot.lotto.betAmount = ethers.utils.parseEther("0.01");
      await expect(grotto.createPot(nopPot, overrides)).to.emit(
        grotto,
        "PotCreated"
      );
    } catch (error) {
      console.log(error);
      expect(error).to.equal(undefined);
    }
  });  

  it("should play number of players pot", async () => {
    try {
      const overrides = {
        value: ethers.utils.parseEther("0.01"),
      };      

      const guesses = [3, 6, 9, 1];
      const player1 = await grotto.connect(accounts[2]);
      await expect(player1.playPot(nopPot.lotto.id, guesses, overrides)).to.emit(grotto, "BetPlaced");      
    } catch (error) {
      console.log(error);
      expect(error).to.equal(undefined);
    }
  });  

  it("should not play pot by creator", async () => {
    try {
      const overrides = {
        value: ethers.utils.parseEther("0.01"),
      };      
      const guesses = [3, 6, 9, 1];
      const player1 = await grotto.connect(accounts[1]);
      await expect(player1.playPot(nopPot.lotto.id, guesses, overrides)).to.be.revertedWith("Creator can not play");
    } catch (error) {
      console.log(error);
      expect(error).to.equal(undefined);
    }    
  }); 
  
  it("should not play pot with non-existent lotto id", async () => {
    try {
      const overrides = {
        value: ethers.utils.parseEther("0.01"),
      };      
      const guesses = [3, 6, 9, 1];
      const player1 = await grotto.connect(accounts[1]);      
      await expect(player1.playPot(nopPot.lotto.id + 1001, guesses, overrides)).to.be.revertedWith("Lotto does not exist");
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
      await expect(player1.playPot(nopPot.lotto.id, guesses, overrides)).to.be.revertedWith("BetPlaced is too low");
    } catch (error) {
      console.log(error);
      expect(error).to.equal(undefined);
    }    
  });  
  
  it('should not claim winnings before pot is finished', async () => {
    await expect(grotto.claim(nopPot.lotto.id)).to.be.revertedWith("Lotto is not finished");
  }); 
  
  it("should not play pot if max number of players reached", async () => {
    try {
      const overrides = {
        value: ethers.utils.parseEther("0.01"),
      };      
      const guesses = [3, 6, 9, 1];

      const player2 = await grotto.connect(accounts[3]);
      await expect(player2.playPot(nopLotto.id, guesses, overrides)).to.emit(grotto, "BetPlaced");      

      const player3 = await grotto.connect(accounts[4]);
      await expect(player3.playPot(nopLotto.id, guesses, overrides)).to.emit(grotto, "BetPlaced");            

      const player4 = await grotto.connect(accounts[5]);
      await expect(player4.playPot(nopLotto.id, guesses, overrides)).to.be.revertedWith("Max Number of Players reached");
    } catch (error) {
      console.log(error);
      expect(error).to.equal(undefined);
    }    
  });  
});
