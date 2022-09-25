import { ethers } from "hardhat";

const main =async () => {
    const grotto = await ethers.getContractAt("Grotto", "0x1b53982823b4A0D66B3b3e2E6ed8767f2F2F2967");
    const tx = await grotto.withdraw();
    const reciept = await tx.wait();
    console.log(reciept);
}

main().then(() => {
    console.log("------------------------------------------------------------------------------------")
    console.log("Se Fini");
});