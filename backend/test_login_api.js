const http = require('http');

const data = JSON.stringify({
    email: 'garcom.teste.1234',
    password: 'any'
});

const options = {
    hostname: 'localhost',
    port: 3001,
    path: '/api/auth/login',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
    }
};

const req = http.request(options, (res) => {
    let body = '';
    res.on('data', (chunk) => body += chunk);
    res.on('end', () => {
        try {
            const json = JSON.parse(body);
            console.log("ROLE:", json.user ? json.user.establishment_role : 'NO USER');
            console.log("FULL USER:", JSON.stringify(json.user));
        } catch (e) {
            console.log(body);
        }
    });
});

req.on('error', (error) => {
    console.error(error);
});

req.write(data);
req.end();
