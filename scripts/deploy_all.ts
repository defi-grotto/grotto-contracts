import { ethers, upgrades } from "hardhat";

const main = async () => {
  const Grotto = await ethers.getContractFactory("Grotto");

  const Storage = await ethers.getContractFactory("Storage");
  const storageController = await Storage.deploy();
  await storageController.deployed();

  const LottoController = await ethers.getContractFactory("LottoController");
  const lottoController = await LottoController.deploy(
    storageController.address
  );
  console.log(`LottoController Deployed to ${lottoController.address}`);

  const PotController = await ethers.getContractFactory("PotController");
  const potController = await PotController.deploy(storageController.address);
  console.log(`PotController Deployed to ${potController.address}`);

  const SingleWinnerPotController = await ethers.getContractFactory(
    "SingleWinnerPotController"
  );
  const swPotController = await SingleWinnerPotController.deploy(
    storageController.address
  );
  console.log(
    `SingleWinnerPotController Deployed to ${swPotController.address}`
  );

  const grotto = await Grotto.deploy(
    lottoController.address,
    potController.address,
    swPotController.address,
    storageController.address
  );

  console.log(`Grotto Deployed to ${grotto.address}`);

  await lottoController.grantLottoCreator(grotto.address);
  await lottoController.grantLottoPlayer(grotto.address);
  await lottoController.grantAdmin(grotto.address);

  await potController.grantLottoCreator(grotto.address);
  await potController.grantLottoPlayer(grotto.address);
  await potController.grantAdmin(grotto.address);

  await swPotController.grantLottoCreator(grotto.address);
  await swPotController.grantLottoPlayer(grotto.address);
  await swPotController.grantAdmin(grotto.address);  

  await storageController.grantAdminRole(lottoController.address);
  await storageController.grantAdminRole(potController.address);
  await storageController.grantAdminRole(swPotController.address);  
};

main().then(() => {
  console.log(new Date());
});
