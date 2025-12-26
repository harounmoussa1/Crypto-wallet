
async function check() {
    const address = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";
    console.log(`Checking balance for ${address} on NovaLink (8546)...`);

    try {
        const response = await fetch("http://127.0.0.1:8546", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                jsonrpc: "2.0",
                method: "eth_getBalance",
                params: [address.toLowerCase(), "latest"],
                id: 1
            })
        });

        const data = await response.json();
        console.log("Raw Response:", JSON.stringify(data));

        if (data.result) {
            const wei = BigInt(data.result);
            console.log(`Balance (Wei): ${wei}`);
            console.log(`Balance (ETH): ${Number(wei) / 1e18}`);
        }
    } catch (e) {
        console.error("Error:", e);
    }
}

check();
