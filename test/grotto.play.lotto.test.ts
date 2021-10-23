import { Contract } from "@ethersproject/contracts";
import { ethers, waffle } from "hardhat";
import chai from "chai";
import { expect } from "chai";
chai.use(waffle.solidity);
import { Lotto, platformOwner, WinningType } from "../scripts/models";
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
    // console.log(accounts.map(a => a.address));
    nopLotto = {
      id: 10,
      creator: accounts[1].address,
      startTime: 0, //Math.floor(new Date().getTime() / 1000),
      endTime: 0, //Math.floor((new Date().getTime() + 8.64e7) / 1000), // + 24 hours
      betAmount: BigNumber.from(0),
      maxNumberOfPlayers: 3,
      winningType: WinningType.NUMBER_OF_PLAYERS,
      isFinished: false,
      players: [],
      stakes: BigNumber.from(0),
      winner: address0,
      winning: 0
    };

    tbLotto = {
      id: 100,
      creator: accounts[1].address,
      startTime: Math.floor(new Date().getTime() / 1000),
      endTime: Math.floor((new Date().getTime() + 8.64e7) / 1000), // + 24 hours
      betAmount: BigNumber.from(0),
      maxNumberOfPlayers: 0,
      winningType: WinningType.TIME_BASED,
      isFinished: false,
      players: [],
      stakes: BigNumber.from(0),
      winner: address0,
      winning: 0
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

  it("should not play lotto by creator", async () => {
    try {
      const overrides = {
        value: ethers.utils.parseEther("0.01"),
      };      
      await expect(grotto.playLotto(nopLotto.id, overrides)).to.be.revertedWith("Creator can not play");
    } catch (error) {
      console.log(error);
      expect(error).to.equal(undefined);
    }    
  });

  it("should not play lotto with non-existent lotto id", async () => {
    try {
      const overrides = {
        value: ethers.utils.parseEther("0.01"),
      };      
      const player1 = await grotto.connect(accounts[1]);
      await expect(player1.playLotto(nopLotto.id + 1001, overrides)).to.be.revertedWith("Lotto does not exist");
    } catch (error) {
      console.log(error);
      expect(error).to.equal(undefined);
    }    
  });  

  it("should not play lotto if bet amount is lower that what is set by creator", async () => {
    try {
      const overrides = {
        value: ethers.utils.parseEther("0.001"),
      };      
      const player1 = await grotto.connect(accounts[1]);
      await expect(player1.playLotto(nopLotto.id, overrides)).to.be.revertedWith("BetPlaced is too low");
    } catch (error) {
      console.log(error);
      expect(error).to.equal(undefined);
    }    
  });  
  
  it('should not claim winnings before lotto is finished', async () => {
    await expect(grotto.claim(nopLotto.id)).to.be.revertedWith("Lotto is not finished");
  });    

  it("should not play lotto if max number of players reached", async () => {
    try {
      const overrides = {
        value: ethers.utils.parseEther("0.01"),
      };      
      const player2 = await grotto.connect(accounts[3]);
      await expect(player2.playLotto(nopLotto.id, overrides)).to.emit(grotto, "BetPlaced");      

      const player3 = await grotto.connect(accounts[4]);
      await expect(player3.playLotto(nopLotto.id, overrides)).to.emit(grotto, "BetPlaced");            

      const player4 = await grotto.connect(accounts[5]);
      await expect(player4.playLotto(nopLotto.id, overrides)).to.be.revertedWith("Lotto is finished");
    } catch (error) {
      console.log(error);
      expect(error).to.equal(undefined);
    }    
  });
  
  it('should find winner after max number of players reached', async() => {
    try {
      const overrides = {
        value: ethers.utils.parseEther("0.01"),
      };

      // create lotto
      nopLotto.id = 20;
      await expect(grotto.createLotto(nopLotto, overrides)).to.emit(grotto, "LottoCreated");

      // player 1
      const player1 = await grotto.connect(accounts[2]);
      await expect(player1.playLotto(nopLotto.id, overrides)).to.emit(grotto, "BetPlaced");      

      let lotto = await grotto.getLottoById(20);      

      // player 2
      const player2 = await grotto.connect(accounts[3]);
      await expect(player2.playLotto(nopLotto.id, overrides)).to.emit(grotto, "BetPlaced");      

      // player 3
      const player3 = await grotto.connect(accounts[4]);
      await expect(player3.playLotto(nopLotto.id, overrides)).to.emit(grotto, "BetPlaced");            
      lotto = await grotto.getLottoById(nopLotto.id);
      expect(lotto.winner).to.be.oneOf([accounts[2].address, accounts[3].address, accounts[4].address]);
      // TODO: calculate winning
      // expect(lotto.winning)

    } catch (error) {
      console.log("Errored: ", error);
      expect(error).to.equal(undefined);
    }
  });

  it('should claim winnings', async () => {
    const lotto = await grotto.getLottoById(nopLotto.id);
    const winnerAddress = lotto.winner;
    const winnerAccountIndex = accounts.map((account, index) => account.address === winnerAddress ? index : -1).filter(index => index >= 0);
    const balanceBefore = await ethers.provider.getBalance(winnerAddress);   
    const winner = await grotto.connect(accounts[winnerAccountIndex[0]]); 
    await expect(winner.claim(nopLotto.id)).to.emit(grotto, "Claimed");
    const balanceAfter = await ethers.provider.getBalance(winnerAddress);    
    expect(+ethers.utils.formatEther(balanceBefore)).to.be.lessThan(+ethers.utils.formatEther(balanceAfter));
  });

  it('should not claim winnings twice', async () => {
    await expect(grotto.claim(nopLotto.id)).to.be.revertedWith("Lotto is already claimed");
  });  

  it("should create a time based lotto winning type", async () => {
    try {
      const overrides = {
        value: ethers.utils.parseEther("0.01"),
      };

      await expect(grotto.createLotto(tbLotto, overrides)).to.emit(
        grotto,
        "LottoCreated"
      );
    } catch (error) {
      console.log(error);
      expect(error).to.equal(undefined);
    }
  }); 
  
  it("should play time based lotto", async () => {
    try {
      const overrides = {
        value: ethers.utils.parseEther("0.01"),
      };      
      const player1 = await grotto.connect(accounts[2]);
      await expect(player1.playLotto(tbLotto.id, overrides)).to.emit(grotto, "BetPlaced");      
    } catch (error) {
      console.log(error);
      expect(error).to.equal(undefined);
    }
  });
  
  it('should not claim winnings before lotto is finished', async () => {
    await expect(grotto.claim(tbLotto.id)).to.be.revertedWith("Lotto is not finished");
  });
  
  it("should not play time based lotto if end time has reached", async () => {
    try {
      const overrides = {
        value: ethers.utils.parseEther("0.01"),
      };      

      const creator = await grotto.connect(accounts[0]);
      await creator.forceEndLotto(tbLotto.id);
      const player4 = await grotto.connect(accounts[5]);
      await expect(player4.playLotto(tbLotto.id, overrides)).to.be.revertedWith("Lotto has reached end time");
    } catch (error) {
      console.log(error);
      expect(error).to.equal(undefined);
    }    
  });  

  it("should not play time based lotto if start time has not reached", async () => {
    try {
      const overrides = {
        value: ethers.utils.parseEther("0.01"),
      }; 
      
      const futureLotto = {
        ...tbLotto
      };

      futureLotto.startTime = futureLotto.endTime;
      futureLotto.id = 100110;
      futureLotto.startTime -= 10;

      await expect(grotto.createLotto(futureLotto, overrides)).to.emit(
        grotto,
        "LottoCreated"
      );

      const player4 = await grotto.connect(accounts[5]);
      await expect(player4.playLotto(futureLotto.id, overrides)).to.be.revertedWith("Lotto is not started");
    } catch (error) {
      console.log(error);
      expect(error).to.equal(undefined);
    }    
  });  


  it('should find winner after end time has reached reached', async() => {
    try {
      const overrides = {
        value: ethers.utils.parseEther("0.01"),
      };

      // create lotto
      nopLotto.id = 200;
      await expect(grotto.createLotto(nopLotto, overrides)).to.emit(grotto, "LottoCreated");

      // player 1
      const player1 = await grotto.connect(accounts[2]);
      await expect(player1.playLotto(nopLotto.id, overrides)).to.emit(grotto, "BetPlaced");      

      // player 2
      const player2 = await grotto.connect(accounts[3]);
      await expect(player2.playLotto(nopLotto.id, overrides)).to.emit(grotto, "BetPlaced");      

      // player 3
      const player3 = await grotto.connect(accounts[4]);
      await expect(player3.playLotto(nopLotto.id, overrides)).to.emit(grotto, "BetPlaced");            
      let lotto = await grotto.getLottoById(nopLotto.id);
      expect(lotto.winner).to.be.oneOf([accounts[2].address, accounts[3].address, accounts[4].address]);
      // TODO: calculate winning

    } catch (error) {
      console.log("Errored: ", error);
      expect(error).to.equal(undefined);
    }
  });  
});
