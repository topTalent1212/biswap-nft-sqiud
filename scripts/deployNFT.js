//npx hardhat run scripts/deployNFT.js --network mainnetBSC

const { ethers, network, upgrades } = require(`hardhat`);

const fs = require('fs')


//squidBusNFT initialize parameters
const baseURIBusNFT = `https://squid-nft.io/back/metadata/bus/`
const maxBusLevel = 5
const minBusBalance = 2
const maxBusBalance = 5
const busAdditionPeriod = 7 * 3600*24 //7 days

//squidPlayerNFT initialize parameters (string baseURIPlayerNFT, uint128 _seDivide, uint _gracePeriod, bool _enableSeDivide)
const baseURIPlayerNFT = `https://squid-nft.io/back/metadata/player/`
const seDivide = 100 // 1% by game
const gracePeriod =  45*3600*24 //45 days
const enableSeDivide = true //Enabled


let squidBusNFT, squidPlayerNFT


async function getImplementationAddress(proxyAddress) {
    const implHex = await ethers.provider.getStorageAt(
        proxyAddress,
        "0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc"
    );
    return ethers.utils.hexStripZeros(implHex);
}

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log(`Deployer address: ${ deployer.address}`);
    let nonce = await network.provider.send(`eth_getTransactionCount`, [deployer.address, "latest"]) - 1;

    const SquidBusNFT = await ethers.getContractFactory(`SquidBusNFT`);
    const SquidPlayerNFT = await ethers.getContractFactory(`SquidPlayerNFT`);

    console.log(`Start deploying SquidBusNFT contract`);
    squidBusNFT = await upgrades.deployProxy(SquidBusNFT, [baseURIBusNFT, maxBusLevel, minBusBalance, maxBusBalance, busAdditionPeriod], {nonce: ++nonce, gasLimit: 5e6});
    await squidBusNFT.deployed();
    console.log(`squidBusNFT deployed to ${squidBusNFT.address}`);


    console.log(`Start deploying squidPlayerNFT contract`);
    squidPlayerNFT = await upgrades.deployProxy(SquidPlayerNFT, [baseURIPlayerNFT, seDivide, gracePeriod, enableSeDivide], {nonce: ++nonce, gasLimit: 5e6});
    await squidPlayerNFT.deployed();
    console.log(`squidPlayerNFT deployed to ${squidPlayerNFT.address}`);


    const deployedContracts = {
        deployTime:     new Date().toLocaleString(),

        proxy_squidBusNFT:    squidBusNFT.address,
        proxy_squidPlayerNFT: squidPlayerNFT.address,

        imp_squidBusNFT:    await getImplementationAddress(squidBusNFT.address),
        imp_squidPlayerNFT: await getImplementationAddress(squidPlayerNFT.address),
    }
    fs.writeFileSync('deployNFTAddresses.json', JSON.stringify(deployedContracts, null, 4))
    console.log(deployedContracts)
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });