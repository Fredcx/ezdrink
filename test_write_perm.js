const API_KEY = 'sk_7b094b5f14074ac49278557acf6ccf1c';
const BASE_URL = 'https://api.pagar.me/core/v5';

async function testWritePermissions() {
    console.log("Testing Write Permissions (POST)...");

    const authHeader = `Basic ${Buffer.from(API_KEY + ':').toString('base64')}`;

    // Attempt to create a dummy customer - minimal payload
    // If this fails 401, the key is Read-Only or Account is restricted.
    const payload = {
        name: "Test Permissions",
        email: `test_perm_${Date.now()}@ezdrink.com`,
        document: "58066869083", // Valid Generator CPF
        type: "individual",
        phones: {
            mobile_phone: {
                country_code: "55",
                area_code: "11",
                number: "999999999"
            }
        }
    };

    console.log("Sending POST /customers...");

    try {
        const res = await fetch(`${BASE_URL}/customers`, {
            method: 'POST',
            headers: {
                'Authorization': authHeader,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        console.log("Status:", res.status);
        if (res.ok) {
            console.log("✅ SUCCESS! Key has WRITE permissions.");
            const data = await res.json();
            console.log("Created ID:", data.id);
        } else {
            console.error("❌ FAILED!");
            const txt = await res.text();
            console.error("Response:", txt);
        }

    } catch (e) {
        console.error("Network Error:", e.message);
    }
}

testWritePermissions();
