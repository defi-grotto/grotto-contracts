import { ethers, upgrades } from "hardhat";

const main = async () => {
  const Grotto = await ethers.getContractFactory("Grotto");

  const LottoController = await ethers.getContractFactory("LottoController");
  const lottoController = await upgrades.deployProxy(LottoController);
  console.log(`LottoController Deployed to ${lottoController.address}`);

  const PotController = await ethers.getContractFactory("PotController");
  const potController = await upgrades.deployProxy(PotController);
  console.log(`PotController Deployed to ${potController.address}`);

  const grotto = await upgrades.deployProxy(Grotto, [
    lottoController.address,
    potController.address,
  ]);

  console.log(`Grotto Deployed to ${grotto.address}`);

  await lottoController.grantLottoCreator(grotto.address);
  await lottoController.grantLottoPlayer(grotto.address);
  await lottoController.grantAdmin(grotto.address);

  await potController.grantLottoCreator(grotto.address);
  await potController.grantLottoPlayer(grotto.address);
  await potController.grantAdmin(grotto.address);
};

main().then(() => {
  console.log(new Date());
});
