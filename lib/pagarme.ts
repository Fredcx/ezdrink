
import { format } from 'date-fns';

const PAGARME_API_KEY = process.env.PAGARME_API_KEY;

if (!PAGARME_API_KEY) {
    console.warn("Missing PAGARME_API_KEY environment variable. Payments may fail.");
}

const BASE_URL = 'https://api.pagar.me/core/v5';

// Helper to sanitize CPF/Phone
const cleanStr = (s: string) => s.replace(/\D/g, '');

/**
 * Validates and formats CPF. Throws if invalid/missing in Production.
 */
function getValidDocument(doc: string | undefined): string {
    const clean = cleanStr(doc || '');
    if (!clean || clean.length !== 11) {
        // In production, we MUST have a valid CPF. 
        // For now, we throw error to ensure user provides it.
        throw new Error("CPF inválido ou não informado. É obrigatório para o pagamento.");
    }
    return clean;
}

export async function createPixOrder(customer: any, items: any[], amount: number) {
    // Generate expire at 10 minutes from now
    const expireAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();
    const finalCpf = getValidDocument(customer.cpf || customer.document);

    const payload = {
        items: items.map((item: any) => ({
            code: item.id.toString(),
            description: item.name,
            amount: Math.round(item.price * 100), // cents
            quantity: item.quantity
        })),
        customer: {
            name: customer.name || "Cliente EzDrink",
            email: customer.email || "cliente@ezdrink.com.br",
            type: "individual",
            document: finalCpf,
            phones: {
                mobile_phone: {
                    country_code: "55",
                    area_code: "11",
                    number: "999999999" // TODO: Ask for real phone if Pagar.me rejects this
                }
            }
        },
        payments: [
            {
                payment_method: "pix",
                pix: {
                    expires_at: expireAt,
                    additional_information: [
                        {
                            name: "Pedido EzDrink",
                            value: "Pedido no App"
                        }
                    ]
                },
                amount: Math.round(amount * 100)
            }
        ]
    };

    console.log("Creating Real Pix Order:", JSON.stringify(payload, null, 2));
    return await sendPagarmeRequest(payload);
}

export async function createCardOrder(customer: any, items: any[], amount: number, cardId: string) {
    const finalCpf = getValidDocument(customer.cpf || customer.document);

    const payload = {
        items: items.map((item: any) => ({
            code: item.id.toString(),
            description: item.name,
            amount: Math.round(item.price * 100), // cents
            quantity: item.quantity
        })),
        customer: {
            name: customer.name || "Cliente EzDrink",
            email: customer.email || "cliente@ezdrink.com.br",
            type: "individual",
            document: finalCpf,
            phones: {
                mobile_phone: {
                    country_code: "55",
                    area_code: "11",
                    number: "999999999"
                }
            }
        },
        payments: [
            {
                payment_method: "credit_card",
                credit_card: {
                    installments: 1,
                    statement_descriptor: "EZDRINK APP",
                    card_id: cardId // Use the Token ID saved in Pagar.me
                },
                amount: Math.round(amount * 100)
            }
        ]
    };

    console.log("Creating Real Card Order:", JSON.stringify(payload, null, 2));
    return await sendPagarmeRequest(payload);
}

// Apple Pay (Decrypts token or passes it)
export async function createApplePayOrder(customer: any, items: any[], amount: number, token: string) {
    const finalCpf = getValidDocument(customer.cpf || customer.document);

    const payload = {
        items: items.map((item: any) => ({
            code: item.id.toString(),
            description: item.name,
            amount: Math.round(item.price * 100),
            quantity: item.quantity
        })),
        customer: {
            name: customer.name || "Cliente EzDrink",
            email: customer.email || "cliente@ezdrink.com.br",
            type: "individual",
            document: finalCpf,
            phones: {
                mobile_phone: {
                    country_code: "55",
                    area_code: "11",
                    number: "999999999"
                }
            }
        },
        payments: [
            {
                payment_method: "credit_card",
                credit_card: {
                    installments: 1,
                    statement_descriptor: "EZDRINK APPLE",
                    card_token: token, // Pass the Apple Pay token here
                    // If Pagar.me V5 requires 'wallet' param, it might be added here.
                    // Usually 'card_token' works for raw tokens or network tokens.
                },
                amount: Math.round(amount * 100)
            }
        ]
    };

    console.log("Creating Apple Pay Order:", JSON.stringify(payload, null, 2));
    return await sendPagarmeRequest(payload);
}

async function sendPagarmeRequest(payload: any) {
    try {
        const response = await fetch(`${BASE_URL}/orders`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Basic " + Buffer.from(PAGARME_API_KEY + ":").toString("base64")
            },
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (!response.ok) {
            console.error("Pagar.me API Error:", data);
            const msg = data.message || "Erro no pagamento";
            const details = data.errors ? JSON.stringify(data.errors) : "";
            throw new Error(`${msg} ${details}`);
        }

        return data;
    } catch (error) {
        throw error;
    }
}
