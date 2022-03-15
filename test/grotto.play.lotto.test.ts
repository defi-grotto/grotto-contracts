import { Contract } from "@ethersproject/contracts";
import { ethers, waffle, upgrades } from "hardhat";
import chai from "chai";
import { expect } from "chai";
chai.use(waffle.solidity);
import { platformOwner, WinningType } from "./models";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { BigNumber } from "@ethersproject/bignumber";

describe.only("Grotto: Play Lotto Tests", () => {
  let accounts: SignerWithAddress[];
  const address0 = "0x0000000000000000000000000000000000000000";
  let grotto: Contract;

  const lottoIds: Array<number> = [];

  before(async () => {
    accounts = await ethers.getSigners();
    
    // uint256 _startTime = 0,
    // uint256 _endTime = 0,
    // uint256 _maxNumberOfPlayers = 3,
    // WinningType _winningType NUMBER_OF_PLAYERS
    const Grotto = await ethers.getContractFactory("Grotto");
    const LottoController = await ethers.getContractFactory("LottoController");
    const controller = await upgrades.deployProxy(LottoController);

    grotto = await upgrades.deployProxy(Grotto, [
      controller.address,
      address0,
      address0,
    ]);

    await controller.grantLottoCreator(grotto.address);
    await controller.grantLottoPlayer(grotto.address);
    await controller.grantAdmin(grotto.address);

    console.log(`Lotto Controller Deployed to ${controller.address}`);
    expect(controller.address).to.not.eq(address0);

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

      await expect(grotto.createLotto(0, 0, 3, WinningType.NUMBER_OF_PLAYERS, overrides)).to.emit(
        grotto,
        "LottoCreated"
      );
      lottoIds.push(1);
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
      const player1 = await grotto.connect(accounts[1]);
      await expect(player1.playLotto(lottoIds[0], overrides)).to.emit(
        grotto,
        "BetPlaced"
      );
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
      await expect(grotto.playLotto(lottoIds[0], overrides)).to.be.revertedWith(
        "Creator can not play"
      );
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
      await expect(
        player1.playLotto(1001, overrides)
      ).to.be.revertedWith("Lotto does not exist");
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
      await expect(
        player1.playLotto(lottoIds[0], overrides)
      ).to.be.revertedWith("BetPlaced is too low");
    } catch (error) {
      console.log(error);
      expect(error).to.equal(undefined);
    }
  });

  it("should not claim winnings before lotto is finished", async () => {
    await expect(grotto.claim(lottoIds[0])).to.be.revertedWith(
      "Lotto is not finished"
    );
  });

  it("should not play lotto if max number of players reached", async () => {
    try {
      const overrides = {
        value: ethers.utils.parseEther("0.01"),
      };
      const player2 = await grotto.connect(accounts[2]);
      await expect(player2.playLotto(lottoIds[0], overrides)).to.emit(
        grotto,
        "BetPlaced"
      );

      const player3 = await grotto.connect(accounts[3]);
      await expect(player3.playLotto(lottoIds[0], overrides)).to.emit(
        grotto,
        "BetPlaced"
      );

      const lotto = await grotto.getLottoById(lottoIds[0]);      

      const player4 = await grotto.connect(accounts[4]);
      await expect(player4.playLotto(lottoIds[0], overrides)).to.be.revertedWith("Lotto is finished");

      
    } catch (error) {
      console.log(error);
      expect(error).to.equal(undefined);
    }
  });

  it("should find winner after max number of players reached", async () => {
    try {
      const overrides = {
        value: ethers.utils.parseEther("0.01"),
      };

      // create lotto
      await expect(grotto.createLotto(0, 0, 3, WinningType.NUMBER_OF_PLAYERS, overrides)).to.emit(
        grotto,
        "LottoCreated"
      );
      lottoIds.push(2);

      // player 1
      const player1 = await grotto.connect(accounts[1]);
      await expect(player1.playLotto(lottoIds[1], overrides)).to.emit(
        grotto,
        "BetPlaced"
      );

      // player 2
      const player2 = await grotto.connect(accounts[2]);
      await expect(player2.playLotto(lottoIds[1], overrides)).to.emit(
        grotto,
        "BetPlaced"
      );

      // player 3
      const player3 = await grotto.connect(accounts[3]);
      await expect(player3.playLotto(lottoIds[1], overrides)).to.emit(
        grotto,
        "BetPlaced"
      );
      const lotto = await grotto.getLottoById(lottoIds[1]);
      expect(lotto.winner).to.be.oneOf([
        accounts[2].address,
        accounts[3].address,
        accounts[4].address,
      ]);

      const totalStaked = ethers.utils
        .parseEther("0.01")
        .add(ethers.utils.parseEther("0.01"))
        .add(ethers.utils.parseEther("0.01"))
        .add(ethers.utils.parseEther("0.01"));
      const winnerShare = totalStaked.mul(70).div(100);
      expect(ethers.utils.formatEther(winnerShare.toString())).to.equal(
        ethers.utils.formatEther(lotto.winning)
      );

      const creatorShares = totalStaked.mul(20).div(100);
      expect(ethers.utils.formatEther(creatorShares.toString())).to.equal(
        ethers.utils.formatEther(lotto.creatorShares)
      );
    } catch (error) {
      console.log("Errored: ", error);
      expect(error).to.equal(undefined);
    }
  });

  it("should claim winnings", async () => {
    const lotto = await grotto.getLottoById(lottoIds[1]);
    const winnerAddress = lotto.winner;
    const winnerAccountIndex = accounts
      .map((account, index) => (account.address === winnerAddress ? index : -1))
      .filter((index) => index >= 0);

    const balanceBefore = await ethers.provider.getBalance(winnerAddress);
    const winner = await grotto.connect(accounts[winnerAccountIndex[0]]);

    await expect(winner.claim(lottoIds[1])).to.emit(grotto, "Claimed");
    const balanceAfter = await ethers.provider.getBalance(winnerAddress);

    expect(+ethers.utils.formatEther(balanceBefore)).to.be.lessThan(
      +ethers.utils.formatEther(balanceAfter)
    );
  });

  it("should claim winnings by creator", async () => {
    try {
      const overrides = {
        value: ethers.utils.parseEther("0.01"),
      };

      // create lotto
      await expect(grotto.createLotto(0, 0, 3, WinningType.NUMBER_OF_PLAYERS, overrides)).to.emit(
        grotto,
        "LottoCreated"
      );
      lottoIds.push(3);

      // player 1
      const player1 = await grotto.connect(accounts[1]);
      await expect(player1.playLotto(lottoIds[2], overrides)).to.emit(
        grotto,
        "BetPlaced"
      );

      // player 2
      const player2 = await grotto.connect(accounts[2]);
      await expect(player2.playLotto(lottoIds[2], overrides)).to.emit(
        grotto,
        "BetPlaced"
      );

      // player 3
      const player3 = await grotto.connect(accounts[3]);
      await expect(player3.playLotto(lottoIds[2], overrides)).to.emit(
        grotto,
        "BetPlaced"
      );
      const lotto = await grotto.getLottoById(lottoIds[2]);
      expect(lotto.winner).to.be.oneOf([
        accounts[1].address,
        accounts[2].address,
        accounts[3].address,
      ]);

      const totalStaked = ethers.utils
        .parseEther("0.01")
        .add(ethers.utils.parseEther("0.01"))
        .add(ethers.utils.parseEther("0.01"))
        .add(ethers.utils.parseEther("0.01"));
      const winnerShare = totalStaked.mul(70).div(100);
      expect(ethers.utils.formatEther(winnerShare.toString())).to.equal(
        ethers.utils.formatEther(lotto.winning)
      );

      const creatorShares = totalStaked.mul(20).div(100);
      expect(ethers.utils.formatEther(creatorShares.toString())).to.equal(
        ethers.utils.formatEther(lotto.creatorShares)
      );

      // claim by user first
      const winnerAddress = lotto.winner;
      const winnerAccountIndex = accounts
        .map((account, index) =>
          account.address === winnerAddress ? index : -1
        )
        .filter((index) => index >= 0);
      const winner = await grotto.connect(accounts[winnerAccountIndex[0]]);
      await expect(winner.claim(lottoIds[2])).to.emit(grotto, "Claimed");

      const balanceBefore = await ethers.provider.getBalance(
        accounts[0].address
      );
      await expect(grotto.claimCreator(lottoIds[2])).to.emit(
        grotto,
        "CreatorClaimed"
      );
      const balanceAfter = await ethers.provider.getBalance(
        accounts[0].address
      );
      expect(+ethers.utils.formatEther(balanceBefore)).to.be.lessThan(
        +ethers.utils.formatEther(balanceAfter)
      );

      // claim by platform too
      const balanceBeforeP = await ethers.provider.getBalance(
        accounts[0].address
      );
      await expect(grotto.claimPlatform(lottoIds[2])).to.emit(
        grotto,
        "PlatformClaimed"
      );
      const balanceAfterP = await ethers.provider.getBalance(
        accounts[0].address
      );
      expect(+ethers.utils.formatEther(balanceBeforeP)).to.be.lessThan(
        +ethers.utils.formatEther(balanceAfterP)
      );
    } catch (error) {
      console.log("Errored: ", error);
      expect(error).to.equal(undefined);
    }
  });

  it("should not claim winnings twice", async () => {
    const lotto = await grotto.getLottoById(lottoIds[2]);

    const winnerAddress = lotto.winner;
    const winnerAccountIndex = accounts
      .map((account, index) =>
        account.address === winnerAddress ? index : -1
      )
      .filter((index) => index >= 0);
    const winner = await grotto.connect(accounts[winnerAccountIndex[0]]);

    await expect(winner.claim(lottoIds[2])).to.be.revertedWith(
      "Lotto is already claimed"
    );

    await expect(grotto.claimPlatform(lottoIds[2])).to.be.revertedWith("Creator already claimed");
  });

  it("should create a time based lotto winning type", async () => {
    try {
      const overrides = {
        value: ethers.utils.parseEther("0.01"),
      };

    const _startTime = Math.floor(new Date().getTime() / 1000);
    const _endTime = Math.floor((new Date().getTime() + 8.64e7) / 1000); // + 24 hours

      await expect(grotto.createLotto(_startTime, _endTime, 0, WinningType.TIME_BASED, overrides)).to.emit(
        grotto,
        "LottoCreated"
      );
      lottoIds.push(4);
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
      const player1 = await grotto.connect(accounts[1]);
      await expect(player1.playLotto(lottoIds[3], overrides)).to.emit(
        grotto,
        "BetPlaced"
      );
    } catch (error) {
      console.log(error);
      expect(error).to.equal(undefined);
    }
  });

  it("should not claim winnings before lotto is finished", async () => {
    await expect(grotto.claim(lottoIds[3])).to.be.revertedWith(
      "Lotto is not finished"
    );
  });

  it("should not play time based lotto if start time has not reached", async () => {
    try {
      const overrides = {
        value: ethers.utils.parseEther("0.01"),
      };

      const startTime = new Date().getTime() + 10000;
      const endTime = startTime + 1000000;

      await expect(grotto.createLotto(startTime, endTime, 0, WinningType.TIME_BASED, overrides)).to.emit(
        grotto,
        "LottoCreated"
      );
      lottoIds.push(5);

      const player4 = await grotto.connect(accounts[4]);
      await expect(
        player4.playLotto(lottoIds[4], overrides)
      ).to.be.revertedWith("Lotto is not started");
    } catch (error) {
      console.log(error);
      expect(error).to.equal(undefined);
    }
  });

  it("should find winner after end time has reached reached", async () => {
    try {
      const overrides = {
        value: ethers.utils.parseEther("0.01"),
      };

      // create lotto
      const _startTime = Math.floor(new Date().getTime() / 1000);
      const _endTime = Math.floor((new Date().getTime() + 8.64e7) / 1000); // + 24 hours  
      await expect(grotto.createLotto(_startTime, _endTime, 0, WinningType.TIME_BASED, overrides)).to.emit(
        grotto,
        "LottoCreated"
      );
      lottoIds.push(6);

      // player 1
      const player1 = await grotto.connect(accounts[1]);
      await expect(player1.playLotto(lottoIds[5], overrides)).to.emit(
        grotto,
        "BetPlaced"
      );

      // player 2
      const player2 = await grotto.connect(accounts[2]);
      await expect(player2.playLotto(lottoIds[5], overrides)).to.emit(
        grotto,
        "BetPlaced"
      );

      // player 3
      const player3 = await grotto.connect(accounts[3]);
      await expect(player3.playLotto(lottoIds[5], overrides)).to.emit(
        grotto,
        "BetPlaced"
      );

      await grotto.forceEnd(lottoIds[5]);      

      const player4 = await grotto.connect(accounts[4]);
      await expect(player4.playLotto(lottoIds[5], overrides)).to.emit(
        grotto,
        "BetPlaced"
      );      
            
      let lotto = await grotto.getLottoById(lottoIds[5]);      

      expect(lotto.winner).to.be.oneOf([
        accounts[1].address,
        accounts[2].address,
        accounts[3].address,
      ]);

      const totalStaked = ethers.utils
        .parseEther("0.01")
        .add(ethers.utils.parseEther("0.01"))
        .add(ethers.utils.parseEther("0.01"))
        .add(ethers.utils.parseEther("0.01"));
      const winnerShare = totalStaked.mul(70).div(100);
      expect(ethers.utils.formatEther(winnerShare.toString())).to.equal(
        ethers.utils.formatEther(lotto.winning)
      );

      const creatorShares = totalStaked.mul(20).div(100);
      expect(ethers.utils.formatEther(creatorShares.toString())).to.equal(
        ethers.utils.formatEther(lotto.creatorShares)
      );
    } catch (error) {
      console.log("Errored: ", error);
      expect(error).to.equal(undefined);
    }
  });

  it("should claim winnings", async () => {
    const lotto = await grotto.getLottoById(lottoIds[5]);
    const winnerAddress = lotto.winner;
    const winnerAccountIndex = accounts
      .map((account, index) => (account.address === winnerAddress ? index : -1))
      .filter((index) => index >= 0);
    const balanceBefore = await ethers.provider.getBalance(winnerAddress);
    const winner = await grotto.connect(accounts[winnerAccountIndex[0]]);
    await expect(winner.claim(lottoIds[5])).to.emit(grotto, "Claimed");
    const balanceAfter = await ethers.provider.getBalance(winnerAddress);
    expect(+ethers.utils.formatEther(balanceBefore)).to.be.lessThan(
      +ethers.utils.formatEther(balanceAfter)
    );
  });
});
