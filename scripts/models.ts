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
  startTime: number;
  endTime: number;
  maxNumberOfPlayers: number;
  betAmount: BigNumber;
  winningType: WinningType;
  isFinished: boolean;
  stakes: BigNumber;
  players: string[];
  winner: string;  
  winning: number;
}

export interface Pot {
  lotto: Lotto;
  potAmount: BigNumber;
  winningNumbers: number[];
  potGuessType: PotGuessType;
}

export const platformOwner = "0xac706cE8A9BF27Afecf080fB298d0ee13cfb978A";