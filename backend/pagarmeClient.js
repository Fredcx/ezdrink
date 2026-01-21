// HARDCODED DEBUG KEY - To prove Vercel Env Var issue
const API_KEY = 'sk_7b094b5f14074ac49278557acf6ccf1c';
// const API_KEY = (process.env.PAGARME_API_KEY || '').trim();
const BASE_URL = 'https://api.pagar.me/core/v5';

console.log("Pagar.me Client Initialized (Fetch Version). Key Length:", API_KEY.length, "Prefix:", API_KEY.substring(0, 4));

/**
 * Helper for Base64 encoding in Node.js
 */
const getAuthHeader = () => {
    return `Basic ${Buffer.from(API_KEY + ':').toString('base64')}`;
};

/**
 * Formats amount to cents (integer)
 */
function toCents(amount) {
    return Math.round(amount * 100);
}

function generateCPF() {
    const rnd = (n) => Math.round(Math.random() * n);
    const mod = (base, div) => Math.round(base - Math.floor(base / div) * div);
    const n = Array(9).fill(0).map(() => rnd(9));

    let d1 = n.reduce((total, num, i) => total + (num * (10 - i)), 0);
    d1 = 11 - mod(d1, 11);
    if (d1 >= 10) d1 = 0;

    let d2 = n.reduce((total, num, i) => total + (num * (11 - i)), 0) + (d1 * 2);
    d2 = 11 - mod(d2, 11);
    if (d2 >= 10) d2 = 0;

    return `${n.join('')}${d1}${d2}`;
}

/**
 * Native Fetch Wrapper for Pagar.me
 */
async function pagarmeFetch(endpoint, method = 'GET', body = null) {
    const url = `${BASE_URL}${endpoint}`;
    const headers = {
        'Authorization': getAuthHeader(),
        'Content-Type': 'application/json',
        'User-Agent': 'EzDrink/1.0' // Explicit UA sometimes helps
    };

    const config = {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined
    };

    console.log(`[Pagarme] ${method} ${url}`);

    const res = await fetch(url, config);

    // Handle non-2xx responses
    if (!res.ok) {
        const errorText = await res.text();
        let errorData;
        try {
            errorData = JSON.parse(errorText);
        } catch (e) {
            errorData = { message: errorText };
        }

        console.error('Pagar.me Error:', JSON.stringify(errorData, null, 2));

        const msg = errorData.message || 'Erro Pagar.me';
        const details = errorData.errors ? JSON.stringify(errorData.errors) : '';
        throw new Error(`${msg} ${details}`);
    }

    return await res.json();
}

const PagarmeClient = {
    /**
     * Create a new order (Pixel or Card)
     */
    async createOrder(data) {
        try {
            const {
                amount,
                customer,
                items,
                payment_method, // 'credit_card' or 'pix'
                card_token,
                card_id,
            } = data;

            // Generate fallback CPF if needed
            const finalCpf = (customer && customer.document && customer.document.length > 5)
                ? customer.document
                : ((data.card_raw && data.card_raw.cpf) ? data.card_raw.cpf : generateCPF());

            const payload = {
                customer: {
                    name: customer.name,
                    email: customer.email || `test_${Date.now()}@ezdrink.com`,
                    type: 'individual',
                    document: finalCpf,
                    phones: {
                        mobile_phone: {
                            country_code: '55',
                            area_code: '11',
                            number: '999999999'
                        }
                    }
                },
                shipping: {
                    amount: 0,
                    description: 'EzDrink Delivery',
                    recipient_name: customer.name,
                    recipient_phone: '5511999999999',
                    address: {
                        line_1: 'Rua de Teste, 123',
                        zip_code: '01001000',
                        city: 'São Paulo',
                        state: 'SP',
                        country: 'BR'
                    }
                },
                billing: {
                    name: 'Billing Address',
                    address: {
                        line_1: 'Rua de Teste, 123',
                        zip_code: '01001000',
                        city: 'São Paulo',
                        state: 'SP',
                        country: 'BR'
                    }
                },
                items: items.map(item => ({
                    amount: toCents(item.unit_price),
                    description: item.name,
                    quantity: item.quantity,
                    code: String(item.id)
                })),
                payments: [{
                    payment_method: payment_method,
                    amount: toCents(amount),
                }]
            };

            // Use real billing/shipping if available
            if (data.card_raw && data.card_raw.billing) {
                payload.billing = {
                    name: 'Billing Address',
                    address: data.card_raw.billing
                };
                payload.shipping.address = data.card_raw.billing;
            }

            // Handle Payment Specifics
            if (payment_method === 'credit_card') {
                const cardPayment = {
                    installments: 1, // Default to 1
                    statement_descriptor: 'EZFEST',
                };

                if (card_id) {
                    cardPayment.card_id = card_id;
                } else if (card_token) {
                    cardPayment.card_token = card_token;
                } else if (data.card_raw) {
                    const billingAddress = (data.card_raw.billing) ? data.card_raw.billing : {
                        line_1: 'Rua de Teste, 123',
                        zip_code: '01001000',
                        city: 'São Paulo',
                        state: 'SP',
                        country: 'BR'
                    };

                    cardPayment.card = {
                        number: data.card_raw.number,
                        holder_name: data.card_raw.name,
                        exp_month: data.card_raw.expiry.split('/')[0],
                        exp_year: '20' + data.card_raw.expiry.split('/')[1],
                        cvv: data.card_raw.cvv,
                        billing_address: billingAddress
                    };
                    cardPayment.billing_address = billingAddress;
                }

                payload.payments[0].credit_card = cardPayment;

            } else if (payment_method === 'pix') {
                payload.payments[0].pix = {
                    expires_in: 3600, // 1 hour
                };
            }

            // Execute Request
            return await pagarmeFetch('/orders', 'POST', payload);

        } catch (error) {
            console.error('Create Order Error:', error.message);
            throw error;
        }
    },

    /**
     * Find or Create a Customer in Pagar.me
     */
    async findOrCreateCustomer(name, email, document, phones) {
        try {
            // 1. Try to find by email
            const searchRes = await pagarmeFetch(`/customers?email=${encodeURIComponent(email)}`, 'GET');

            if (searchRes.data && searchRes.data.length > 0) {
                return searchRes.data[0];
            }

            // 2. If not found, create new
            const payload = {
                name: name,
                email: email,
                document: document,
                type: 'individual',
                phones: {
                    mobile_phone: {
                        country_code: '55',
                        area_code: '11',
                        number: '999999999'
                    }
                }
            };
            return await pagarmeFetch('/customers', 'POST', payload);

        } catch (error) {
            console.error("Error finding/creating customer:", error.message);
            // If creation fails because it exists, we might need better handling
            throw error;
        }
    },

    /**
     * Save Card to Pagar.me
     */
    async saveCard(cardData) {
        try {
            const finalDoc = cardData.holder_document || generateCPF();
            const finalAddr = cardData.billing_address || {
                line_1: 'Address Fallback',
                zip_code: '01001000',
                city: 'São Paulo',
                state: 'SP',
                country: 'BR'
            };

            const email = cardData.email || `guest_${Date.now()}@ezdrink.com`;

            // 1. Get Customer ID
            const customer = await this.findOrCreateCustomer(
                cardData.holder_name,
                email,
                finalDoc
            );

            // 2. Create Card
            const payload = {
                number: cardData.number,
                holder_name: cardData.holder_name,
                exp_month: cardData.exp_month,
                exp_year: cardData.exp_year,
                cvv: cardData.cvv,
                billing_address: finalAddr
            };

            return await pagarmeFetch(`/customers/${customer.id}/cards`, 'POST', payload);

        } catch (error) {
            console.error('Save Card Error:', error.message);
            throw error;
        }
    }
};

module.exports = PagarmeClient;
