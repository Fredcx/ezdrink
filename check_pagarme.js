const API_KEY = 'sk_7b094b5f14074ac49278557acf6ccf1c';
const BASE_URL = 'https://api.pagar.me/core/v5';

async function testConnection() {
    console.log("Testing Pagar.me Connection (Fetch)...");
    console.log("Key:", API_KEY);

    try {
        const authHeader = `Basic ${Buffer.from(API_KEY + ':').toString('base64')}`;

        console.log("\n1. Testing Authentication (GET /customers)...");
        const res = await fetch(`${BASE_URL}/customers?page_size=1`, {
            method: 'GET',
            headers: {
                'Authorization': authHeader,
                'Content-Type': 'application/json'
            }
        });

        console.log("Status:", res.status);

        if (res.ok) {
            const data = await res.json();
            console.log("✅ Authentication Successful!");
            console.log("Data sample:", data.data ? data.data.length + " customers found" : data);
        } else {
            const errorText = await res.text();
            console.error("\n❌ Authentication FAILED");
            console.error("Status:", res.status);
            console.error("Data:", errorText);
        }

    } catch (error) {
        console.error("\n❌ Request Error");
        console.error("Error:", error.message);
    }
}

testConnection();
