// Native fetch in Node 18+

const BASE_URL = 'http://localhost:3001';

async function testPix() {
    console.log("1. Logging in as Client/User...");

    // Using existing credentials or creating a temporary user
    // I recall testing with admin@ezdrink.com before for dashboard, 
    // let's try a regular login if known, or just use admin as client for test.
    const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            email: 'admin@ezdrink.com',
            password: 'admin'
        })
    });

    const loginData = await loginRes.json();
    if (!loginRes.ok) {
        console.error("Login Failed:", loginData);
        return;
    }

    const token = loginData.token;
    console.log("Login Success!");

    console.log("\n2. Creating Pix Order...");
    const pixRes = await fetch(`${BASE_URL}/api/orders/create-pix`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
            cart: [
                { id: 1, name: 'Cerveja teste', price: 10.00, quantity: 1 }
            ]
        })
    });

    const pixData = await pixRes.json();
    if (pixRes.ok) {
        console.log("Pix Created Successfully!");
        console.log("QR Code:", pixData.qr_code ? "PRESENT (length: " + pixData.qr_code.length + ")" : "MISSING");
        console.log("Order Total:", pixData.total);
    } else {
        console.error("Pix Creation Failed:", pixRes.status);
        console.error("Error Details:", JSON.stringify(pixData, null, 2));
    }
}

testPix();
