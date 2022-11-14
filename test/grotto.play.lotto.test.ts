import { Contract } from "@ethersproject/contracts";
import { ethers, waffle } from "hardhat";
import { expect } from "chai";
import { WinningType } from "./models";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { BigNumber } from "ethers";
import { CREATOR_PERCENTAGE, getPercentage, LOTTO_BETS, PLATFORM_PERCENTAGE } from "./constants";

describe.only("Grotto: Play Lotto Tests", () => {
    let accounts: SignerWithAddress[];
    const address0 = "0x0000000000000000000000000000000000000000";
    let grotto: Contract;
    let lottoReader: Contract;

    const lottoIds: Array<number> = [];

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
        shouldBeEqual = false,
        isCreateCall = false,
    ) => {
        if (shouldBeEqual) {
            // return;
        } else {
            const { grottoBalance, deployerBalance, playerBalance } = await getBalances(player);

            let platformPercentage = getPercentage(LOTTO_BETS[1], PLATFORM_PERCENTAGE);
            let grottoPercentage = LOTTO_BETS[1] - platformPercentage;

            expect((+grottoBalance).toFixed(4)).to.eq(
                (+grottoBalanceBefore + grottoPercentage).toFixed(4),
            );
            expect((+deployerBalance).toFixed(4)).to.eq(
                (+deployerBalanceBefore + platformPercentage).toFixed(4),
            );
            expect(Math.round(+playerBalance)).to.eq(
                Math.round(+playerBalanceBefore - LOTTO_BETS[1]),
            );
        }
    };

    before(async () => {
        accounts = await ethers.getSigners();

        const Storage = await ethers.getContractFactory("Storage");
        const PotController = await ethers.getContractFactory("PotController");
        const SingleWinnerPotController = await ethers.getContractFactory(
            "SingleWinnerPotController",
        );

        const storageController = await Storage.deploy();
        await storageController.deployed();
        const potController = await PotController.deploy(storageController.address);
        const swPotController = await SingleWinnerPotController.deploy(storageController.address);

        const Grotto = await ethers.getContractFactory("Grotto");
        const LottoReader = await ethers.getContractFactory("LottoReader");
        const LottoController = await ethers.getContractFactory("LottoController");
        const controller = await LottoController.deploy(storageController.address);

        grotto = await Grotto.deploy(
            controller.address,
            potController.address,
            swPotController.address,
            storageController.address,
        );

        lottoReader = await LottoReader.deploy(controller.address, storageController.address);

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
        const { grottoBalance, deployerBalance, playerBalance } = await getBalances(
            accounts[10].address,
        );
        const player0 = await grotto.connect(accounts[10]);

        try {
            const overrides = {
                value: ethers.utils.parseEther(LOTTO_BETS[1] + ""),
            };

            await expect(
                player0.createLotto(0, 0, 3, WinningType.NUMBER_OF_PLAYERS, overrides),
            ).to.emit(grotto, "LottoCreated");
            lottoIds.push(lottoIds.length);

            checkBalances(
                accounts[10].address,
                grottoBalance,
                deployerBalance,
                playerBalance,
                false,
                true,
            );
        } catch (error) {
            console.log(error);
            expect(error).to.equal(undefined);
        }
    });

    it("should play number of players lotto", async () => {
        try {
            const { grottoBalance, deployerBalance, playerBalance } = await getBalances(
                accounts[1].address,
            );

            const overrides = {
                value: ethers.utils.parseEther(LOTTO_BETS[1] + ""),
            };
            const player1 = await grotto.connect(accounts[1]);
            await expect(player1.playLotto(lottoIds.length, overrides)).to.emit(
                grotto,
                "BetPlaced",
            );

            checkBalances(accounts[1].address, grottoBalance, deployerBalance, playerBalance);
        } catch (error) {
            console.log(error);
            expect(error).to.equal(undefined);
        }
    });

    it("should not play lotto by creator", async () => {
        try {
            const player0 = await grotto.connect(accounts[10]);

            const { grottoBalance, deployerBalance, playerBalance } = await getBalances(
                accounts[10].address,
            );
            const overrides = {
                value: ethers.utils.parseEther(LOTTO_BETS[1] + ""),
            };
            await expect(player0.playLotto(lottoIds.length, overrides)).to.be.revertedWith(
                "Creator can not play",
            );

            checkBalances(
                accounts[10].address,
                grottoBalance,
                deployerBalance,
                playerBalance,
                true,
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
            await expect(player1.playLotto(1001, overrides)).to.be.revertedWith(
                "Lotto does not exist",
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
            await expect(player1.playLotto(lottoIds.length, overrides)).to.be.revertedWith(
                "BetPlaced is too low",
            );
        } catch (error) {
            console.log(error);
            expect(error).to.equal(undefined);
        }
    });

    it("should not claim winnings before lotto is finished", async () => {
        await expect(grotto.claim(lottoIds.length)).to.be.revertedWith("Lotto is not finished");
    });

    it("should not play lotto if max number of players reached", async () => {
        try {
            const overrides = {
                value: ethers.utils.parseEther(LOTTO_BETS[1] + ""),
            };
            const player2 = await grotto.connect(accounts[2]);
            await expect(player2.playLotto(lottoIds.length, overrides)).to.emit(
                grotto,
                "BetPlaced",
            );

            const player3 = await grotto.connect(accounts[3]);
            await expect(player3.playLotto(lottoIds.length, overrides)).to.emit(
                grotto,
                "BetPlaced",
            );

            const lottos = await lottoReader.getAll();
            expect(lottos.map((l: BigNumber) => l.toNumber())).to.not.contain(lottoIds.length);

            const completed = await lottoReader.getCompleted();
            expect(completed.map((c: BigNumber) => c.toNumber())).to.contain(lottoIds.length);

            const player4 = await grotto.connect(accounts[4]);
            await expect(player4.playLotto(lottoIds.length, overrides)).to.be.revertedWith(
                "Lotto is finished",
            );
        } catch (error) {
            console.log(error);
            expect(error).to.equal(undefined);
        }
    });

    it("should find winner after max number of players reached", async () => {
        try {
            const overrides = {
                value: ethers.utils.parseEther(LOTTO_BETS[1] + ""),
            };

            // create lotto
            await expect(
                grotto.createLotto(0, 0, 3, WinningType.NUMBER_OF_PLAYERS, overrides),
            ).to.emit(grotto, "LottoCreated");
            lottoIds.push(lottoIds.length);

            // player 1
            const player1 = await grotto.connect(accounts[1]);
            await expect(player1.playLotto(lottoIds.length, overrides)).to.emit(
                grotto,
                "BetPlaced",
            );

            // player 2
            const player2 = await grotto.connect(accounts[2]);
            await expect(player2.playLotto(lottoIds.length, overrides)).to.emit(
                grotto,
                "BetPlaced",
            );

            // player 3
            const player3 = await grotto.connect(accounts[3]);
            await expect(player3.playLotto(lottoIds.length, overrides)).to.emit(
                grotto,
                "BetPlaced",
            );
            const lotto = await lottoReader.getById(lottoIds.length);
            expect(lotto.winner).to.be.oneOf([
                accounts[1].address,
                accounts[2].address,
                accounts[3].address,
            ]);

            const totalBetAmounts = LOTTO_BETS[1] * 4;
            const minusPlatformPercentages = ethers.utils.parseEther(
                totalBetAmounts - getPercentage(totalBetAmounts, PLATFORM_PERCENTAGE) + "",
            );

            const winnerShare = minusPlatformPercentages.mul(100 - CREATOR_PERCENTAGE).div(100);
            expect(ethers.utils.formatEther(winnerShare.toString())).to.equal(
                ethers.utils.formatEther(lotto.winning),
            );

            const creatorShares = minusPlatformPercentages.mul(20).div(100);
            expect(ethers.utils.formatEther(creatorShares.toString())).to.equal(
                ethers.utils.formatEther(lotto.creatorShares),
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

        const playerWinnings = await lottoReader.getPlayerWinnings(lottoIds.length, winnerAddress);
        const winningsFormatted = +ethers.utils.formatEther(playerWinnings.winning);

        await expect(winner.claim(lottoIds.length)).to.emit(grotto, "Claimed");
        const balanceAfter = await ethers.provider.getBalance(winnerAddress);

        expect((+ethers.utils.formatEther(balanceBefore) + winningsFormatted).toFixed(2)).to.be.eq(
            (+ethers.utils.formatEther(balanceAfter)).toFixed(2),
        );
    });

    it("should claim winnings by creator", async () => {
        try {
            const overrides = {
                value: ethers.utils.parseEther(LOTTO_BETS[1] + ""),
            };

            // create lotto
            await expect(
                grotto.createLotto(0, 0, 3, WinningType.NUMBER_OF_PLAYERS, overrides),
            ).to.emit(grotto, "LottoCreated");
            lottoIds.push(lottoIds.length);

            // player 1
            const player1 = await grotto.connect(accounts[1]);
            await expect(player1.playLotto(lottoIds.length, overrides)).to.emit(
                grotto,
                "BetPlaced",
            );

            // player 2
            const player2 = await grotto.connect(accounts[2]);
            await expect(player2.playLotto(lottoIds.length, overrides)).to.emit(
                grotto,
                "BetPlaced",
            );

            // player 3
            const player3 = await grotto.connect(accounts[3]);
            await expect(player3.playLotto(lottoIds.length, overrides)).to.emit(
                grotto,
                "BetPlaced",
            );
            const lotto = await lottoReader.getById(lottoIds.length);
            expect(lotto.winner).to.be.oneOf([
                accounts[1].address,
                accounts[2].address,
                accounts[3].address,
            ]);

            const totalBetAmounts = LOTTO_BETS[1] * 4;
            const minusPlatformPercentages = ethers.utils.parseEther(
                totalBetAmounts - getPercentage(totalBetAmounts, PLATFORM_PERCENTAGE) + "",
            );


            const creatorShares = minusPlatformPercentages.mul(CREATOR_PERCENTAGE).div(100);
            const winnerShare = minusPlatformPercentages.sub(creatorShares);

            expect(ethers.utils.formatEther(winnerShare.toString())).to.equal(
                ethers.utils.formatEther(lotto.winning),
            );
            expect(ethers.utils.formatEther(creatorShares.toString())).to.equal(
                ethers.utils.formatEther(lotto.creatorShares),
            );

            // claim by user first
            const winnerAddress = lotto.winner;
            const winnerAccountIndex = accounts
                .map((account, index) => (account.address === winnerAddress ? index : -1))
                .filter((index) => index >= 0);
            const winner = await grotto.connect(accounts[winnerAccountIndex[0]]);
            await expect(winner.claim(lottoIds.length)).to.emit(grotto, "Claimed");

            const creatorWinnings = await lottoReader.getCreatorWinnings(lottoIds.length);
            const winningsFormatted = +ethers.utils.formatEther(creatorWinnings.winning);

            const balanceBefore = await ethers.provider.getBalance(accounts[0].address);
            await expect(grotto.claimCreator(lottoIds.length)).to.emit(grotto, "CreatorClaimed");
            const balanceAfter = await ethers.provider.getBalance(accounts[0].address);
            expect(
                (+ethers.utils.formatEther(balanceBefore) + winningsFormatted).toFixed(2),
            ).to.be.eq((+ethers.utils.formatEther(balanceAfter)).toFixed(2));
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

        await expect(winner.claim(lottoIds.length)).to.be.revertedWith("Lotto is already claimed");

        await expect(grotto.claimCreator(lottoIds.length)).to.be.revertedWith(
            "Creator already claimed",
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
                grotto.createLotto(_startTime, _endTime, 0, WinningType.TIME_BASED, overrides),
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
                grotto.createLotto(_startTime, _endTime, 0, WinningType.TIME_BASED, overrides),
            ).to.emit(grotto, "LottoCreated");
            lottoIds.push(lottoIds.length);

            const player1 = await grotto.connect(accounts[1]);
            await expect(player1.playLotto(lottoIds.length, overrides)).to.emit(
                grotto,
                "BetPlaced",
            );
        } catch (error) {
            console.log(error);
            expect(error).to.equal(undefined);
        }
    });

    it("should not claim winnings before lotto is finished", async () => {
        await expect(grotto.claim(lottoIds.length)).to.be.revertedWith("Lotto is not finished");
    });

    it("should not play time based lotto if start time has not reached", async () => {
        try {
            const overrides = {
                value: ethers.utils.parseEther("0.01"),
            };

            const startTime = new Date().getTime() + 100000000;
            const endTime = startTime + 1000000;

            await expect(
                grotto.createLotto(startTime, endTime, 0, WinningType.TIME_BASED, overrides),
            ).to.emit(grotto, "LottoCreated");
            lottoIds.push(lottoIds.length);

            const player4 = await grotto.connect(accounts[4]);
            await expect(player4.playLotto(lottoIds.length, overrides)).to.be.revertedWith(
                "Lotto is not started",
            );
        } catch (error) {
            console.log(error);
            expect(error).to.equal(undefined);
        }
    });

    it("should find winner after end time has reached", async () => {
        try {
            const overrides = {
                value: ethers.utils.parseEther(LOTTO_BETS[1] + ""),
            };

            // create lotto
            const _startTime = Math.floor(new Date().getTime() / 1000);
            const _endTime = Math.floor((new Date().getTime() + 8.64e7) / 1000); // + 24 hours
            await expect(
                grotto.createLotto(_startTime, _endTime, 0, WinningType.TIME_BASED, overrides),
            ).to.emit(grotto, "LottoCreated");
            lottoIds.push(lottoIds.length);

            // player 1
            const player1 = await grotto.connect(accounts[1]);
            await expect(player1.playLotto(lottoIds.length, overrides)).to.emit(
                grotto,
                "BetPlaced",
            );

            // player 2
            const player2 = await grotto.connect(accounts[2]);
            await expect(player2.playLotto(lottoIds.length, overrides)).to.emit(
                grotto,
                "BetPlaced",
            );

            // player 3
            const player3 = await grotto.connect(accounts[3]);
            await expect(player3.playLotto(lottoIds.length, overrides)).to.emit(
                grotto,
                "BetPlaced",
            );

            await grotto.forceEnd(lottoIds.length);

            const player4 = await grotto.connect(accounts[4]);
            await expect(player4.playLotto(lottoIds.length, overrides)).to.emit(
                grotto,
                "BetPlaced",
            );

            let lotto = await lottoReader.getById(lottoIds.length);

            expect(lotto.winner).to.be.oneOf([
                accounts[1].address,
                accounts[2].address,
                accounts[3].address,
            ]);

            const totalBetAmounts = LOTTO_BETS[1] * 4;
            const minusPlatformPercentages = ethers.utils.parseEther(
                totalBetAmounts - getPercentage(totalBetAmounts, PLATFORM_PERCENTAGE) + "",
            );

            const creatorShares = minusPlatformPercentages.mul(CREATOR_PERCENTAGE).div(100);
            const winnerShare = minusPlatformPercentages.sub(creatorShares);


            expect(ethers.utils.formatEther(winnerShare.toString())).to.equal(
                ethers.utils.formatEther(lotto.winning),
            );        
            expect(ethers.utils.formatEther(creatorShares.toString())).to.equal(
                ethers.utils.formatEther(lotto.creatorShares),
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
            +ethers.utils.formatEther(balanceAfter),
        );
    });

    it("should play time based lotto and call findWinner when time has passed", async () => {
        //create time based lotto
        const overrides = {
            value: ethers.utils.parseEther(LOTTO_BETS[1] + ""),
        };

        const _startTime = Math.floor(new Date().getTime() / 1000);
        const _endTime = Math.floor((new Date().getTime() + 8.64e7) / 1000); // + 24 hours
        const player1 = await grotto.connect(accounts[1]);
        await expect(
            player1.createLotto(_startTime, _endTime, 0, WinningType.TIME_BASED, overrides),
        ).to.emit(grotto, "LottoCreated");
        lottoIds.push(lottoIds.length);

        await expect(player1.claimCreator(lottoIds.length)).to.be.revertedWith(
            "Lotto is not finished",
        );

        await grotto.forceEnd(lottoIds.length);

        await grotto.findWinner(lottoIds.length);

        const winnings = LOTTO_BETS[1] - getPercentage(LOTTO_BETS[1], PLATFORM_PERCENTAGE);

        const balanceBefore = await ethers.provider.getBalance(accounts[1].address);
        await expect(player1.claimCreator(lottoIds.length)).to.emit(grotto, "CreatorClaimed");
        const balanceAfter = await ethers.provider.getBalance(accounts[1].address);
        expect((+ethers.utils.formatEther(balanceBefore) + winnings).toFixed(2)).to.be.eq(
            (+ethers.utils.formatEther(balanceAfter)).toFixed(2),
        );
    });

    it("should withdraw by player even if only 1 player", async () => {
        // create lotto
        let overrides = {
            value: ethers.utils.parseEther(LOTTO_BETS[1] + ""),
        };

        // create lotto
        const player1 = await grotto.connect(accounts[1]);
        const _startTime = Math.floor(new Date().getTime() / 1000);
        const _endTime = Math.floor((new Date().getTime() + 8.64e7) / 1000); // + 24 hours
        await expect(
            player1.createLotto(_startTime, _endTime, 0, WinningType.TIME_BASED, overrides),
        ).to.emit(grotto, "LottoCreated");
        lottoIds.push(lottoIds.length);

        // play lotto
        const player2 = await grotto.connect(accounts[2]);
        await expect(player2.playLotto(lottoIds.length, overrides)).to.emit(grotto, "BetPlaced");

        await grotto.forceEnd(lottoIds.length);

        await expect(player1.claimCreator(lottoIds.length)).to.be.revertedWith(
            "Lotto is not finished",
        );

        // creator must call findWinner before anyone can withdraw
        await expect(player1.findWinner(lottoIds.length));

        const playerWinnings = await lottoReader.getPlayerWinnings(
            lottoIds.length,
            accounts[2].address,
        );
        // then withdraw player 1
        const balanceBefore = await ethers.provider.getBalance(accounts[2].address);
        await expect(player2.claim(lottoIds.length)).to.emit(grotto, "Claimed");
        const balanceAfter = await ethers.provider.getBalance(accounts[2].address);
        expect(
            (
                +ethers.utils.formatEther(balanceBefore) +
                +ethers.utils.formatEther(playerWinnings.winning)
            ).toFixed(2),
        ).to.be.eq((+ethers.utils.formatEther(balanceAfter)).toFixed(2));
    });

    it("should withdraw player after withdrawing creator", async () => {
        try {
            const overrides = {
                value: ethers.utils.parseEther("10"),
            };

            // create lotto
            await expect(
                grotto.createLotto(0, 0, 3, WinningType.NUMBER_OF_PLAYERS, overrides),
            ).to.emit(grotto, "LottoCreated");
            lottoIds.push(lottoIds.length);

            // player 1
            const player1 = await grotto.connect(accounts[1]);
            await expect(player1.playLotto(lottoIds.length, overrides)).to.emit(
                grotto,
                "BetPlaced",
            );

            // player 2
            const player2 = await grotto.connect(accounts[2]);
            await expect(player2.playLotto(lottoIds.length, overrides)).to.emit(
                grotto,
                "BetPlaced",
            );

            // player 3
            const player3 = await grotto.connect(accounts[3]);
            await expect(player3.playLotto(lottoIds.length, overrides)).to.emit(
                grotto,
                "BetPlaced",
            );
            const lotto = await lottoReader.getById(lottoIds.length);
            expect(lotto.winner).to.be.oneOf([
                accounts[1].address,
                accounts[2].address,
                accounts[3].address,
            ]);

            const winnerShare = await lottoReader.getPlayerWinnings(lottoIds.length, lotto.winner);

            expect(ethers.utils.formatEther(winnerShare.winning)).to.equal(
                ethers.utils.formatEther(lotto.winning),
            );

            const creatorShares = await lottoReader.getCreatorWinnings(lottoIds.length);
            expect(ethers.utils.formatEther(creatorShares.winning)).to.equal(
                ethers.utils.formatEther(lotto.creatorShares),
            );

            let balanceBefore = await ethers.provider.getBalance(accounts[0].address);
            await expect(player1.claimCreator(lottoIds.length)).to.emit(grotto, "CreatorClaimed");
            let balanceAfter = await ethers.provider.getBalance(accounts[0].address);
            expect(
                (
                    +ethers.utils.formatEther(balanceBefore) +
                    +ethers.utils.formatEther(creatorShares.winning)
                ).toFixed(1),
            ).to.be.eq((+ethers.utils.formatEther(balanceAfter)).toFixed(1));

            const winnerAddress = lotto.winner;
            const winnerAccountIndex = accounts
                .map((account, index) => (account.address === winnerAddress ? index : -1))
                .filter((index) => index >= 0);
            balanceBefore = await ethers.provider.getBalance(winnerAddress);
            const winner = await grotto.connect(accounts[winnerAccountIndex[0]]);
            await expect(winner.claim(lottoIds.length)).to.emit(grotto, "Claimed");
            balanceAfter = await ethers.provider.getBalance(winnerAddress);
            expect(+ethers.utils.formatEther(balanceBefore)).to.be.lessThan(
                +ethers.utils.formatEther(balanceAfter),
            );
        } catch (error) {
            console.log("Errored: ", error);
            expect(error).to.equal(undefined);
        }
    });

    it("should get some stats", async () => {
        const lottosPaginated = await lottoReader.getPaginated(2, 5, address0, false);
        console.log("Paginated: ", lottosPaginated.length);
        const stats = await lottoReader.getStats();
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
