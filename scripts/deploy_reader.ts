import { ethers, upgrades } from "hardhat";

const main = async () => {
    console.log(new Date());
    const Reader = await ethers.getContractFactory("Reader");

    const STORAGE_ADDRESS="0x1D73Ef4d0a8DF200B89357faaAedaD4B2D38d541"
    const LOTTO_ADDRESS="0x391e02Ed223771cdd68c9a7D8cAe044f77d38D10"
    const POT_ADDRESS="0xE6Cf8bd710a9a9aE60124eAe20325Ee194675c4e"
    const SW_POT_ADDRESS="0x07995335aDEc0AFbFCcEd1383Dc257e7A83823A6"
    
    const reader = await Reader.deploy(LOTTO_ADDRESS, POT_ADDRESS, SW_POT_ADDRESS, STORAGE_ADDRESS);

    console.log(`Reader Deployed to ${reader.address}`);
};

main().then(() => {
    console.log(
        "------------------------------------------------------------------------------------",
    );
});
