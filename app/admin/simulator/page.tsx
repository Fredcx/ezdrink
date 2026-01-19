"use client";

import { useState } from "react";
import { Zap, CheckCircle, AlertCircle } from "lucide-react";

export default function WebhookSimulator() {
    const [orderId, setOrderId] = useState("");
    const [email, setEmail] = useState("");
    const [amount, setAmount] = useState("50");
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<any>(null);

    const handleSimulate = async () => {
        setLoading(true);
        setResult(null);

        try {
            // Mock Pagar.me Payload
            const payload = {
                type: "order.paid",
                data: {
                    id: orderId || `or_${Date.now()}`,
                    code: "SIMULATED",
                    amount: parseFloat(amount) * 100, // Cents
                    status: "paid",
                    items: [
                        { description: "Adição de Saldo", quantity: 1, amount: parseFloat(amount) * 100 }
                    ],
                    customer: {
                        name: "Simulated User",
                        email: email
                    }
                }
            };

            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/webhook/pagarme`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const data = await res.json();
            setResult({ success: res.ok, data });

        } catch (error: any) {
            setResult({ success: false, error: error.message });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-xl mx-auto p-6">
            <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <Zap className="text-yellow-500" />
                Simulador de Webhook (Pix)
            </h1>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-4">
                <div className="p-4 bg-blue-50 text-blue-700 rounded-xl text-sm mb-4">
                    Use isto para simular o pagamento de um Pix em localhost.
                    O Pagar.me real não consegue chamar seu localhost, então "fingimos" que ele chamou.
                </div>

                <div>
                    <label className="block text-xs font-bold text-gray-400 mb-1">EMAIL DO USUÁRIO</label>
                    <input
                        type="email"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        placeholder="Ex: cliente@email.com"
                        className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 font-bold outline-none focus:border-primary"
                    />
                </div>

                <div>
                    <label className="block text-xs font-bold text-gray-400 mb-1">VALOR (R$)</label>
                    <input
                        type="number"
                        value={amount}
                        onChange={e => setAmount(e.target.value)}
                        className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 font-bold outline-none focus:border-primary"
                    />
                </div>

                <div>
                    <label className="block text-xs font-bold text-gray-400 mb-1">ID DO PEDIDO (OPCIONAL)</label>
                    <input
                        type="text"
                        value={orderId}
                        onChange={e => setOrderId(e.target.value)}
                        placeholder="or_..."
                        className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 font-bold outline-none focus:border-primary"
                    />
                </div>

                <button
                    onClick={handleSimulate}
                    disabled={loading || !email}
                    className="w-full bg-black text-white font-bold py-4 rounded-xl hover:bg-gray-800 transition-all disabled:opacity-50"
                >
                    {loading ? "Enviando..." : "Simular Pagamento Aprovado"}
                </button>

                {result && (
                    <div className={`p-4 rounded-xl flex items-start gap-3 ${result.success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                        {result.success ? <CheckCircle className="w-5 h-5 shrink-0" /> : <AlertCircle className="w-5 h-5 shrink-0" />}
                        <div>
                            <p className="font-bold">{result.success ? "Webhook Enviado!" : "Erro ao enviar"}</p>
                            <pre className="text-xs mt-1 overflow-x-auto max-w-[300px]">
                                {JSON.stringify(result.data || result.error, null, 2)}
                            </pre>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
