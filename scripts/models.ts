import { BigNumber } from "@ethersproject/bignumber";

export enum WinningType {
  TIME_BASED,
  NUMBER_OF_PLAYERS,
}

export interface Lotto {
  id: number;
  creator: string;
  numberOfWinners: number;
  winnersShares: number[];
  startTime: number;
  endTime: number;
  numberOfPlayers: number;
  betAmount: number;
  winningType: WinningType;
}