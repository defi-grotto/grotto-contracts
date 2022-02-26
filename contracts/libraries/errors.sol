//SPDX-License-Identifier: Unlicense
pragma solidity 0.8.4;

string constant ERROR_1 = "";
string constant ERROR_2 = "Called setGrotto on Storage with wrong parameters";
string constant ERROR_3 = "Attempt to call Storage method with wrong grotto address";
string constant ERROR_4 = "Lotto with same ID and Creator already exists";
string constant ERROR_5 = "Claimer must be winner";
string constant ERROR_6 = "Start time must be less than end time";
string constant ERROR_7 = "Can not create a lotto with 0 bet amount";
string constant ERROR_8 = "Number of players must be greater than 0";
string constant ERROR_9 = "Result from saveLotto must be true";
string constant ERROR_10 = "End time must be in the future";
string constant ERROR_11 = "Pot betAmount must be greater than 0";
string constant ERROR_12 = "Pot winning numbers must be at least 1";
string constant ERROR_13 = "Result from savePot must be true";
string constant ERROR_14 = "Lotto is not started";
string constant ERROR_15 = "Lotto has reached end time";
string constant ERROR_16 = "Max Number of Players reached";
string constant ERROR_17 = "Lotto is finished";
string constant ERROR_18 = "BetPlaced is too low";
string constant ERROR_19 = "Lotto does not exist";
string constant ERROR_20 = "Result from playLotto is false";
string constant ERROR_21 = "Creator can not play";
string constant ERROR_22 = "Lotto is not finished";
string constant ERROR_23 = "Lotto is already claimed";
string constant ERROR_24 = "Result from playPot is false";
string constant ERROR_25 = "Claim can only be called by winner or creator";
string constant ERROR_26 = "Pot is already Claimed";
string constant ERROR_27 = "Claimer is not a winner";
string constant ERROR_28 = "Winning is zero";
string constant ERROR_29 = "Can not force end lotto";
string constant ERROR_30 = "Only creator can force end time based lotto";
string constant ERROR_31 = "ID Supplied is not a pot id";
string constant ERROR_32 = "ID Supplied is not a lotto id";
string constant ERROR_33 = "Not more than 10 winning numbers per pot";
string constant ERROR_34 = "Creator returns zero";
string constant ERROR_35 = "Owner shares returns zero";
string constant ERROR_36 = "Creator can't claim until at least one winner claimed";
string constant ERROR_37 = "Creator already claimed";