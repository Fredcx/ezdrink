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
    'app/admin/customers/page.tsx',
    'app/login/page.tsx' // Added Login page explicitly
];

files.forEach(fileRel => {
    const filePath = path.join(__dirname, fileRel);
    if (!fs.existsSync(filePath)) {
        console.log(`Skipping: ${fileRel}`);
        return;
    }

    let content = fs.readFileSync(filePath, 'utf8');
    const original = content;

    // Pattern: ${process.env.NEXT_PUBLIC_API_URL}
    // Replacement: ${(process.env.NEXT_PUBLIC_API_URL || '').replace(/\/$/, '')}

    // We search for the exact string used in previous fix
    content = content.split('${process.env.NEXT_PUBLIC_API_URL}').join('${(process.env.NEXT_PUBLIC_API_URL || "").replace(/\\/$/, "")}');

    if (content !== original) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Sanitized: ${fileRel}`);
    } else {
        console.log(`No match: ${fileRel}`);
    }
});
