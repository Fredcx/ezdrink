const axios = require('axios');

// API Configuration
// NOTE: Replace keys with real process.env variables in production
// Fallback to test key for debugging
const API_KEY = process.env.PAGARME_API_KEY || 'sk_test_4f70ea1408d1400a90b3341642992d88';
const BASE_URL = 'https://api.pagar.me/core/v5';

const api = axios.create({
    baseURL: BASE_URL,
    headers: {
        'Authorization': `Basic ${Buffer.from(API_KEY + ':').toString('base64')}`,
        'Content-Type': 'application/json',
    }
});

// ... (existing code for toCents and generateCPF) ... 

/**
 * Formats amount to cents (integer)
 * @param {number} amount 
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

const PagarmeClient = {
    /**
     * Create a new order (Pixel or Card)
     * @param {object} data - Order data
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
                save_card = false
            } = data;

            // Generate fallback CPF if needed
            const finalCpf = (data.card_raw && data.card_raw.cpf) ? data.card_raw.cpf : generateCPF();

            const payload = {
                customer: {
                    name: customer.name,
                    email: `test_${Date.now()}@ezdrink.com`,
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
                    // Support raw card data
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

                    // Also set top-level billing address in credit_card object for robust V5 compliance
                    cardPayment.billing_address = billingAddress;
                }

                payload.payments[0].credit_card = cardPayment;

            } else if (payment_method === 'pix') {
                payload.payments[0].pix = {
                    expires_in: 3600, // 1 hour
                };
            }

            console.log("PAYLOAD BEING SENT TO PAGAR.ME:", JSON.stringify(payload, null, 2));

            const response = await api.post('/orders', payload);
            return response.data;

        } catch (error) {
            console.error('Pagar.me Error Full:', JSON.stringify(error.response ? error.response.data : error.message, null, 2));
            const msg = error.response?.data?.message || error.message || 'Erro ao processar pagamento no Pagar.me';
            const details = error.response?.data?.errors ? JSON.stringify(error.response.data.errors) : '';
            throw new Error(`${msg} ${details}`);
        }
    },

    /**
     * Create a customer directly (useful for managing saved cards)
     */
    async createCustomer(data) {
        // Implementation for future robustness
    },

    /**
     * Save Card to Pagar.me (Tokenize)
     * @param {object} cardData - { number, holder_name, exp_month, exp_year, cvv }
     */
    async saveCard(cardData) {
        try {
            const payload = {
                number: cardData.number,
                holder_name: cardData.holder_name,
                exp_month: cardData.exp_month,
                exp_year: cardData.exp_year,
                cvv: cardData.cvv
            };

            const response = await api.post('/cards', payload);
            return response.data; // Should contain 'id' (the token)
        } catch (error) {
            console.error('Pagar.me Save Card Error:', error.response ? error.response.data : error.message);
            // Propagate the real error message!
            const msg = error.response?.data?.message || 'Erro ao salvar cartão no Pagar.me';
            const details = error.response?.data?.errors ? JSON.stringify(error.response.data.errors) : '';
            throw new Error(`${msg} ${details}`);
        }
    }
};

module.exports = PagarmeClient;
