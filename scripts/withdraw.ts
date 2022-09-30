import { ethers } from "hardhat";

const main =async () => {
    const grotto = await ethers.getContractAt("Grotto", "0x5e766Cd76e90979C9a6093E1cFb61A259995B693");
    const tx = await grotto.withdraw();
    const reciept = await tx.wait();
    console.log(reciept);
}

main().then(() => {
    console.log("------------------------------------------------------------------------------------")
    console.log("Se Fini");
});