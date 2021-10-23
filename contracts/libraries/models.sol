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
    uint256 startTime;
    uint256 endTime;
    uint256 maxNumberOfPlayers;
    // how much each player has to bet
    uint256 betAmount;
    WinningType winningType;    
    bool isFinished;
    uint256 stakes;
    address[] players;
    uint256 winning;
    address winner;
}

struct Pot {
    Lotto lotto;
    // how much the winner will win if they guessed the number right
    uint256 potAmount;
    uint256[] winningNumbers;
    PotGuessType potGuessType;
}