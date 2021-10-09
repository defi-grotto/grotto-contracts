import { Contract } from "@ethersproject/contracts";
import { ethers, waffle } from "hardhat";
import chai from "chai";
import { expect } from "chai";
chai.use(waffle.solidity);
import { Lotto, WinningType } from "../scripts/models";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { BigNumber } from "@ethersproject/bignumber";


const main = async() => {
    const Grotto = await ethers.getContractFactory("Grotto");
    const Storage = await ethers.getContractFactory("Storage");

    const storage = await (await Storage.deploy()).deployed();
    console.log(`Storage Deployed to ${storage.address}`);    

    const grotto = await (await Grotto.deploy(storage.address)).deployed();
    console.log(`Grotto Deployed to ${grotto.address}`);

    const ts = (await grotto.getTime()).toNumber();
    console.log(new Date(ts * 1000));
}

main().then(() => {
    console.log(new Date());
});