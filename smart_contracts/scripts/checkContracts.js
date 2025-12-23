import { ethers } from "ethers";

const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");

async function main() {
    const blockNumber = await provider.getBlockNumber();
    console.log("Current block:", blockNumber);

    // Check the first several blocks for contract deployments
    for (let i = 0; i <= Math.min(blockNumber, 10); i++) {
        const block = await provider.getBlock(i);
        if (block && block.transactions.length > 0) {
            console.log(`\nBlock ${i}: ${block.transactions.length} transactions`);
            for (const txHash of block.transactions) {
                const tx = await provider.getTransaction(txHash);
                if (tx && tx.to === null) {
                    const receipt = await provider.getTransactionReceipt(txHash);
                    console.log(`  Contract deployed at: ${receipt.contractAddress}`);
                }
            }
        }
    }
}

main().catch(console.error);
