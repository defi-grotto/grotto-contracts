import { Contract } from "@ethersproject/contracts";
import { ethers, waffle, upgrades } from "hardhat";
import chai from "chai";
import { expect } from "chai";
chai.use(waffle.solidity);
import { Lotto, Pot, PotGuessType, WinningType } from "./models";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { BigNumber } from "@ethersproject/bignumber";

describe.only("Grotto: Play Pot Tests", () => {
  let accounts: SignerWithAddress[];
  const address0 = "0x0000000000000000000000000000000000000000";
  let grotto: Contract;
  let nopLotto: Lotto;
  let tbLotto: Lotto;

  let tbPot: Pot;

  const playToWin = async () => {
    const overrides = {
      value: ethers.utils.parseEther("0.01"),
    };

    tbPot.lotto.id = tbPot.lotto.id + 1001;
    await expect(grotto.createPot(tbPot, overrides)).to.emit(
      grotto,
      "PotCreated"
    );

    // Numbers matched but not order
    let guesses = [3, 6, 3, 9];
    const player3 = await grotto.connect(accounts[4]);
    await expect(player3.playPot(tbPot.lotto.id, guesses, overrides)).to.emit(
      grotto,
      "BetPlaced"
    );

    // Numbers matched and is in the correct order
    guesses = [3, 6, 9, 3];
    const player2 = await grotto.connect(accounts[3]);
    await expect(player2.playPot(tbPot.lotto.id, guesses, overrides)).to.emit(
      grotto,
      "BetPlaced"
    );

    guesses = [3, 6, 9, 3];
    const player5 = await grotto.connect(accounts[5]);
    await expect(player5.playPot(tbPot.lotto.id, guesses, overrides)).to.emit(
      grotto,
      "BetPlaced"
    );

    guesses = [3, 6, 9, 3];
    const player6 = await grotto.connect(accounts[6]);
    await expect(player6.playPot(tbPot.lotto.id, guesses, overrides)).to.emit(
      grotto,
      "BetPlaced"
    );

    guesses = [3, 6, 9, 3];
    const player7 = await grotto.connect(accounts[7]);
    await expect(player7.playPot(tbPot.lotto.id, guesses, overrides)).to.emit(
      grotto,
      "BetPlaced"
    );

    await grotto.forceEnd(tbPot.lotto.id);
  };

  const validateWinners = async () => {
    const potWinnersIndex = [3, 5, 6, 7];

    for (const index of potWinnersIndex) {
      const player = await grotto.connect(accounts[index]);
      const address = accounts[index].address;
      const balanceBefore = await ethers.provider.getBalance(address);
      await player.claim(tbPot.lotto.id);
      const balanceAfter = await ethers.provider.getBalance(address);
      let pot: Pot = await grotto.getPotById(tbPot.lotto.id);
      expect(pot.lotto.creator).to.equal(accounts[0].address);
      const totalStaked = await grotto.getTotalStaked(pot.lotto.id);
      const winners = pot.winners;
      const winnerShare = totalStaked.mul(70).div(100).div(winners.length);
      expect(+ethers.utils.formatEther(balanceBefore)).to.be.lessThan(
        +ethers.utils.formatEther(balanceAfter)
      );
      expect(
        +ethers.utils.formatEther(balanceBefore.add(winnerShare))
      ).to.greaterThanOrEqual(+ethers.utils.formatEther(balanceAfter));
      const creatorShares = totalStaked.mul(20).div(100);
      expect(ethers.utils.formatEther(creatorShares.toString())).to.equal(
        ethers.utils.formatEther(pot.lotto.creatorShares)
      );
    }
  };

  before(async () => {
    accounts = await ethers.getSigners();
    tbLotto = {
      id: 100,
      creator: accounts[1].address,
      creatorShares: BigNumber.from(0),
      startTime: Math.floor(new Date().getTime() / 1000),
      endTime: Math.floor((new Date().getTime() + 8.64e7) / 1000), // + 24 hours
      betAmount: BigNumber.from(0),
      maxNumberOfPlayers: 0,
      winningType: WinningType.TIME_BASED,
      isFinished: false,
      players: [],
      stakes: BigNumber.from(0),
      winner: address0,
      winning: 0,
    };

    tbPot = {
      lotto: tbLotto,
      potAmount: BigNumber.from(0),
      potGuessType: PotGuessType.ORDER,
      winningNumbers: [3, 6, 9, 3],
      winners: [],
      winningsPerWinner: 0,
    };

    const Grotto = await ethers.getContractFactory("Grotto");
    const PotController = await ethers.getContractFactory("PotController");
    const controller = await upgrades.deployProxy(PotController);

    grotto = await upgrades.deployProxy(Grotto, [address0, controller.address]);

    await controller.grantLottoCreator(grotto.address);
    await controller.grantLottoPlayer(grotto.address);
    await controller.grantAdmin(grotto.address);

    console.log(`PotController Deployed to ${controller.address}`);

    expect(controller.address).to.not.eq(address0);

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

      tbPot.lotto.betAmount = ethers.utils.parseEther("0.01");
      await expect(grotto.createPot(tbPot, overrides)).to.emit(
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
      await expect(player1.playPot(tbPot.lotto.id, guesses, overrides)).to.emit(
        grotto,
        "BetPlaced"
      );
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
      await expect(
        grotto.playPot(tbPot.lotto.id, guesses, overrides)
      ).to.be.revertedWith("Creator can not play");
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
      await expect(
        player1.playPot(tbPot.lotto.id + 1001, guesses, overrides)
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
        player1.playPot(tbPot.lotto.id, guesses, overrides)
      ).to.be.revertedWith("BetPlaced is too low");
    } catch (error) {
      console.log(error);
      expect(error).to.equal(undefined);
    }
  });

  it("should not claim winnings before pot is finished", async () => {
    await expect(grotto.claim(tbPot.lotto.id)).to.be.revertedWith(
      "Lotto is not finished"
    );
  });

  it("should not find a winner if numbers matched but not in order", async () => {
    try {
      const overrides = {
        value: ethers.utils.parseEther("0.01"),
      };

      tbPot.lotto.id = tbPot.lotto.id + 1001;
      await expect(grotto.createPot(tbPot, overrides)).to.emit(
        grotto,
        "PotCreated"
      );

      // Numbers matched but not order
      let guesses = [3, 6, 3, 9];
      const player2 = await grotto.connect(accounts[3]);
      await expect(player2.playPot(tbPot.lotto.id, guesses, overrides)).to.emit(
        grotto,
        "BetPlaced"
      );

      // Numbers matched but not order, should allow a bet to be placed
      guesses = [3, 6, 3, 9];
      const player3 = await grotto.connect(accounts[4]);
      await expect(player3.playPot(tbPot.lotto.id, guesses, overrides)).to.emit(
        grotto,
        "BetPlaced"
      );

      await grotto.forceEnd(tbPot.lotto.id);

      await expect(player2.claim(tbPot.lotto.id)).to.be.revertedWith(
        "Claimer is not a winner"
      );
    } catch (error) {
      console.log(error);
      expect(error).to.equal(undefined);
    }
  });

  it("should find winner(s) if number is matched and is in order", async () => {
    try {
      await playToWin();
      await validateWinners();
    } catch (error) {
      console.log(error);
      expect(error).to.equal(undefined);
    }
  });

  it("should not claim winnings twice", async () => {
    const player2 = await grotto.connect(accounts[3]);
    await expect(player2.claim(tbPot.lotto.id)).to.be.revertedWith(
      "Pot is already Claimed"
    );
  });

  it("should claim by creator", async () => {
    try {
      await playToWin();
      await expect(grotto.claimCreator(tbPot.lotto.id)).to.be.revertedWith(
        "Creator can't claim until at least one winner claimed"
      );
      await validateWinners();
      await grotto.claimCreator(tbPot.lotto.id);
    } catch (error) {
      console.log(error);
      expect(error).to.equal(undefined);
    }
  });

  // it('should send everything to creator if no winner found', async () => {
  //   try {
  //     const overrides = {
  //       value: ethers.utils.parseEther("0.01"),
  //     };

  //     nopPot.lotto.id = nopPot.lotto.id + 1001;
  //     await expect(grotto.createPot(nopPot, overrides)).to.emit(
  //       grotto,
  //       "PotCreated"
  //     );

  //     // Numbers matched but not order
  //     let guesses = [3, 6, 3, 9];
  //     const player3 = await grotto.connect(accounts[4]);
  //     await expect(
  //       player3.playPot(nopPot.lotto.id, guesses, overrides)
  //     ).to.emit(grotto, "BetPlaced");

  //     // Numbers matched but not order
  //     guesses = [3, 6, 3, 9];
  //     const player2 = await grotto.connect(accounts[3]);
  //     await expect(
  //       player2.playPot(nopPot.lotto.id, guesses, overrides)
  //     ).to.emit(grotto, "BetPlaced");

  //     // Numbers matched but not order
  //     guesses = [3, 6, 3, 9];
  //     const player4 = await grotto.connect(accounts[5]);
  //     await expect(
  //       player4.playPot(nopPot.lotto.id, guesses, overrides)
  //     ).to.emit(grotto, "BetPlaced");

  //     let pot: Pot = await grotto.getPotById(nopPot.lotto.id);

  //     expect(pot.lotto.creator).to.equal(accounts[0].address);
  //     expect(pot.lotto.winner).to.equal(address0);

  //     const totalStaked = ethers.utils
  //       .parseEther("0.01")
  //       .add(ethers.utils.parseEther("0.01"))
  //       .add(ethers.utils.parseEther("0.01"))
  //       .add(ethers.utils.parseEther("0.01"));

  //     const creatorShares = totalStaked.mul(90).div(100);
  //     expect(ethers.utils.formatEther(creatorShares.toString())).to.equal(
  //       ethers.utils.formatEther(pot.lotto.creatorShares)
  //     );

  //     const balanceBefore = await ethers.provider.getBalance(accounts[0].address);
  //     await expect(grotto.claim(nopLotto.id)).to.emit(grotto, "Claimed");
  //     const balanceAfter = await ethers.provider.getBalance(accounts[0].address);
  //     expect(+ethers.utils.formatEther(balanceBefore)).to.be.lessThan(+ethers.utils.formatEther(balanceAfter));

  //   } catch (error) {
  //     console.log(error);
  //     expect(error).to.equal(undefined);
  //   }
  // });
});
