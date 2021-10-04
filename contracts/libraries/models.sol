//SPDX-License-Identifier: Unlicense
pragma solidity 0.8.3;

enum WinningType {
    TIME_BASED,
    NUMBER_OF_PLAYERS
}

enum PotGuessType {
    NUMBERS,
    ORDER
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
    uint256[] winnings;

    bool isFinished;
    uint256 stakes;
    address[] players;
    address[] winners;
}

struct Pot {
    Lotto lotto;
    uint256 potAmount;
    uint256[] winningNumbers;
    PotGuessType potGuessType;
}