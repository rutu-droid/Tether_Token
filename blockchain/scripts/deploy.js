const { ethers } = require('ethers');
const fs = require('fs');
require('dotenv').config();

const TetherTokenJson = JSON.parse(fs.readFileSync("C:\\Users\\SAI\\Desktop\\USDT\\blockchain\\artifacts\\contracts\\TetherToken.sol\\TetherToken.json", "utf8"));
const TetherTokenABI = TetherTokenJson.abi;
const TetherTokenBytecode = TetherTokenJson.bytecode;

async function main() {
    const provider = new ethers.providers.JsonRpcProvider(process.env.API_URL);
    const wallet = new ethers.Wallet(process.env.PPRIVATE_KEY , provider);
    const signer = wallet.connect(provider);
    console.log(`Deploying contracts with the account: ${signer.address}`);

    // Deploy the nft contract using the provided abi and bytecode
    const TetherTokenFactory = new ethers.ContractFactory(TetherTokenABI, TetherTokenBytecode, signer);
    const TetherTokenContract =await TetherTokenFactory.deploy(1000000, "TetherToken", "USDT");

    await TetherTokenContract.deployed();
    console.log('TetherToken deployed to:', TetherTokenContract.address);
}

// Run the deployment
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
