// Native fetch in Node 18+

const BASE_URL = 'http://localhost:3001'; // Make sure backend is running on 3001

async function testDashboard() {
    console.log("1. Logging in as Admin...");

    // Login with the admin account we know (from previous sessions or standard one)
    const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            email: 'admin@ezdrink.com',
            password: 'admin' // Assuming default or what was set?
            // If password fails, I might need to create a new admin or check DB. 
            // Wait, previous session user said he logged in. So credentials exist.
            // I'll try 'admin' or '123456' or whatever was in create_admin.js
        })
    });

    const loginData = await loginRes.json();

    if (!loginRes.ok) {
        console.error("Login Failed:", loginData);
        return;
    }

    console.log("Login Success! Token:", loginData.token.substring(0, 20) + "...");
    const token = loginData.token;

    console.log("\n2. Fetching Dashboard Stats...");
    const statsRes = await fetch(`${BASE_URL}/api/admin/dashboard-stats`, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });

    if (statsRes.ok) {
        const stats = await statsRes.json();
        console.log("Stats Response:", JSON.stringify(stats, null, 2));
    } else {
        console.error("Stats Failed:", statsRes.status, await statsRes.text());
    }

    console.log("\n3. Fetching Orders directly...");
    const ordersRes = await fetch(`${BASE_URL}/api/orders`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    if (ordersRes.ok) {
        const orders = await ordersRes.json();
        console.log(`Orders Count: ${orders.length}`);
        if (orders.length > 0) console.log("First Order Sample:", orders[0]);
    } else {
        console.error("Orders Fetch Failed:", ordersRes.status);
    }
}

testDashboard();
