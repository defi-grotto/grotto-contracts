import { ethers, upgrades } from "hardhat";

const main = async () => {
  console.log(new Date());
  const Reader = await ethers.getContractFactory("Reader");


  const reader = await Reader.deploy(
    "0x6022004045Aaa254094AC8006e8EC87215278F96",
    "0x2577B53a058662EAECbf73Eb6560d96811d324e1",
    "0x936eF0D2f09b36d2f5C4f12C4BC46CFC5CCe05c5",
    ""
  );

  console.log(`Reader Deployed to ${reader.address}`);
};

main().then(() => {
  console.log("------------------------------------------------------------------------------------")
});
