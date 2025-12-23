import { ethers } from "ethers";
import fs from "fs";

const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");
const PRIVATE_KEY = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
const wallet = new ethers.Wallet(PRIVATE_KEY, provider);

const artifact = JSON.parse(
    fs.readFileSync("./artifacts/contracts/CurrencyToken.sol/CurrencyToken.json", "utf8")
);

async function main() {
    const existingAddresses = [
        "0x8464135c8F25Da09e49BC8782676a84730C318bC",
        "0x71C95911E9a5D330f4D621842EC243EE1343292e",
        "0x5FbDB2315678afecb367f032d93F642f64180aa3"
    ];

    console.log("🔍 Checking existing contracts...\n");

    const contracts = [];
    for (const addr of existingAddresses) {
        const contract = new ethers.Contract(addr, artifact.abi, wallet);
        try {
            const name = await contract.name();
            const symbol = await contract.symbol();
            console.log(`${symbol}: ${addr} (${name})`);
            contracts.push({ symbol, address: addr, name });
        } catch (e) {
            console.log(`${addr}: Not a valid token`);
        }
    }

    console.log("\n📄 Deploying missing contracts...\n");
    const Factory = new ethers.ContractFactory(artifact.abi, artifact.bytecode, wallet);

    const neededTokens = [
        { name: "US Dollar", symbol: "USD" },
        { name: "Jordanian Dinar", symbol: "JOD" },
        { name: "Israeli Shekel", symbol: "ILS" },
        { name: "Web3 World", symbol: "WWW" }
    ];

    for (const token of neededTokens) {
        const existing = contracts.find(c => c.symbol === token.symbol);
        if (existing) {
            console.log(`✅ ${token.symbol} already deployed at ${existing.address}`);
        } else {
            console.log(`🚀 Deploying ${token.symbol}...`);
            const deployed = await Factory.deploy(token.name, token.symbol);
            await deployed.waitForDeployment();
            const address = await deployed.getAddress();
            console.log(`✅ ${token.symbol} deployed at ${address}`);
            contracts.push({ symbol: token.symbol, address, name: token.name });
        }
    }

    const getSorted = (symbol) => contracts.find(c => c.symbol === symbol).address;

    const envContent = `PORT=8008
CONTRACT_ADDRESS_USD=${getSorted("USD")}
CONTRACT_ADDRESS_JOD=${getSorted("JOD")}
CONTRACT_ADDRESS_ILS=${getSorted("ILS")}
CONTRACT_ADDRESS_WWW=${getSorted("WWW")}
ADMIN_ACCOUNT=${wallet.address}
PRIVATE_KEY=${PRIVATE_KEY.slice(2)}
APILAYER_KEY=etPUpeefgqHQuc3iiKIWiZntbQzwMQRE
ETHERSCAN_KEY=
JWT_SECRET=ethsecretkey
ETHEREUM_NETWORK=http://127.0.0.1:8545
`;

    fs.writeFileSync("../nodejs_api/.env", envContent);
    console.log("\n✅ Updated ../nodejs_api/.env\n");
    console.log("🎉 All contracts ready! Restart nodejs_api backend.\n");
}

main().catch(console.error);
