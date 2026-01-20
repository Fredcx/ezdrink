
import { format } from 'date-fns';

const PAGARME_API_KEY = process.env.PAGARME_API_KEY;

if (!PAGARME_API_KEY) {
    console.warn("Missing PAGARME_API_KEY environment variable. Payments may fail.");
}

export async function createPixOrder(customer: any, items: any[], amount: number) {
    // Generate expire at 10 minutes from now
    const expireAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

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
            document: customer.cpf || "12345678909", // Mock if missing, Pagar.me requires valid cpf in prod
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

    console.log("Creating Pix Order at Pagar.me:", JSON.stringify(payload, null, 2));

    try {
        const response = await fetch("https://api.pagar.me/core/v5/orders", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Basic " + Buffer.from(PAGARME_API_KEY + ":").toString("base64")
            },
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (!response.ok) {
            console.error("Pagar.me Error:", data);
            throw new Error(data.message || "Erro ao criar pedido no Pagar.me");
        }

        return data;
    } catch (error) {
        throw error;
    }
}
