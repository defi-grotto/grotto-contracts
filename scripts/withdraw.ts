import { ethers } from "hardhat";

const main =async () => {
    const grotto = await ethers.getContractAt("Grotto", "0x806186E351E4d54d21b8aB139Ac86382323bB8CA");
    const tx = await grotto.withdraw();
    const reciept = await tx.wait();
    console.log(reciept);
}

main().then(() => {
    console.log("------------------------------------------------------------------------------------")
    console.log("Se Fini");
});