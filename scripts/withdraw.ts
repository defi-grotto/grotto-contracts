import { ethers } from "hardhat";

const main =async () => {
    const grotto = await ethers.getContractAt("Grotto", "0x8153Bf7D9A04fd9F674d0052eE133b0635260C15");
    const tx = await grotto.withdraw();
    const reciept = await tx.wait();
    console.log(reciept);
}

main().then(() => {
    console.log("------------------------------------------------------------------------------------")
    console.log("Se Fini");
});