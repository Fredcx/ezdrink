"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, AlertCircle, ArrowLeft, PackageCheck, Loader2 } from "lucide-react";
import Link from "next/link";

export default function WaiterOrderPage({ params }: { params: Promise<{ code: string }> }) {
    // Unwrap params using React.use() as per Next.js 15+ or await if async component
    // Since this is a client component, we use the hook pattern if available or just await
    // Actually in Next.js 15 params is a Promise.
    const resolvedParams = use(params);
    const code = resolvedParams.code;

    const router = useRouter();
    const [order, setOrder] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [processing, setProcessing] = useState(false);

    useEffect(() => {
        if (code) fetchOrder();
    }, [code]);

    useEffect(() => {
        // Auto-finalize logic: if order is found and ready/paid, and not already processing
        // We also check if the order is not already 'completed' to avoid re-processing
        if (order && (order.status === 'paid' || order.status === 'ready') && !processing) {
            handleDeliver(order);
        }
    }, [order, processing]);

    const fetchOrder = async () => {
        try {
            // Clean up code if it's JSON/Encoded
            let searchCode = code;
            try {
                // Try decoding first (e.g. %7B%22...)
                const decoded = decodeURIComponent(code);
                // If it looks like JSON object
                if (decoded.trim().startsWith('{')) {
                    const parsed = JSON.parse(decoded);
                    // Extract probable fields
                    searchCode = parsed.orderId || parsed.ticket_code || parsed.code || parsed.id || code;
                }
            } catch (e) {
                console.log("Code parse error, using raw code:", e);
            }

            console.log("Final Search Code:", searchCode);

            const res = await fetch(`${(process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "")}/api/orders`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('ezdrink_token') || ''}` }
            });
            const data = await res.json();

            if (Array.isArray(data)) {
                console.log("Searching for order code:", code);
                console.log("Available orders:", data.map((o: any) => `${o.ticket_code} | ${o.id}`));

                // Loose match for robustness
                const found = data.find((o: any) =>
                    String(o.ticket_code) === String(searchCode) ||
                    String(o.id) === String(searchCode) ||
                    (o.ticket_code && o.ticket_code.endsWith(searchCode)) // Partial match for safety
                );

                if (found) {
                    console.log("Order found:", found);
                    setOrder(found);
                } else {
                    console.error("Order not found in list");
                    setError("Pedido não encontrado.");
                }
            }
        } catch (err) {
            setError("Erro ao buscar pedido.");
        } finally {
            setLoading(false);
        }
    };

    const handleDeliver = async (targetOrder: any = null) => {
        // If targetOrder is an event (has type/preventDefault) or null, fallback to state 'order'
        const orderToProcess = (targetOrder && targetOrder.id) ? targetOrder : order;

        if (!orderToProcess) return;
        // Allows re-confirming if needed, or just guard
        if (orderToProcess.status === 'completed') return;

        setProcessing(true);
        try {
            const res = await fetch(`${(process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "")}/api/orders/${orderToProcess.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('ezdrink_token') || ''}`
                },
                body: JSON.stringify({ status: 'completed' })
            });

            if (res.ok) {
                const updated = await res.json();
                setOrder(updated); // Update local state to show 'completed' UI
            } else {
                console.error("Erro ao atualizar status");
                // Optional: alert user if manual click failed
                if (!targetOrder?.id) alert("Erro ao confirmar entrega.");
            }
        } catch (err) {
            console.error("Erro de conexão", err);
            if (!targetOrder?.id) alert("Erro de conexão.");
        } finally {
            setProcessing(false);
        }
    };

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-400 font-bold">Buscando pedido...</div>;
    }

    if (error || !order) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 text-center">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center text-red-500 mb-4">
                    <AlertCircle className="w-8 h-8" />
                </div>
                <h1 className="text-xl font-black text-gray-900 mb-2">Ops! Algo deu errado.</h1>
                <p className="text-gray-500 mb-8">{error || "Pedido não encontrado."}</p>
                <Link href="/waiter/scan" className="bg-black text-white px-8 py-3 rounded-xl font-bold">
                    Tentar Novamente
                </Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#f4f4f5] pb-20">
            <header className="bg-white p-4 flex items-center gap-4 shadow-sm sticky top-0 z-10">
                <Link href="/waiter/scan" className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                    <ArrowLeft className="w-5 h-5 text-gray-600" />
                </Link>
                <h1 className="font-bold text-lg text-gray-900">Validar Entrega</h1>
            </header>

            <div className="p-6 space-y-6">
                {/* Status Banner */}
                <div className={`p-6 rounded-3xl mb-4 flex flex-col items-center justify-center text-white shadow-lg transition-all
                    ${(order.status === 'paid' || order.status === 'ready') ? 'bg-[#47f15a] shadow-[#47f15a]/30' :
                        order.status === 'completed' ? 'bg-blue-500 shadow-blue-500/30' :
                            'bg-yellow-500 shadow-yellow-500/30'}`}>

                    {(order.status === 'paid' || order.status === 'ready') && <CheckCircle2 className="w-12 h-12" />}
                    {order.status === 'completed' && <PackageCheck className="w-12 h-12" />}
                    {order.status === 'pending_payment' && <AlertCircle className="w-12 h-12" />}

                    <h2 className="text-2xl font-black mt-2">
                        {(order.status === 'paid' || order.status === 'ready') ? 'PAGO / LIBERADO' :
                            order.status === 'completed' ? 'CLIENTE JÁ RECEBEU' :
                                'AGUARDANDO PAGAMENTO'}
                    </h2>
                    <p className="text-sm font-bold opacity-80 mt-1">
                        {(order.status === 'paid' || order.status === 'ready') ? 'Pode entregar os produtos.' :
                            order.status === 'completed' ? 'Este pedido já foi entregue.' :
                                'Não entregue produtos ainda.'}
                    </p>
                </div>

                {/* Ticket Info */}
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <p className="text-xs font-bold text-gray-400">TICKET</p>
                            <h3 className="text-3xl font-black text-gray-900">#{order.ticket_code}</h3>
                        </div>
                        <div className="text-right">
                            <p className="text-xs font-bold text-gray-400">VALOR</p>
                            <h3 className="text-xl font-black text-primary">
                                R$ {(order.total || order.total_amount || 0).toFixed(2)}
                            </h3>
                        </div>
                    </div>

                    <div className="h-px bg-gray-100 mb-6" />

                    <div className="space-y-4">
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Itens do Pedido</p>
                        {order.items && order.items.length > 0 ? (
                            order.items.map((item: any, i: number) => {
                                // Handle string items from JSON "1x Product"
                                let quantity = 1;
                                let name = "Produto";
                                let price = 0;

                                if (typeof item === 'string') {
                                    const match = item.match(/^(\d+)x\s+(.+)$/);
                                    if (match) {
                                        quantity = parseInt(match[1]);
                                        name = match[2];
                                    } else {
                                        name = item;
                                    }
                                } else {
                                    quantity = item.quantity || 1;
                                    name = item.product_name || "Produto";
                                    price = item.price || 0;
                                }

                                return (
                                    <div key={i} className="flex justify-between items-center">
                                        <span className="font-bold text-gray-700">{quantity}x {name}</span>
                                        {price > 0 && <span className="font-bold text-gray-900">R$ {price.toFixed(2)}</span>}
                                    </div>
                                );
                            })
                        ) : (
                            <p className="text-gray-500">Nenhum item encontrado.</p>
                        )}
                    </div>
                </div>

                {/* Actions */}
                {(order.status === 'paid' || order.status === 'ready') && (
                    <button
                        onClick={handleDeliver}
                        disabled={processing}
                        className="w-full bg-black text-white text-xl font-black py-5 rounded-2xl shadow-xl shadow-black/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3"
                    >
                        {processing ? <Loader2 className="w-6 h-6 animate-spin" /> : "CONFIRMAR ENTREGA"}
                    </button>
                )}
                {order.status === 'completed' && (
                    <Link
                        href="/waiter/scan"
                        className="block w-full text-center bg-gray-200 text-gray-600 text-lg font-bold py-4 rounded-2xl"
                    >
                        Voltar para Scanner
                    </Link>
                )}
            </div>
        </div>
    );
}
