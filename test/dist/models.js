"use strict";
exports.__esModule = true;
exports.platformOwner = exports.PotType = exports.PotGuessType = exports.WinningType = void 0;
var WinningType;
(function (WinningType) {
    WinningType[WinningType["TIME_BASED"] = 0] = "TIME_BASED";
    WinningType[WinningType["NUMBER_OF_PLAYERS"] = 1] = "NUMBER_OF_PLAYERS";
})(WinningType = exports.WinningType || (exports.WinningType = {}));
var PotGuessType;
(function (PotGuessType) {
    PotGuessType[PotGuessType["NUMBERS"] = 0] = "NUMBERS";
    PotGuessType[PotGuessType["ORDER"] = 1] = "ORDER";
})(PotGuessType = exports.PotGuessType || (exports.PotGuessType = {}));
var PotType;
(function (PotType) {
    PotType[PotType["MULTIPLE_WINNER"] = 0] = "MULTIPLE_WINNER";
    PotType[PotType["SINGLE_WINNER"] = 1] = "SINGLE_WINNER";
})(PotType = exports.PotType || (exports.PotType = {}));
exports.platformOwner = "0xac706cE8A9BF27Afecf080fB298d0ee13cfb978A";
