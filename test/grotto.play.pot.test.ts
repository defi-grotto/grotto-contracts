import { Contract } from "@ethersproject/contracts";
import { ethers, waffle } from "hardhat";
import chai from "chai";
import { expect } from "chai";
chai.use(waffle.solidity);
import { PotGuessType, PotType, WinningType } from "./models";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { BigNumber } from "ethers";

describe("Grotto: Play Pot Tests", () => {
    let accounts: SignerWithAddress[];
    const address0 = "0x0000000000000000000000000000000000000000";
    let grotto: Contract;
    let potReader: Contract;

    let potIds: Array<number> = [];

    const getBalances = async (player: string) => {
        const grottoBalance = ethers.utils.formatEther(
            await ethers.provider.getBalance(grotto.address),
        );

        const deployerBalance = ethers.utils.formatEther(
            await ethers.provider.getBalance(accounts[0].address),
        );

        const playerBalance = ethers.utils.formatEther(await ethers.provider.getBalance(player));

        return { grottoBalance, deployerBalance, playerBalance };
    };

    const checkBalances = async (
        player: string,
        grottoBalanceBefore: string,
        deployerBalanceBefore: string,
        playerBalanceBefore: string,
        amount: string,
        shouldBeEqual = false,
        isCreateCall = false,
    ) => {
        if (shouldBeEqual) {
            // return;
        } else {
            const { grottoBalance, deployerBalance, playerBalance } = await getBalances(player);

            let deployerPercentage = +amount * 0.1;
            let grottoPercentage = +amount * 0.9;

            // if (isCreateCall) {
            //     deployerPercentage = +amount * 0.09;
            //     grottoPercentage = +amount - deployerPercentage;
            // }

            expect((+grottoBalance).toFixed(4)).to.eq(
                (+grottoBalanceBefore + grottoPercentage).toFixed(4),
            );
            expect((+deployerBalance).toFixed(4)).to.eq(
                (+deployerBalanceBefore + deployerPercentage).toFixed(4),
            );
            expect(Math.round(+playerBalance)).to.eq(Math.round(+playerBalanceBefore - +amount));
        }
    };

    const betAmount = "10";
    const potAmount = "100";

    before(async () => {
        accounts = await ethers.getSigners();

        console.log("Creating Contracts: ", accounts[0].address);

        const Storage = await ethers.getContractFactory("Storage");
        const Grotto = await ethers.getContractFactory("Grotto");
        const PotReader = await ethers.getContractFactory("PotReader");
        const LottoController = await ethers.getContractFactory("LottoController");
        const PotController = await ethers.getContractFactory("PotController");
        const SingleWinnerPotController = await ethers.getContractFactory(
            "SingleWinnerPotController",
        );

        const storageController = await Storage.deploy();
        await storageController.deployed();

        const controller = await PotController.deploy(storageController.address);
        controller.deployed();

        const lottoController = await LottoController.deploy(storageController.address);
        lottoController.deployed();

        const swPotController = await SingleWinnerPotController.deploy(storageController.address);
        swPotController.deployed();

        grotto = await Grotto.deploy(
            lottoController.address,
            controller.address,
            swPotController.address,
            storageController.address,
        );

        potReader = await PotReader.deploy(
            controller.address,
            swPotController.address,
            storageController.address,
        );

        await controller.grantLottoCreator(grotto.address);
        await controller.grantLottoPlayer(grotto.address);
        await controller.grantAdmin(grotto.address);

        await storageController.grantAdminRole(lottoController.address);
        await storageController.grantAdminRole(controller.address);
        await storageController.grantAdminRole(swPotController.address);
        await storageController.grantAdminRole(grotto.address);

        console.log(`PotController Deployed to ${controller.address}`);

        expect(controller.address).to.not.eq(address0);

        console.log(`Grotto Deployed to ${grotto.address}`);

        potIds = [];
    });

    const playToWin = async (): Promise<number> => {
        let balance = await getBalances(accounts[10].address);
        let overrides = {
            value: ethers.utils.parseEther(potAmount),
        };

        let potSize = 0;

        const player0 = await grotto.connect(accounts[10]);
        await expect(
            player0.createPot(
                0,
                0,
                5,
                ethers.utils.parseEther(betAmount),
                WinningType.NUMBER_OF_PLAYERS,
                [3, 6, 9, 3],
                PotGuessType.ORDER,
                PotType.MULTIPLE_WINNER,
                overrides,
            ),
        ).to.emit(grotto, "PotCreated");
        potSize += +potAmount;
        potIds.push(potIds.length);
        const potId = potIds.length;
        checkBalances(
            accounts[10].address,
            balance.grottoBalance,
            balance.deployerBalance,
            balance.playerBalance,
            potAmount,
            false,
            true,
        );

        // // Numbers matched but not order
        balance = await getBalances(accounts[4].address);
        overrides = {
            value: ethers.utils.parseEther(betAmount),
        };
        let guesses = [3, 6, 3, 9];
        const player4 = await grotto.connect(accounts[4]);
        await expect(player4.playPot(potId, guesses, overrides)).to.emit(grotto, "BetPlaced");
        potSize += +betAmount;
        checkBalances(
            accounts[4].address,
            balance.grottoBalance,
            balance.deployerBalance,
            balance.playerBalance,
            betAmount,
        );

        // // Numbers matched and is in the correct order
        balance = await getBalances(accounts[3].address);
        guesses = [3, 6, 9, 3];
        const player3 = await grotto.connect(accounts[3]);
        await expect(player3.playPot(potId, guesses, overrides)).to.emit(grotto, "BetPlaced");
        potSize += +betAmount;
        checkBalances(
            accounts[3].address,
            balance.grottoBalance,
            balance.deployerBalance,
            balance.playerBalance,
            betAmount,
        );

        balance = await getBalances(accounts[5].address);
        guesses = [3, 6, 9, 3];
        const player5 = await grotto.connect(accounts[5]);
        await expect(player5.playPot(potId, guesses, overrides)).to.emit(grotto, "BetPlaced");
        potSize += +betAmount;
        checkBalances(
            accounts[5].address,
            balance.grottoBalance,
            balance.deployerBalance,
            balance.playerBalance,
            betAmount,
        );

        // // Number not matched
        balance = await getBalances(accounts[6].address);
        guesses = [1, 2, 4, 6];
        const player6 = await grotto.connect(accounts[6]);
        await expect(player6.playPot(potId, guesses, overrides)).to.emit(grotto, "BetPlaced");
        potSize += +betAmount;
        checkBalances(
            accounts[6].address,
            balance.grottoBalance,
            balance.deployerBalance,
            balance.playerBalance,
            betAmount,
        );

        // // Numbers not matched
        balance = await getBalances(accounts[7].address);
        guesses = [1, 3, 3, 7];
        const player7 = await grotto.connect(accounts[7]);
        await expect(player7.playPot(potId, guesses, overrides)).to.emit(grotto, "BetPlaced");
        potSize += +betAmount;
        checkBalances(
            accounts[7].address,
            balance.grottoBalance,
            balance.deployerBalance,
            balance.playerBalance,
            betAmount,
        );

        const pots = await potReader.getAll(false);
        expect(pots.map((l: BigNumber) => l.toNumber())).to.not.contain(potId);

        const completed = await potReader.getCompleted(false);
        expect(completed.map((c: BigNumber) => c.toNumber())).to.contain(potId);

        const pot = await potReader.getById(potId);
        expect(+ethers.utils.formatEther(pot.lotto.stakes)).to.eq(potSize * 0.9);

        return potId;
    };

    const validateWinners = async (potId: number) => {
        const potWinnersIndex = [3, 5];

        for (const index of potWinnersIndex) {
            const player = await grotto.connect(accounts[index]);
            const address = accounts[index].address;

            const balanceBefore = await ethers.provider.getBalance(address);

            const playerWinnings = await potReader.getPlayerWinnings(potId, address);
            const winningFormatted = +ethers.utils.formatEther(playerWinnings.winning);

            await expect(player.claim(potId)).to.emit(player, "Claimed");
            const balanceAfter = await ethers.provider.getBalance(address);
            let pot = await potReader.getById(potId);
            expect(pot.lotto.creator).to.equal(accounts[10].address);
            const totalStaked = pot.lotto.stakes;
            const winners = pot.winners;
            const winnerShare = totalStaked.mul(80).div(100).div(winners.length);

            expect(+ethers.utils.formatEther(winnerShare)).to.equal(winningFormatted);

            expect(+ethers.utils.formatEther(balanceBefore)).to.be.lessThan(
                +ethers.utils.formatEther(balanceAfter),
            );
            expect(+ethers.utils.formatEther(balanceBefore.add(winnerShare))).to.greaterThanOrEqual(
                +ethers.utils.formatEther(balanceAfter),
            );
            const creatorShares = totalStaked.mul(20).div(100);
            expect(ethers.utils.formatEther(creatorShares.toString())).to.equal(
                ethers.utils.formatEther(pot.lotto.creatorShares),
            );
        }
    };

    it("should create grotto contract", async () => {
        expect(grotto.address).to.not.eq(address0);
    });

    it("should create a number of player pot winning type", async () => {
        try {
            const { grottoBalance, deployerBalance, playerBalance } = await getBalances(
                accounts[1].address,
            );

            const player1 = await grotto.connect(accounts[1]);

            const overrides = {
                value: ethers.utils.parseEther(potAmount),
            };

            await expect(
                player1.createPot(
                    0,
                    0,
                    10,
                    ethers.utils.parseEther(betAmount),
                    WinningType.NUMBER_OF_PLAYERS,
                    [3, 6, 9, 3],
                    PotGuessType.ORDER,
                    PotType.MULTIPLE_WINNER,
                    overrides,
                ),
            ).to.emit(grotto, "PotCreated");
            potIds.push(1);
            checkBalances(
                accounts[1].address,
                grottoBalance,
                deployerBalance,
                playerBalance,
                potAmount,
                false,
                true,
            );
        } catch (error) {
            console.log(error);
            expect(error).to.equal(undefined);
        }
    });

    it("should play number of players pot", async () => {
        try {
            const { grottoBalance, deployerBalance, playerBalance } = await getBalances(
                accounts[2].address,
            );

            const player2 = await grotto.connect(accounts[2]);

            const overrides = {
                value: ethers.utils.parseEther(betAmount),
            };

            const guesses = [3, 6, 9, 1];

            await expect(player2.playPot(potIds.length, guesses, overrides)).to.emit(
                grotto,
                "BetPlaced",
            );

            checkBalances(
                accounts[2].address,
                grottoBalance,
                deployerBalance,
                playerBalance,
                betAmount,
            );
        } catch (error) {
            console.log(error);
            expect(error).to.equal(undefined);
        }
    });

    it("should not play pot by creator", async () => {
        try {
            const player1 = await grotto.connect(accounts[1]);
            const overrides = {
                value: ethers.utils.parseEther("11"),
            };
            const guesses = [3, 6, 9, 1];
            await expect(player1.playPot(potIds.length, guesses, overrides)).to.be.revertedWith(
                "Creator can not play",
            );
        } catch (error) {
            console.log(error);
            expect(error).to.equal(undefined);
        }
    });

    it("should not play pot with non-existent lotto id", async () => {
        try {
            const overrides = {
                value: ethers.utils.parseEther("10"),
            };
            const guesses = [3, 6, 9, 1];
            const player1 = await grotto.connect(accounts[1]);
            await expect(
                player1.playPot(potIds.length + 1001, guesses, overrides),
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
            await expect(player1.playPot(potIds.length, guesses, overrides)).to.be.revertedWith(
                "BetPlaced is too low",
            );
        } catch (error) {
            console.log(error);
            expect(error).to.equal(undefined);
        }
    });

    it("should not claim winnings before pot is finished", async () => {
        await expect(grotto.claim(potIds.length)).to.be.revertedWith("Lotto is not finished");
    });

    it("should not find a winner if numbers matched but not in order", async () => {
        try {
            const overrides = {
                value: ethers.utils.parseEther("10"),
            };
            const betAmount = ethers.utils.parseEther("10");
            const _startTime = Math.floor(new Date().getTime() / 1000);
            const _endTime = Math.floor((new Date().getTime() + 8.64e7) / 1000); // + 24 hours

            await expect(
                grotto.createPot(
                    _startTime,
                    _endTime,
                    0,
                    betAmount,
                    WinningType.TIME_BASED,
                    [3, 6, 9, 3],
                    PotGuessType.ORDER,
                    PotType.MULTIPLE_WINNER,
                    overrides,
                ),
            ).to.emit(grotto, "PotCreated");
            potIds.push(potIds.length);

            // Numbers matched but not order
            let guesses = [3, 6, 3, 9];
            const player2 = await grotto.connect(accounts[3]);
            await expect(player2.playPot(potIds.length, guesses, overrides)).to.emit(
                grotto,
                "BetPlaced",
            );

            // Numbers matched but not order, should allow a bet to be placed
            guesses = [3, 6, 3, 9];
            const player3 = await grotto.connect(accounts[4]);
            await expect(player3.playPot(potIds.length, guesses, overrides)).to.emit(
                grotto,
                "BetPlaced",
            );

            await grotto.forceEnd(potIds.length);

            await expect(player2.claim(potIds.length)).to.be.revertedWith(
                "Claimer is not a winner",
            );
        } catch (error) {
            console.log(error);
            expect(error).to.equal(undefined);
        }
    });

    it("should find winner(s) if number is matched and is in order", async () => {
        try {
            const potId = await playToWin();
            await validateWinners(potId);
        } catch (error) {
            console.log(error);
            expect(error).to.equal(undefined);
        }
    });

    it("should claim by creator", async () => {
        try {
            const potId = await playToWin();
            const balanceBefore = await ethers.provider.getBalance(accounts[10].address);
            await validateWinners(potId);
            const creatorWinnings = await potReader.getCreatorWinnings(potId);
            const formatted = +ethers.utils.formatEther(creatorWinnings.winning);
            await grotto.claimCreator(potId);
            const balanceAfter = await ethers.provider.getBalance(accounts[10].address);
            expect(+ethers.utils.formatEther(balanceBefore) + formatted).to.be.eq(
                +ethers.utils.formatEther(balanceAfter),
            );
        } catch (error) {
            console.log(error);
            expect(error).to.equal(undefined);
        }
    });

    it("should send everything to creator if no winner found", async () => {
        try {
            const overrides = {
                value: ethers.utils.parseEther("10"),
            };
            const betAmount = ethers.utils.parseEther("10");
            const _startTime = Math.floor(new Date().getTime() / 1000);
            const _endTime = Math.floor((new Date().getTime() + 8.64e7) / 1000); // + 24 hours
            await expect(
                grotto.createPot(
                    _startTime,
                    _endTime,
                    0,
                    betAmount,
                    WinningType.TIME_BASED,
                    [3, 6, 9, 3],
                    PotGuessType.ORDER,
                    PotType.MULTIPLE_WINNER,
                    overrides,
                ),
            ).to.emit(grotto, "PotCreated");
            potIds.push(potIds.length);

            // Numbers matched but not order
            let guesses = [3, 6, 3, 9];
            const player3 = await grotto.connect(accounts[4]);
            await expect(player3.playPot(potIds.length, guesses, overrides)).to.emit(
                grotto,
                "BetPlaced",
            );

            // Numbers matched but not order
            guesses = [3, 6, 3, 9];
            const player2 = await grotto.connect(accounts[3]);
            await expect(player2.playPot(potIds.length, guesses, overrides)).to.emit(
                grotto,
                "BetPlaced",
            );

            // Numbers matched but not order
            guesses = [3, 6, 3, 9];
            const player4 = await grotto.connect(accounts[5]);
            await expect(player4.playPot(potIds.length, guesses, overrides)).to.emit(
                grotto,
                "BetPlaced",
            );

            await grotto.forceEnd(potIds.length);

            let pot = await potReader.getById(potIds.length);

            expect(pot.lotto.creator).to.equal(accounts[0].address);

            const balanceBefore = await ethers.provider.getBalance(accounts[0].address);
            await grotto.claimCreator(potIds.length);

            const balanceAfter = await ethers.provider.getBalance(accounts[0].address);
            expect(+ethers.utils.formatEther(balanceBefore)).to.be.lessThan(
                +ethers.utils.formatEther(balanceAfter),
            );
        } catch (error) {
            console.log(error);
            expect(error).to.equal(undefined);
        }
    });

    it("should get some stats", async () => {
        const lottosPaginated = await potReader.getPaginated(1, 10, address0, false, false);
        console.log("Paginated: ", lottosPaginated.length);
        const stats = await potReader.getStats();
        console.log("Total Played: ", ethers.utils.formatEther(stats.totalPlayed.toString()));
        console.log("Total Players: ", stats.totalPlayers.toString());
        console.log("Total Games: ", stats.totalGames.toString());
        console.log("Total Lotto: ", stats.totalLotto.toString());
        console.log("Total Pot: ", stats.totalPot.toString());
        console.log("Total SingleWinnerPot: ", stats.totalSingleWinnerPot.toString());
        console.log("Total totalCreators: ", stats.totalCreators.toString());
        console.log(
            "Total Creator Shares: ",
            ethers.utils.formatEther(stats.totalCreatorShares.toString()),
        );
        console.log(
            "Total Platform Shares: ",
            ethers.utils.formatEther(stats.totalPlatformShares.toString()),
        );
        console.log(
            "Total Players Shares: ",
            ethers.utils.formatEther(stats.totalPlayerShares.toString()),
        );
    });
});
