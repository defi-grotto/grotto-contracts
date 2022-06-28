import { ethers } from "hardhat";

const main = async () => {
  try {
    const reader = await ethers.getContractAt(
      "Reader",
      "0xf6050f8aa1030Bb3eC7FcC153b3613Df9F41BEaB"
    );
    const pots = await reader.getSingleWinnerPotsPaginated(1, 12);
    console.log(pots.length);
    console.log(pots[0].lotto);
  } catch (error) {
    console.log(error);
  }
};

main().then(() => {
  console.log("Se Fini");
});
