const { ethers } = require("ethers");

async function check() {
    try {
        // NovaLink Address (corrected, removed trailing 'd')
        const addressNVL = "0x0D0c578E33AE428Ed127755AF53f7f051a84dd1";
        // Nexora Address
        const addressNXR = "0x2B29b7D07cFB6a70c6E0F5da835d6818DB8A5363";

        console.log(`Checking accounts...`);
        console.log(`NVL Target: ${addressNVL}`);
        console.log(`NXR Target: ${addressNXR}`);

        const nexoraProvider = new ethers.providers.JsonRpcProvider("http://127.0.0.1:8545");
        const novalinkProvider = new ethers.providers.JsonRpcProvider("http://127.0.0.1:8546");

        // Check NXR on Nexora
        const balNexora = await nexoraProvider.getBalance(addressNXR.toLowerCase());
        console.log(`🟣 Address NXR on Nexora (8545): ${ethers.utils.formatEther(balNexora)} NXR`);

        // Check NVL on NovaLink
        const balNovalink = await novalinkProvider.getBalance(addressNVL.toLowerCase());
        console.log(`🔵 Address NVL on NovaLink (8546): ${ethers.utils.formatEther(balNovalink)} NVL`);

    } catch (error) {
        console.error("ERROR:", error);
    }
}

check();
