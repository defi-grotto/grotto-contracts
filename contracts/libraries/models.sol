//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.4;

enum WinningType {
    TIME_BASED,
    NUMBER_OF_PLAYERS
}

enum PotGuessType {
    NUMBERS,
    ORDER
}

enum PotType {
    MULTIPLE_WINNER,
    SINGLE_WINNER    
}

struct Lotto {
    uint256 id;    
    uint256 creatorShares;
    uint256 startTime;
    uint256 endTime;
    uint256 maxNumberOfPlayers;
    uint256 winning;
    uint256 stakes;
    uint256 platformShares;
    // how much each player has to bet
    uint256 betAmount;
    WinningType winningType;          
    address creator;
    address winner;
    address[] players;
    Status status;        
}

struct Status {
    bool isPot;
    bool isFinished;  
    bool isClaimed;  
    bool creatorClaimed;
    bool platformClaimed;           
}

struct Pot {
    Lotto lotto;
    // how much the winner will win if they guessed the number right
    uint256 potAmount;
    uint256[] winningNumbers;
    address[] winners;
    uint256 winningsPerWinner;
    PotGuessType potGuessType;
    PotType potType;
}

struct Claim {
    address winner;
    uint256 winning;
}