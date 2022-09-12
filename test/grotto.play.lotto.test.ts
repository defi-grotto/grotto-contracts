import { Contract } from "@ethersproject/contracts";
import { ethers, waffle } from "hardhat";
import { expect } from "chai";
import { WinningType } from "./models";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { BigNumber } from "ethers";

describe("Grotto: Play Lotto Tests", () => {
  let accounts: SignerWithAddress[];
  const address0 = "0x0000000000000000000000000000000000000000";
  let grotto: Contract;
  let lottoReader: Contract;

  const lottoIds: Array<number> = [];

  before(async () => {
    accounts = await ethers.getSigners();

    const Storage = await ethers.getContractFactory("Storage");
    const PotController = await ethers.getContractFactory("PotController");
    const SingleWinnerPotController = await ethers.getContractFactory(
      "SingleWinnerPotController"
    );

    const storageController = await Storage.deploy();
    await storageController.deployed();
    const potController = await PotController.deploy(storageController.address);
    const swPotController = await SingleWinnerPotController.deploy(
      storageController.address
    );

    const Grotto = await ethers.getContractFactory("Grotto");
    const LottoReader = await ethers.getContractFactory("LottoReader");
    const LottoController = await ethers.getContractFactory("LottoController");
    const controller = await LottoController.deploy(storageController.address);

    grotto = await Grotto.deploy(
      controller.address,
      potController.address,
      swPotController.address,
      storageController.address
    );

    lottoReader = await LottoReader.deploy(
      controller.address,
      storageController.address
    );

    await controller.grantLottoCreator(grotto.address);
    await controller.grantLottoPlayer(grotto.address);
    await controller.grantAdmin(grotto.address);

    await storageController.grantAdminRole(controller.address);
    await storageController.grantAdminRole(potController.address);
    await storageController.grantAdminRole(swPotController.address);
    await storageController.grantAdminRole(grotto.address);

    console.log(`LottoController Deployed to ${controller.address}`);
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

      await expect(
        grotto.createLotto(0, 0, 3, WinningType.NUMBER_OF_PLAYERS, overrides)
      ).to.emit(grotto, "LottoCreated");
      lottoIds.push(lottoIds.length);
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
      await expect(player1.playLotto(lottoIds.length, overrides)).to.emit(
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
      await expect(
        grotto.playLotto(lottoIds.length, overrides)
      ).to.be.revertedWith("Creator can not play");
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
      await expect(player1.playLotto(1001, overrides)).to.be.revertedWith(
        "Lotto does not exist"
      );
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
        player1.playLotto(lottoIds.length, overrides)
      ).to.be.revertedWith("BetPlaced is too low");
    } catch (error) {
      console.log(error);
      expect(error).to.equal(undefined);
    }
  });

  it("should not claim winnings before lotto is finished", async () => {
    await expect(grotto.claim(lottoIds.length)).to.be.revertedWith(
      "Lotto is not finished"
    );
  });

  it("should not play lotto if max number of players reached", async () => {
    try {
      const overrides = {
        value: ethers.utils.parseEther("0.01"),
      };
      const player2 = await grotto.connect(accounts[2]);
      await expect(player2.playLotto(lottoIds.length, overrides)).to.emit(
        grotto,
        "BetPlaced"
      );

      const player3 = await grotto.connect(accounts[3]);
      await expect(player3.playLotto(lottoIds.length, overrides)).to.emit(
        grotto,
        "BetPlaced"
      );

      const lottos = await lottoReader.getAll();
      expect(lottos.map((l: BigNumber) => l.toNumber())).to.not.contain(
        lottoIds.length
      );

      const completed = await lottoReader.getCompleted();
      expect(completed.map((c: BigNumber) => c.toNumber())).to.contain(
        lottoIds.length
      );

      const player4 = await grotto.connect(accounts[4]);
      await expect(
        player4.playLotto(lottoIds.length, overrides)
      ).to.be.revertedWith("Lotto is finished");
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
      await expect(
        grotto.createLotto(0, 0, 3, WinningType.NUMBER_OF_PLAYERS, overrides)
      ).to.emit(grotto, "LottoCreated");
      lottoIds.push(lottoIds.length);

      // player 1
      const player1 = await grotto.connect(accounts[1]);
      await expect(player1.playLotto(lottoIds.length, overrides)).to.emit(
        grotto,
        "BetPlaced"
      );

      // player 2
      const player2 = await grotto.connect(accounts[2]);
      await expect(player2.playLotto(lottoIds.length, overrides)).to.emit(
        grotto,
        "BetPlaced"
      );

      // player 3
      const player3 = await grotto.connect(accounts[3]);
      await expect(player3.playLotto(lottoIds.length, overrides)).to.emit(
        grotto,
        "BetPlaced"
      );
      const lotto = await lottoReader.getById(lottoIds.length);
      expect(lotto.winner).to.be.oneOf([
        accounts[1].address,
        accounts[2].address,
        accounts[3].address,
      ]);

      const totalStaked = ethers.utils
        .parseEther("0.009")
        .add(ethers.utils.parseEther("0.009"))
        .add(ethers.utils.parseEther("0.009"))
        .add(ethers.utils.parseEther("0.009"));
      const winnerShare = totalStaked.mul(80).div(100);
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
    const lotto = await lottoReader.getById(lottoIds.length);
    const winnerAddress = lotto.winner;
    const winnerAccountIndex = accounts
      .map((account, index) => (account.address === winnerAddress ? index : -1))
      .filter((index) => index >= 0);

    const balanceBefore = await ethers.provider.getBalance(winnerAddress);
    const winner = await grotto.connect(accounts[winnerAccountIndex[0]]);

    await expect(winner.claim(lottoIds.length)).to.emit(grotto, "Claimed");
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
      await expect(
        grotto.createLotto(0, 0, 3, WinningType.NUMBER_OF_PLAYERS, overrides)
      ).to.emit(grotto, "LottoCreated");
      lottoIds.push(lottoIds.length);

      // player 1
      const player1 = await grotto.connect(accounts[1]);
      await expect(player1.playLotto(lottoIds.length, overrides)).to.emit(
        grotto,
        "BetPlaced"
      );

      // player 2
      const player2 = await grotto.connect(accounts[2]);
      await expect(player2.playLotto(lottoIds.length, overrides)).to.emit(
        grotto,
        "BetPlaced"
      );

      // player 3
      const player3 = await grotto.connect(accounts[3]);
      await expect(player3.playLotto(lottoIds.length, overrides)).to.emit(
        grotto,
        "BetPlaced"
      );
      const lotto = await lottoReader.getById(lottoIds.length);
      expect(lotto.winner).to.be.oneOf([
        accounts[1].address,
        accounts[2].address,
        accounts[3].address,
      ]);

      const totalStaked = ethers.utils
        .parseEther("0.009")
        .add(ethers.utils.parseEther("0.009"))
        .add(ethers.utils.parseEther("0.009"))
        .add(ethers.utils.parseEther("0.009"));
      const winnerShare = totalStaked.mul(80).div(100);
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
      await expect(winner.claim(lottoIds.length)).to.emit(grotto, "Claimed");

      const balanceBefore = await ethers.provider.getBalance(
        accounts[0].address
      );
      await expect(grotto.claimCreator(lottoIds.length)).to.emit(
        grotto,
        "CreatorClaimed"
      );
      const balanceAfter = await ethers.provider.getBalance(
        accounts[0].address
      );
      expect(+ethers.utils.formatEther(balanceBefore)).to.be.lessThan(
        +ethers.utils.formatEther(balanceAfter)
      );
    } catch (error) {
      console.log("Errored: ", error);
      expect(error).to.equal(undefined);
    }
  });

  it("should not claim winnings twice", async () => {
    const lotto = await lottoReader.getById(lottoIds.length);

    const winnerAddress = lotto.winner;
    const winnerAccountIndex = accounts
      .map((account, index) => (account.address === winnerAddress ? index : -1))
      .filter((index) => index >= 0);
    const winner = await grotto.connect(accounts[winnerAccountIndex[0]]);

    await expect(winner.claim(lottoIds.length)).to.be.revertedWith(
      "Lotto is already claimed"
    );

    await expect(grotto.claimCreator(lottoIds.length)).to.be.revertedWith(
      "Creator already claimed"
    );
  });

  it("should create a time based lotto winning type", async () => {
    try {
      const overrides = {
        value: ethers.utils.parseEther("0.01"),
      };

      const _startTime = Math.floor(new Date().getTime() / 1000);
      const _endTime = Math.floor((new Date().getTime() + 8.64e7) / 1000); // + 24 hours

      await expect(
        grotto.createLotto(
          _startTime,
          _endTime,
          0,
          WinningType.TIME_BASED,
          overrides
        )
      ).to.emit(grotto, "LottoCreated");
      lottoIds.push(lottoIds.length);
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

      const _startTime = Math.floor(new Date().getTime() / 1000);
      const _endTime = Math.floor((new Date().getTime() + 8.64e7) / 1000); // + 24 hours
      await expect(
        grotto.createLotto(
          _startTime,
          _endTime,
          0,
          WinningType.TIME_BASED,
          overrides
        )
      ).to.emit(grotto, "LottoCreated");
      lottoIds.push(lottoIds.length);

      const player1 = await grotto.connect(accounts[1]);
      await expect(player1.playLotto(lottoIds.length, overrides)).to.emit(
        grotto,
        "BetPlaced"
      );
    } catch (error) {
      console.log(error);
      expect(error).to.equal(undefined);
    }
  });

  it("should not claim winnings before lotto is finished", async () => {
    await expect(grotto.claim(lottoIds.length)).to.be.revertedWith(
      "Lotto is not finished"
    );
  });

  it("should not play time based lotto if start time has not reached", async () => {
    try {
      const overrides = {
        value: ethers.utils.parseEther("0.01"),
      };

      const startTime = new Date().getTime() + 100000000;
      const endTime = startTime + 1000000;

      await expect(
        grotto.createLotto(
          startTime,
          endTime,
          0,
          WinningType.TIME_BASED,
          overrides
        )
      ).to.emit(grotto, "LottoCreated");
      lottoIds.push(lottoIds.length);

      const player4 = await grotto.connect(accounts[4]);
      await expect(
        player4.playLotto(lottoIds.length, overrides)
      ).to.be.revertedWith("Lotto is not started");
    } catch (error) {
      console.log(error);
      expect(error).to.equal(undefined);
    }
  });

  it("should find winner after end time has reached", async () => {
    try {
      const overrides = {
        value: ethers.utils.parseEther("0.01"),
      };

      // create lotto
      const _startTime = Math.floor(new Date().getTime() / 1000);
      const _endTime = Math.floor((new Date().getTime() + 8.64e7) / 1000); // + 24 hours
      await expect(
        grotto.createLotto(
          _startTime,
          _endTime,
          0,
          WinningType.TIME_BASED,
          overrides
        )
      ).to.emit(grotto, "LottoCreated");
      lottoIds.push(lottoIds.length);

      // player 1
      const player1 = await grotto.connect(accounts[1]);
      await expect(player1.playLotto(lottoIds.length, overrides)).to.emit(
        grotto,
        "BetPlaced"
      );

      // player 2
      const player2 = await grotto.connect(accounts[2]);
      await expect(player2.playLotto(lottoIds.length, overrides)).to.emit(
        grotto,
        "BetPlaced"
      );

      // player 3
      const player3 = await grotto.connect(accounts[3]);
      await expect(player3.playLotto(lottoIds.length, overrides)).to.emit(
        grotto,
        "BetPlaced"
      );

      await grotto.forceEnd(lottoIds.length);

      const player4 = await grotto.connect(accounts[4]);
      await expect(player4.playLotto(lottoIds.length, overrides)).to.emit(
        grotto,
        "BetPlaced"
      );

      let lotto = await lottoReader.getById(lottoIds.length);

      expect(lotto.winner).to.be.oneOf([
        accounts[1].address,
        accounts[2].address,
        accounts[3].address,
      ]);

      const totalStaked = ethers.utils
        .parseEther("0.009")
        .add(ethers.utils.parseEther("0.009"))
        .add(ethers.utils.parseEther("0.009"))
        .add(ethers.utils.parseEther("0.009"));
      const winnerShare = totalStaked.mul(80).div(100);
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
    const lotto = await lottoReader.getById(lottoIds.length);
    const winnerAddress = lotto.winner;
    const winnerAccountIndex = accounts
      .map((account, index) => (account.address === winnerAddress ? index : -1))
      .filter((index) => index >= 0);
    const balanceBefore = await ethers.provider.getBalance(winnerAddress);
    const winner = await grotto.connect(accounts[winnerAccountIndex[0]]);
    await expect(winner.claim(lottoIds.length)).to.emit(grotto, "Claimed");
    const balanceAfter = await ethers.provider.getBalance(winnerAddress);
    expect(+ethers.utils.formatEther(balanceBefore)).to.be.lessThan(
      +ethers.utils.formatEther(balanceAfter)
    );
  });

  it("should end a lotto by owner if time has passed", async () => {
    // create lotto
    const overrides = {
      value: ethers.utils.parseEther("0.01"),
    };

    // create lotto
    const player1 = await grotto.connect(accounts[1]);
    const _startTime = Math.floor(new Date().getTime() / 1000);
    const _endTime = Math.floor((new Date().getTime() + 8.64e7) / 1000); // + 24 hours
    await expect(
      player1.createLotto(
        _startTime,
        _endTime,
        0,
        WinningType.TIME_BASED,
        overrides
      )
    ).to.emit(grotto, "LottoCreated");
    lottoIds.push(lottoIds.length);

    // try to end, should get an error
    await expect(player1.endLotto(lottoIds.length)).to.be.revertedWith(
      "Lotto is not finished"
    );

    // lottoId should still be in lottoIds
    let lottos = await lottoReader.getAll();
    expect(lottos.map((l: BigNumber) => l.toNumber())).to.contain(
      lottoIds.length
    );

    let completed = await lottoReader.getCompleted();
    expect(completed.map((c: BigNumber) => c.toNumber())).to.not.contain(
      lottoIds.length
    );

    await grotto.forceEnd(lottoIds.length);
    // lottoIds should not be in lottoIds anymore

    try {
      await player1.endLotto(lottoIds.length);
    } catch (error) {
      console.log(error);
      expect(error).to.be.undefined;
    }

    lottos = await lottoReader.getAll();
    expect(lottos.map((l: BigNumber) => l.toNumber())).to.not.contain(
      lottoIds.length
    );

    completed = await lottoReader.getCompleted();
    expect(completed.map((c: BigNumber) => c.toNumber())).to.contain(
      lottoIds.length
    );
  });

  it("should end a lotto by player if time has passed", async () => {
    // create lotto
    let overrides = {
      value: ethers.utils.parseEther("0.01"),
    };

    // create lotto
    const player1 = await grotto.connect(accounts[1]);
    const _startTime = Math.floor(new Date().getTime() / 1000);
    const _endTime = Math.floor((new Date().getTime() + 8.64e7) / 1000); // + 24 hours
    await expect(
      player1.createLotto(
        _startTime,
        _endTime,
        0,
        WinningType.TIME_BASED,
        overrides
      )
    ).to.emit(grotto, "LottoCreated");
    lottoIds.push(lottoIds.length);

    // try to end, should get an error
    await expect(player1.endLotto(lottoIds.length)).to.be.revertedWith(
      "Lotto is not finished"
    );
    
    // lottoId should still be in lottoIds
    let lottos = await lottoReader.getAll();
    expect(lottos.map((l: BigNumber) => l.toNumber())).to.contain(
      lottoIds.length
    );

    let completed = await lottoReader.getCompleted();
    expect(completed.map((c: BigNumber) => c.toNumber())).to.not.contain(
      lottoIds.length
    );

    overrides = {
      value: ethers.utils.parseEther("0.02"),
    };

    const player2 = grotto.connect(accounts[2]);
    await player2.playLotto(lottoIds.length, overrides);

    await grotto.forceEnd(lottoIds.length);
    // lottoIds should not be in lottoIds anymore

    try {
      await player2.endLotto(lottoIds.length);
    } catch (error) {
      console.log(error);
      expect(error).to.be.undefined;
    }

    lottos = await lottoReader.getAll();
    expect(lottos.map((l: BigNumber) => l.toNumber())).to.not.contain(
      lottoIds.length
    );

    completed = await lottoReader.getCompleted();
    expect(completed.map((c: BigNumber) => c.toNumber())).to.contain(
      lottoIds.length
    );
  });  

  it("should get some stats", async () => {
    const lottosPaginated = await lottoReader.getPaginated(2, 5, address0, false);
    console.log("Paginated: ", lottosPaginated.length);
    const stats = await lottoReader.getStats();
    console.log(
      "Total Played: ",
      ethers.utils.formatEther(stats.totalPlayed.toString())
    );
    console.log("Total Players: ", stats.totalPlayers.toString());
    console.log("Total Games: ", stats.totalGames.toString());
    console.log("Total Lotto: ", stats.totalLotto.toString());
    console.log("Total Pot: ", stats.totalPot.toString());
    console.log(
      "Total SingleWinnerPot: ",
      stats.totalSingleWinnerPot.toString()
    );
    console.log("Total totalCreators: ", stats.totalCreators.toString());
    console.log(
      "Total Creator Shares: ",
      ethers.utils.formatEther(stats.totalCreatorShares.toString())
    );
    console.log(
      "Total Platform Shares: ",
      ethers.utils.formatEther(stats.totalPlatformShares.toString())
    );
    console.log(
      "Total Players Shares: ",
      ethers.utils.formatEther(stats.totalPlayerShares.toString())
    );
  });
});
