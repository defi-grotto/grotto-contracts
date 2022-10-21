import { ethers } from "hardhat";

const main =async () => {
    const grotto = await ethers.getContractAt("Grotto", "0x536Fe7b6Ed2FAd6219Db01931655283933068490");
    const tx = await grotto.withdraw();
    const reciept = await tx.wait();
    console.log(reciept);
}

main().then(() => {
    console.log("------------------------------------------------------------------------------------")
    console.log("Se Fini");
});