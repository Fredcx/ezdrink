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
            const role = json.user ? json.user.establishment_role : null;
            console.log(`ROLE: '${role}'`);
            console.log(`LENGTH: ${role ? role.length : 0}`);
            if (role) {
                console.log(`CHARS: ${role.split('').map(c => c.charCodeAt(0)).join(',')}`);
            }
        } catch (e) { console.log(e); }
    });
});

req.write(data);
req.end();
