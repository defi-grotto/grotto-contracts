import { BigNumber } from "@ethersproject/bignumber";

export enum WinningType {
  TIME_BASED,
  NUMBER_OF_PLAYERS,
}

export enum PotGuessType {
  NUMBERS,
  ORDER
}


export interface Lotto {
  id: number;
  creator: string;
  numberOfWinners: number;
  winnersShares: number[];
  startTime: number;
  endTime: number;
  maxNumberOfPlayers: number;
  betAmount: BigNumber;
  winningType: WinningType;
  isFinished: boolean;
  stakes: BigNumber;
  players: string[];
  winners: string[];  
  winnings: number[]
}

export interface Pot {
  lotto: Lotto;
  potAmount: BigNumber;
  winningNumbers: number[];
  potGuessType: PotGuessType;
}