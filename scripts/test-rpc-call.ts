import { ethers } from "ethers";

const main = async () => {
    const provider = new ethers.providers.JsonRpcProvider("https://bsc-dataseed.binance.org/");
    provider
        .send("eth_getTransactionByHash", [
            "0x152b227979189532cb92c5af6f7245b42a4504a9ce5a6b273df5f88bf9f3467d",
        ])
        .then((txObj) => {
            console.log(txObj);
        });
};

main().then(() => {
    console.log("Done");
});
