//SPDX-License-Identifier: Unlicense
pragma solidity 0.8.3;

enum WinningType {
    TIME_BASED,
    NUMBER_OF_PLAYERS
}

enum PotGuessType {
    NUMBERS,
    ORDER,
    BOTH
}

struct Lotto {
    uint256 id;
    address creator;
    uint256 numberOfWinners;
    uint256[] winnersShares;
    uint256 startTime;
    uint256 endTime;
    uint256 maxNumberOfPlayers;
    uint256 betAmount;
    WinningType winningType;

    bool isFinished;
    uint256 stakes;
    address[] players;
    address winner;
}

struct Pot {
    Lotto lotto;
    uint256 potAmount;
    uint256[] winningNumbers;
    PotGuessType potGuessType;
}