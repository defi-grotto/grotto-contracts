"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
exports.__esModule = true;
var hardhat_1 = require("hardhat");
var chai_1 = require("chai");
var models_1 = require("./models");
describe.only("Grotto: Play Lotto Tests", function () {
    var accounts;
    var address0 = "0x0000000000000000000000000000000000000000";
    var grotto;
    var reader;
    var lottoIds = [];
    before(function () { return __awaiter(void 0, void 0, void 0, function () {
        var Storage, PotController, SingleWinnerPotController, storageController, potController, swPotController, Grotto, Reader, LottoController, controller;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, hardhat_1.ethers.getSigners()];
                case 1:
                    accounts = _a.sent();
                    return [4 /*yield*/, hardhat_1.ethers.getContractFactory("Storage")];
                case 2:
                    Storage = _a.sent();
                    return [4 /*yield*/, hardhat_1.ethers.getContractFactory("PotController")];
                case 3:
                    PotController = _a.sent();
                    return [4 /*yield*/, hardhat_1.ethers.getContractFactory("SingleWinnerPotController")];
                case 4:
                    SingleWinnerPotController = _a.sent();
                    return [4 /*yield*/, Storage.deploy()];
                case 5:
                    storageController = _a.sent();
                    return [4 /*yield*/, storageController.deployed()];
                case 6:
                    _a.sent();
                    return [4 /*yield*/, PotController.deploy(storageController.address)];
                case 7:
                    potController = _a.sent();
                    return [4 /*yield*/, SingleWinnerPotController.deploy(storageController.address)];
                case 8:
                    swPotController = _a.sent();
                    return [4 /*yield*/, hardhat_1.ethers.getContractFactory("Grotto")];
                case 9:
                    Grotto = _a.sent();
                    return [4 /*yield*/, hardhat_1.ethers.getContractFactory("Reader")];
                case 10:
                    Reader = _a.sent();
                    return [4 /*yield*/, hardhat_1.ethers.getContractFactory("LottoController")];
                case 11:
                    LottoController = _a.sent();
                    return [4 /*yield*/, LottoController.deploy(storageController.address)];
                case 12:
                    controller = _a.sent();
                    return [4 /*yield*/, Grotto.deploy(controller.address, potController.address, swPotController.address, storageController.address)];
                case 13:
                    grotto = _a.sent();
                    return [4 /*yield*/, Reader.deploy(controller.address, potController.address, swPotController.address, storageController.address)];
                case 14:
                    reader = _a.sent();
                    return [4 /*yield*/, controller.grantLottoCreator(grotto.address)];
                case 15:
                    _a.sent();
                    return [4 /*yield*/, controller.grantLottoPlayer(grotto.address)];
                case 16:
                    _a.sent();
                    return [4 /*yield*/, controller.grantAdmin(grotto.address)];
                case 17:
                    _a.sent();
                    return [4 /*yield*/, storageController.grantAdminRole(controller.address)];
                case 18:
                    _a.sent();
                    return [4 /*yield*/, storageController.grantAdminRole(potController.address)];
                case 19:
                    _a.sent();
                    return [4 /*yield*/, storageController.grantAdminRole(swPotController.address)];
                case 20:
                    _a.sent();
                    return [4 /*yield*/, storageController.grantAdminRole(grotto.address)];
                case 21:
                    _a.sent();
                    console.log("LottoController Deployed to " + controller.address);
                    chai_1.expect(controller.address).to.not.eq(address0);
                    console.log("Grotto Deployed to " + grotto.address);
                    return [2 /*return*/];
            }
        });
    }); });
    it("should create grotto contract", function () { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            chai_1.expect(grotto.address).to.not.eq(address0);
            return [2 /*return*/];
        });
    }); });
    it("should create a number of player lotto winning type", function () { return __awaiter(void 0, void 0, void 0, function () {
        var overrides, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    overrides = {
                        value: hardhat_1.ethers.utils.parseEther("0.01")
                    };
                    return [4 /*yield*/, chai_1.expect(grotto.createLotto(0, 0, 3, models_1.WinningType.NUMBER_OF_PLAYERS, overrides)).to.emit(grotto, "LottoCreated")];
                case 1:
                    _a.sent();
                    lottoIds.push(lottoIds.length);
                    return [3 /*break*/, 3];
                case 2:
                    error_1 = _a.sent();
                    console.log(error_1);
                    chai_1.expect(error_1).to.equal(undefined);
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    }); });
    it("should play number of players lotto", function () { return __awaiter(void 0, void 0, void 0, function () {
        var overrides, player1, error_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 3, , 4]);
                    overrides = {
                        value: hardhat_1.ethers.utils.parseEther("0.01")
                    };
                    return [4 /*yield*/, grotto.connect(accounts[1])];
                case 1:
                    player1 = _a.sent();
                    return [4 /*yield*/, chai_1.expect(player1.playLotto(lottoIds.length, overrides)).to.emit(grotto, "BetPlaced")];
                case 2:
                    _a.sent();
                    return [3 /*break*/, 4];
                case 3:
                    error_2 = _a.sent();
                    console.log(error_2);
                    chai_1.expect(error_2).to.equal(undefined);
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    }); });
    it("should not play lotto by creator", function () { return __awaiter(void 0, void 0, void 0, function () {
        var overrides, error_3;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    overrides = {
                        value: hardhat_1.ethers.utils.parseEther("0.01")
                    };
                    return [4 /*yield*/, chai_1.expect(grotto.playLotto(lottoIds.length, overrides)).to.be.revertedWith("Creator can not play")];
                case 1:
                    _a.sent();
                    return [3 /*break*/, 3];
                case 2:
                    error_3 = _a.sent();
                    console.log(error_3);
                    chai_1.expect(error_3).to.equal(undefined);
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    }); });
    it("should not play lotto with non-existent lotto id", function () { return __awaiter(void 0, void 0, void 0, function () {
        var overrides, player1, error_4;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 3, , 4]);
                    overrides = {
                        value: hardhat_1.ethers.utils.parseEther("0.01")
                    };
                    return [4 /*yield*/, grotto.connect(accounts[1])];
                case 1:
                    player1 = _a.sent();
                    return [4 /*yield*/, chai_1.expect(player1.playLotto(1001, overrides)).to.be.revertedWith("Lotto does not exist")];
                case 2:
                    _a.sent();
                    return [3 /*break*/, 4];
                case 3:
                    error_4 = _a.sent();
                    console.log(error_4);
                    chai_1.expect(error_4).to.equal(undefined);
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    }); });
    it("should not play lotto if bet amount is lower that what is set by creator", function () { return __awaiter(void 0, void 0, void 0, function () {
        var overrides, player1, error_5;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 3, , 4]);
                    overrides = {
                        value: hardhat_1.ethers.utils.parseEther("0.001")
                    };
                    return [4 /*yield*/, grotto.connect(accounts[1])];
                case 1:
                    player1 = _a.sent();
                    return [4 /*yield*/, chai_1.expect(player1.playLotto(lottoIds.length, overrides)).to.be.revertedWith("BetPlaced is too low")];
                case 2:
                    _a.sent();
                    return [3 /*break*/, 4];
                case 3:
                    error_5 = _a.sent();
                    console.log(error_5);
                    chai_1.expect(error_5).to.equal(undefined);
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    }); });
    it("should not claim winnings before lotto is finished", function () { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, chai_1.expect(grotto.claim(lottoIds.length)).to.be.revertedWith("Lotto is not finished")];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); });
    it("should not play lotto if max number of players reached", function () { return __awaiter(void 0, void 0, void 0, function () {
        var overrides, player2, player3, lottos, completed, player4, error_6;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 9, , 10]);
                    overrides = {
                        value: hardhat_1.ethers.utils.parseEther("0.01")
                    };
                    return [4 /*yield*/, grotto.connect(accounts[2])];
                case 1:
                    player2 = _a.sent();
                    return [4 /*yield*/, chai_1.expect(player2.playLotto(lottoIds.length, overrides)).to.emit(grotto, "BetPlaced")];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, grotto.connect(accounts[3])];
                case 3:
                    player3 = _a.sent();
                    return [4 /*yield*/, chai_1.expect(player3.playLotto(lottoIds.length, overrides)).to.emit(grotto, "BetPlaced")];
                case 4:
                    _a.sent();
                    return [4 /*yield*/, reader.getLottos()];
                case 5:
                    lottos = _a.sent();
                    chai_1.expect(lottos.map(function (l) { return l.toNumber(); })).to.not.contain(lottoIds.length);
                    return [4 /*yield*/, reader.getCompletedLottos()];
                case 6:
                    completed = _a.sent();
                    chai_1.expect(completed.map(function (c) { return c.toNumber(); })).to.contain(lottoIds.length);
                    return [4 /*yield*/, grotto.connect(accounts[4])];
                case 7:
                    player4 = _a.sent();
                    return [4 /*yield*/, chai_1.expect(player4.playLotto(lottoIds.length, overrides)).to.be.revertedWith("Lotto is finished")];
                case 8:
                    _a.sent();
                    return [3 /*break*/, 10];
                case 9:
                    error_6 = _a.sent();
                    console.log(error_6);
                    chai_1.expect(error_6).to.equal(undefined);
                    return [3 /*break*/, 10];
                case 10: return [2 /*return*/];
            }
        });
    }); });
    it("should find winner after max number of players reached", function () { return __awaiter(void 0, void 0, void 0, function () {
        var overrides, player1, player2, player3, lotto, totalStaked, winnerShare, creatorShares, error_7;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 9, , 10]);
                    overrides = {
                        value: hardhat_1.ethers.utils.parseEther("0.01")
                    };
                    // create lotto
                    return [4 /*yield*/, chai_1.expect(grotto.createLotto(0, 0, 3, models_1.WinningType.NUMBER_OF_PLAYERS, overrides)).to.emit(grotto, "LottoCreated")];
                case 1:
                    // create lotto
                    _a.sent();
                    lottoIds.push(lottoIds.length);
                    return [4 /*yield*/, grotto.connect(accounts[1])];
                case 2:
                    player1 = _a.sent();
                    return [4 /*yield*/, chai_1.expect(player1.playLotto(lottoIds.length, overrides)).to.emit(grotto, "BetPlaced")];
                case 3:
                    _a.sent();
                    return [4 /*yield*/, grotto.connect(accounts[2])];
                case 4:
                    player2 = _a.sent();
                    return [4 /*yield*/, chai_1.expect(player2.playLotto(lottoIds.length, overrides)).to.emit(grotto, "BetPlaced")];
                case 5:
                    _a.sent();
                    return [4 /*yield*/, grotto.connect(accounts[3])];
                case 6:
                    player3 = _a.sent();
                    return [4 /*yield*/, chai_1.expect(player3.playLotto(lottoIds.length, overrides)).to.emit(grotto, "BetPlaced")];
                case 7:
                    _a.sent();
                    return [4 /*yield*/, reader.getLottoById(lottoIds.length)];
                case 8:
                    lotto = _a.sent();
                    chai_1.expect(lotto.winner).to.be.oneOf([
                        accounts[1].address,
                        accounts[2].address,
                        accounts[3].address,
                    ]);
                    totalStaked = hardhat_1.ethers.utils
                        .parseEther("0.009")
                        .add(hardhat_1.ethers.utils.parseEther("0.009"))
                        .add(hardhat_1.ethers.utils.parseEther("0.009"))
                        .add(hardhat_1.ethers.utils.parseEther("0.009"));
                    winnerShare = totalStaked.mul(80).div(100);
                    chai_1.expect(hardhat_1.ethers.utils.formatEther(winnerShare.toString())).to.equal(hardhat_1.ethers.utils.formatEther(lotto.winning));
                    creatorShares = totalStaked.mul(20).div(100);
                    chai_1.expect(hardhat_1.ethers.utils.formatEther(creatorShares.toString())).to.equal(hardhat_1.ethers.utils.formatEther(lotto.creatorShares));
                    return [3 /*break*/, 10];
                case 9:
                    error_7 = _a.sent();
                    console.log("Errored: ", error_7);
                    chai_1.expect(error_7).to.equal(undefined);
                    return [3 /*break*/, 10];
                case 10: return [2 /*return*/];
            }
        });
    }); });
    it("should claim winnings", function () { return __awaiter(void 0, void 0, void 0, function () {
        var lotto, winnerAddress, winnerAccountIndex, balanceBefore, winner, balanceAfter;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, reader.getLottoById(lottoIds.length)];
                case 1:
                    lotto = _a.sent();
                    winnerAddress = lotto.winner;
                    winnerAccountIndex = accounts
                        .map(function (account, index) { return (account.address === winnerAddress ? index : -1); })
                        .filter(function (index) { return index >= 0; });
                    return [4 /*yield*/, hardhat_1.ethers.provider.getBalance(winnerAddress)];
                case 2:
                    balanceBefore = _a.sent();
                    return [4 /*yield*/, grotto.connect(accounts[winnerAccountIndex[0]])];
                case 3:
                    winner = _a.sent();
                    return [4 /*yield*/, chai_1.expect(winner.claim(lottoIds.length)).to.emit(grotto, "Claimed")];
                case 4:
                    _a.sent();
                    return [4 /*yield*/, hardhat_1.ethers.provider.getBalance(winnerAddress)];
                case 5:
                    balanceAfter = _a.sent();
                    chai_1.expect(+hardhat_1.ethers.utils.formatEther(balanceBefore)).to.be.lessThan(+hardhat_1.ethers.utils.formatEther(balanceAfter));
                    return [2 /*return*/];
            }
        });
    }); });
    it("should claim winnings by creator", function () { return __awaiter(void 0, void 0, void 0, function () {
        var overrides, player1, player2, player3, lotto, totalStaked, winnerShare, creatorShares, winnerAddress_1, winnerAccountIndex, winner, balanceBefore, balanceAfter, error_8;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 14, , 15]);
                    overrides = {
                        value: hardhat_1.ethers.utils.parseEther("0.01")
                    };
                    // create lotto
                    return [4 /*yield*/, chai_1.expect(grotto.createLotto(0, 0, 3, models_1.WinningType.NUMBER_OF_PLAYERS, overrides)).to.emit(grotto, "LottoCreated")];
                case 1:
                    // create lotto
                    _a.sent();
                    lottoIds.push(lottoIds.length);
                    return [4 /*yield*/, grotto.connect(accounts[1])];
                case 2:
                    player1 = _a.sent();
                    return [4 /*yield*/, chai_1.expect(player1.playLotto(lottoIds.length, overrides)).to.emit(grotto, "BetPlaced")];
                case 3:
                    _a.sent();
                    return [4 /*yield*/, grotto.connect(accounts[2])];
                case 4:
                    player2 = _a.sent();
                    return [4 /*yield*/, chai_1.expect(player2.playLotto(lottoIds.length, overrides)).to.emit(grotto, "BetPlaced")];
                case 5:
                    _a.sent();
                    return [4 /*yield*/, grotto.connect(accounts[3])];
                case 6:
                    player3 = _a.sent();
                    return [4 /*yield*/, chai_1.expect(player3.playLotto(lottoIds.length, overrides)).to.emit(grotto, "BetPlaced")];
                case 7:
                    _a.sent();
                    return [4 /*yield*/, reader.getLottoById(lottoIds.length)];
                case 8:
                    lotto = _a.sent();
                    chai_1.expect(lotto.winner).to.be.oneOf([
                        accounts[1].address,
                        accounts[2].address,
                        accounts[3].address,
                    ]);
                    totalStaked = hardhat_1.ethers.utils
                        .parseEther("0.009")
                        .add(hardhat_1.ethers.utils.parseEther("0.009"))
                        .add(hardhat_1.ethers.utils.parseEther("0.009"))
                        .add(hardhat_1.ethers.utils.parseEther("0.009"));
                    winnerShare = totalStaked.mul(80).div(100);
                    chai_1.expect(hardhat_1.ethers.utils.formatEther(winnerShare.toString())).to.equal(hardhat_1.ethers.utils.formatEther(lotto.winning));
                    creatorShares = totalStaked.mul(20).div(100);
                    chai_1.expect(hardhat_1.ethers.utils.formatEther(creatorShares.toString())).to.equal(hardhat_1.ethers.utils.formatEther(lotto.creatorShares));
                    winnerAddress_1 = lotto.winner;
                    winnerAccountIndex = accounts
                        .map(function (account, index) {
                        return account.address === winnerAddress_1 ? index : -1;
                    })
                        .filter(function (index) { return index >= 0; });
                    return [4 /*yield*/, grotto.connect(accounts[winnerAccountIndex[0]])];
                case 9:
                    winner = _a.sent();
                    return [4 /*yield*/, chai_1.expect(winner.claim(lottoIds.length)).to.emit(grotto, "Claimed")];
                case 10:
                    _a.sent();
                    return [4 /*yield*/, hardhat_1.ethers.provider.getBalance(accounts[0].address)];
                case 11:
                    balanceBefore = _a.sent();
                    return [4 /*yield*/, chai_1.expect(grotto.claimCreator(lottoIds.length)).to.emit(grotto, "CreatorClaimed")];
                case 12:
                    _a.sent();
                    return [4 /*yield*/, hardhat_1.ethers.provider.getBalance(accounts[0].address)];
                case 13:
                    balanceAfter = _a.sent();
                    chai_1.expect(+hardhat_1.ethers.utils.formatEther(balanceBefore)).to.be.lessThan(+hardhat_1.ethers.utils.formatEther(balanceAfter));
                    return [3 /*break*/, 15];
                case 14:
                    error_8 = _a.sent();
                    console.log("Errored: ", error_8);
                    chai_1.expect(error_8).to.equal(undefined);
                    return [3 /*break*/, 15];
                case 15: return [2 /*return*/];
            }
        });
    }); });
    it("should not claim winnings twice", function () { return __awaiter(void 0, void 0, void 0, function () {
        var lotto, winnerAddress, winnerAccountIndex, winner;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, reader.getLottoById(lottoIds.length)];
                case 1:
                    lotto = _a.sent();
                    winnerAddress = lotto.winner;
                    winnerAccountIndex = accounts
                        .map(function (account, index) { return (account.address === winnerAddress ? index : -1); })
                        .filter(function (index) { return index >= 0; });
                    return [4 /*yield*/, grotto.connect(accounts[winnerAccountIndex[0]])];
                case 2:
                    winner = _a.sent();
                    return [4 /*yield*/, chai_1.expect(winner.claim(lottoIds.length)).to.be.revertedWith("Lotto is already claimed")];
                case 3:
                    _a.sent();
                    return [4 /*yield*/, chai_1.expect(grotto.claimCreator(lottoIds.length)).to.be.revertedWith("Creator already claimed")];
                case 4:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); });
    it("should create a time based lotto winning type", function () { return __awaiter(void 0, void 0, void 0, function () {
        var overrides, _startTime, _endTime, error_9;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    overrides = {
                        value: hardhat_1.ethers.utils.parseEther("0.01")
                    };
                    _startTime = Math.floor(new Date().getTime() / 1000);
                    _endTime = Math.floor((new Date().getTime() + 8.64e7) / 1000);
                    return [4 /*yield*/, chai_1.expect(grotto.createLotto(_startTime, _endTime, 0, models_1.WinningType.TIME_BASED, overrides)).to.emit(grotto, "LottoCreated")];
                case 1:
                    _a.sent();
                    lottoIds.push(lottoIds.length);
                    return [3 /*break*/, 3];
                case 2:
                    error_9 = _a.sent();
                    console.log(error_9);
                    chai_1.expect(error_9).to.equal(undefined);
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    }); });
    it("should play time based lotto", function () { return __awaiter(void 0, void 0, void 0, function () {
        var overrides, _startTime, _endTime, player1, error_10;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 4, , 5]);
                    overrides = {
                        value: hardhat_1.ethers.utils.parseEther("0.01")
                    };
                    _startTime = Math.floor(new Date().getTime() / 1000);
                    _endTime = Math.floor((new Date().getTime() + 8.64e7) / 1000);
                    return [4 /*yield*/, chai_1.expect(grotto.createLotto(_startTime, _endTime, 0, models_1.WinningType.TIME_BASED, overrides)).to.emit(grotto, "LottoCreated")];
                case 1:
                    _a.sent();
                    lottoIds.push(lottoIds.length);
                    return [4 /*yield*/, grotto.connect(accounts[1])];
                case 2:
                    player1 = _a.sent();
                    return [4 /*yield*/, chai_1.expect(player1.playLotto(lottoIds.length, overrides)).to.emit(grotto, "BetPlaced")];
                case 3:
                    _a.sent();
                    return [3 /*break*/, 5];
                case 4:
                    error_10 = _a.sent();
                    console.log(error_10);
                    chai_1.expect(error_10).to.equal(undefined);
                    return [3 /*break*/, 5];
                case 5: return [2 /*return*/];
            }
        });
    }); });
    it("should not claim winnings before lotto is finished", function () { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, chai_1.expect(grotto.claim(lottoIds.length)).to.be.revertedWith("Lotto is not finished")];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); });
    it("should not play time based lotto if start time has not reached", function () { return __awaiter(void 0, void 0, void 0, function () {
        var overrides, startTime, endTime, player4, error_11;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 4, , 5]);
                    overrides = {
                        value: hardhat_1.ethers.utils.parseEther("0.01")
                    };
                    startTime = new Date().getTime() + 100000000;
                    endTime = startTime + 1000000;
                    return [4 /*yield*/, chai_1.expect(grotto.createLotto(startTime, endTime, 0, models_1.WinningType.TIME_BASED, overrides)).to.emit(grotto, "LottoCreated")];
                case 1:
                    _a.sent();
                    lottoIds.push(lottoIds.length);
                    return [4 /*yield*/, grotto.connect(accounts[4])];
                case 2:
                    player4 = _a.sent();
                    return [4 /*yield*/, chai_1.expect(player4.playLotto(lottoIds.length, overrides)).to.be.revertedWith("Lotto is not started")];
                case 3:
                    _a.sent();
                    return [3 /*break*/, 5];
                case 4:
                    error_11 = _a.sent();
                    console.log(error_11);
                    chai_1.expect(error_11).to.equal(undefined);
                    return [3 /*break*/, 5];
                case 5: return [2 /*return*/];
            }
        });
    }); });
    it("should find winner after end time has reached reached", function () { return __awaiter(void 0, void 0, void 0, function () {
        var overrides, _startTime, _endTime, player1, player2, player3, player4, lotto, totalStaked, winnerShare, creatorShares, error_12;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 12, , 13]);
                    overrides = {
                        value: hardhat_1.ethers.utils.parseEther("0.01")
                    };
                    _startTime = Math.floor(new Date().getTime() / 1000);
                    _endTime = Math.floor((new Date().getTime() + 8.64e7) / 1000);
                    return [4 /*yield*/, chai_1.expect(grotto.createLotto(_startTime, _endTime, 0, models_1.WinningType.TIME_BASED, overrides)).to.emit(grotto, "LottoCreated")];
                case 1:
                    _a.sent();
                    lottoIds.push(lottoIds.length);
                    return [4 /*yield*/, grotto.connect(accounts[1])];
                case 2:
                    player1 = _a.sent();
                    return [4 /*yield*/, chai_1.expect(player1.playLotto(lottoIds.length, overrides)).to.emit(grotto, "BetPlaced")];
                case 3:
                    _a.sent();
                    return [4 /*yield*/, grotto.connect(accounts[2])];
                case 4:
                    player2 = _a.sent();
                    return [4 /*yield*/, chai_1.expect(player2.playLotto(lottoIds.length, overrides)).to.emit(grotto, "BetPlaced")];
                case 5:
                    _a.sent();
                    return [4 /*yield*/, grotto.connect(accounts[3])];
                case 6:
                    player3 = _a.sent();
                    return [4 /*yield*/, chai_1.expect(player3.playLotto(lottoIds.length, overrides)).to.emit(grotto, "BetPlaced")];
                case 7:
                    _a.sent();
                    return [4 /*yield*/, grotto.forceEnd(lottoIds.length)];
                case 8:
                    _a.sent();
                    return [4 /*yield*/, grotto.connect(accounts[4])];
                case 9:
                    player4 = _a.sent();
                    return [4 /*yield*/, chai_1.expect(player4.playLotto(lottoIds.length, overrides)).to.emit(grotto, "BetPlaced")];
                case 10:
                    _a.sent();
                    return [4 /*yield*/, reader.getLottoById(lottoIds.length)];
                case 11:
                    lotto = _a.sent();
                    chai_1.expect(lotto.winner).to.be.oneOf([
                        accounts[1].address,
                        accounts[2].address,
                        accounts[3].address,
                    ]);
                    totalStaked = hardhat_1.ethers.utils
                        .parseEther("0.009")
                        .add(hardhat_1.ethers.utils.parseEther("0.009"))
                        .add(hardhat_1.ethers.utils.parseEther("0.009"))
                        .add(hardhat_1.ethers.utils.parseEther("0.009"));
                    winnerShare = totalStaked.mul(80).div(100);
                    chai_1.expect(hardhat_1.ethers.utils.formatEther(winnerShare.toString())).to.equal(hardhat_1.ethers.utils.formatEther(lotto.winning));
                    creatorShares = totalStaked.mul(20).div(100);
                    chai_1.expect(hardhat_1.ethers.utils.formatEther(creatorShares.toString())).to.equal(hardhat_1.ethers.utils.formatEther(lotto.creatorShares));
                    return [3 /*break*/, 13];
                case 12:
                    error_12 = _a.sent();
                    console.log("Errored: ", error_12);
                    chai_1.expect(error_12).to.equal(undefined);
                    return [3 /*break*/, 13];
                case 13: return [2 /*return*/];
            }
        });
    }); });
    it("should claim winnings", function () { return __awaiter(void 0, void 0, void 0, function () {
        var lotto, winnerAddress, winnerAccountIndex, balanceBefore, winner, balanceAfter;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, reader.getLottoById(lottoIds.length)];
                case 1:
                    lotto = _a.sent();
                    winnerAddress = lotto.winner;
                    winnerAccountIndex = accounts
                        .map(function (account, index) { return (account.address === winnerAddress ? index : -1); })
                        .filter(function (index) { return index >= 0; });
                    return [4 /*yield*/, hardhat_1.ethers.provider.getBalance(winnerAddress)];
                case 2:
                    balanceBefore = _a.sent();
                    return [4 /*yield*/, grotto.connect(accounts[winnerAccountIndex[0]])];
                case 3:
                    winner = _a.sent();
                    return [4 /*yield*/, chai_1.expect(winner.claim(lottoIds.length)).to.emit(grotto, "Claimed")];
                case 4:
                    _a.sent();
                    return [4 /*yield*/, hardhat_1.ethers.provider.getBalance(winnerAddress)];
                case 5:
                    balanceAfter = _a.sent();
                    chai_1.expect(+hardhat_1.ethers.utils.formatEther(balanceBefore)).to.be.lessThan(+hardhat_1.ethers.utils.formatEther(balanceAfter));
                    return [2 /*return*/];
            }
        });
    }); });
    it("should end a lotto by owner if time has passed", function () { return __awaiter(void 0, void 0, void 0, function () {
        var overrides, player1, _startTime, _endTime, lottos, completed, error_13;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    overrides = {
                        value: hardhat_1.ethers.utils.parseEther("0.01")
                    };
                    return [4 /*yield*/, grotto.connect(accounts[1])];
                case 1:
                    player1 = _a.sent();
                    _startTime = Math.floor(new Date().getTime() / 1000);
                    _endTime = Math.floor((new Date().getTime() + 8.64e7) / 1000);
                    return [4 /*yield*/, chai_1.expect(player1.createLotto(_startTime, _endTime, 0, models_1.WinningType.TIME_BASED, overrides)).to.emit(grotto, "LottoCreated")];
                case 2:
                    _a.sent();
                    lottoIds.push(lottoIds.length);
                    // try to end, should get an error
                    return [4 /*yield*/, chai_1.expect(player1.endLotto(lottoIds.length)).to.be.revertedWith("Lotto is not finished")];
                case 3:
                    // try to end, should get an error
                    _a.sent();
                    return [4 /*yield*/, reader.getLottos()];
                case 4:
                    lottos = _a.sent();
                    chai_1.expect(lottos.map(function (l) { return l.toNumber(); })).to.contain(lottoIds.length);
                    return [4 /*yield*/, reader.getCompletedLottos()];
                case 5:
                    completed = _a.sent();
                    chai_1.expect(completed.map(function (c) { return c.toNumber(); })).to.not.contain(lottoIds.length);
                    return [4 /*yield*/, grotto.forceEnd(lottoIds.length)];
                case 6:
                    _a.sent();
                    _a.label = 7;
                case 7:
                    _a.trys.push([7, 9, , 10]);
                    return [4 /*yield*/, player1.endLotto(lottoIds.length)];
                case 8:
                    _a.sent();
                    return [3 /*break*/, 10];
                case 9:
                    error_13 = _a.sent();
                    console.log(error_13);
                    chai_1.expect(error_13).to.be.undefined;
                    return [3 /*break*/, 10];
                case 10: return [4 /*yield*/, reader.getLottos()];
                case 11:
                    lottos = _a.sent();
                    chai_1.expect(lottos.map(function (l) { return l.toNumber(); })).to.not.contain(lottoIds.length);
                    return [4 /*yield*/, reader.getCompletedLottos()];
                case 12:
                    completed = _a.sent();
                    chai_1.expect(completed.map(function (c) { return c.toNumber(); })).to.contain(lottoIds.length);
                    return [2 /*return*/];
            }
        });
    }); });
    it("should end a lotto by player if time has passed", function () { return __awaiter(void 0, void 0, void 0, function () {
        var overrides, player1, _startTime, _endTime, lottos, completed, player2, error_14;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    overrides = {
                        value: hardhat_1.ethers.utils.parseEther("0.01")
                    };
                    return [4 /*yield*/, grotto.connect(accounts[1])];
                case 1:
                    player1 = _a.sent();
                    _startTime = Math.floor(new Date().getTime() / 1000);
                    _endTime = Math.floor((new Date().getTime() + 8.64e7) / 1000);
                    return [4 /*yield*/, chai_1.expect(player1.createLotto(_startTime, _endTime, 0, models_1.WinningType.TIME_BASED, overrides)).to.emit(grotto, "LottoCreated")];
                case 2:
                    _a.sent();
                    lottoIds.push(lottoIds.length);
                    // try to end, should get an error
                    return [4 /*yield*/, chai_1.expect(player1.endLotto(lottoIds.length)).to.be.revertedWith("Lotto is not finished")];
                case 3:
                    // try to end, should get an error
                    _a.sent();
                    return [4 /*yield*/, reader.getLottos()];
                case 4:
                    lottos = _a.sent();
                    chai_1.expect(lottos.map(function (l) { return l.toNumber(); })).to.contain(lottoIds.length);
                    return [4 /*yield*/, reader.getCompletedLottos()];
                case 5:
                    completed = _a.sent();
                    chai_1.expect(completed.map(function (c) { return c.toNumber(); })).to.not.contain(lottoIds.length);
                    overrides = {
                        value: hardhat_1.ethers.utils.parseEther("0.02")
                    };
                    player2 = grotto.connect(accounts[2]);
                    return [4 /*yield*/, player2.playLotto(lottoIds.length, overrides)];
                case 6:
                    _a.sent();
                    return [4 /*yield*/, grotto.forceEnd(lottoIds.length)];
                case 7:
                    _a.sent();
                    _a.label = 8;
                case 8:
                    _a.trys.push([8, 10, , 11]);
                    return [4 /*yield*/, player2.endLotto(lottoIds.length)];
                case 9:
                    _a.sent();
                    return [3 /*break*/, 11];
                case 10:
                    error_14 = _a.sent();
                    console.log(error_14);
                    chai_1.expect(error_14).to.be.undefined;
                    return [3 /*break*/, 11];
                case 11: return [4 /*yield*/, reader.getLottos()];
                case 12:
                    lottos = _a.sent();
                    chai_1.expect(lottos.map(function (l) { return l.toNumber(); })).to.not.contain(lottoIds.length);
                    return [4 /*yield*/, reader.getCompletedLottos()];
                case 13:
                    completed = _a.sent();
                    chai_1.expect(completed.map(function (c) { return c.toNumber(); })).to.contain(lottoIds.length);
                    return [2 /*return*/];
            }
        });
    }); });
    it("should get some stats", function () { return __awaiter(void 0, void 0, void 0, function () {
        var lottosPaginated, stats;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, reader.getLottosPaginated(2, 5)];
                case 1:
                    lottosPaginated = _a.sent();
                    console.log("Paginated: ", lottosPaginated.length);
                    return [4 /*yield*/, reader.getStats()];
                case 2:
                    stats = _a.sent();
                    console.log("Total Played: ", hardhat_1.ethers.utils.formatEther(stats.totalPlayed.toString()));
                    console.log("Total Players: ", stats.totalPlayers.toString());
                    console.log("Total Games: ", stats.totalGames.toString());
                    console.log("Total Lotto: ", stats.totalLotto.toString());
                    console.log("Total Pot: ", stats.totalPot.toString());
                    console.log("Total SingleWinnerPot: ", stats.totalSingleWinnerPot.toString());
                    console.log("Total totalCreators: ", stats.totalCreators.toString());
                    console.log("Total Creator Shares: ", hardhat_1.ethers.utils.formatEther(stats.totalCreatorShares.toString()));
                    console.log("Total Platform Shares: ", hardhat_1.ethers.utils.formatEther(stats.totalPlatformShares.toString()));
                    console.log("Total Players Shares: ", hardhat_1.ethers.utils.formatEther(stats.totalPlayerShares.toString()));
                    return [2 /*return*/];
            }
        });
    }); });
});
