const fs = require('fs');
const path = require('path');

const files = [
    'app/checkout/page.tsx',
    'app/waiter/login/page.tsx',
    'app/waiter/page.tsx',
    'app/waiter/new-order/page.tsx',
    'app/waiter/order/[code]/page.tsx',
    'app/waiter/layout.tsx',
    'app/wallet/deposit/page.tsx',
    'app/wallet/cards/page.tsx',
    'app/page.tsx',
    'app/orders/page.tsx',
    'app/admin/team/page.tsx',
    'app/admin/settings/page.tsx',
    'app/admin/simulator/page.tsx',
    'app/admin/page.tsx',
    'app/admin/products/page.tsx',
    'app/admin/orders/page.tsx',
    'app/admin/layout.tsx',
    'app/admin/login/page.tsx',
    'app/admin/customers/page.tsx'
];

files.forEach(fileRel => {
    const filePath = path.join(__dirname, fileRel);
    if (!fs.existsSync(filePath)) {
        console.log(`Skipping missing file: ${fileRel}`);
        return;
    }

    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;

    // Replace single quoted strings: 'http://localhost:3001...' -> `${process.env.NEXT_PUBLIC_API_URL}...`
    content = content.replace(/'http:\/\/localhost:3001(.*?)'/g, (match, p1) => {
        return "`" + "${process.env.NEXT_PUBLIC_API_URL}" + p1 + "`";
    });

    // Replace template strings: `http://localhost:3001...` -> `${process.env.NEXT_PUBLIC_API_URL}...`
    content = content.replace(/`http:\/\/localhost:3001(.*?)`/g, (match, p1) => {
        return "`" + "${process.env.NEXT_PUBLIC_API_URL}" + p1 + "`";
    });

    if (content !== original) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Updated: ${fileRel}`);
    } else {
        console.log(`No changes needed: ${fileRel}`);
    }
});
