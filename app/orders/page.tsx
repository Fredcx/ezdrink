"use client";

import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Maximize2, X, RefreshCw, FileText, AlertCircle } from "lucide-react";
import QRCode from "react-qr-code";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

interface Order {
    id: string;
    ticket_code: string;
    items: string[];
    total: number;
    date: string;
    status: string;
    itemCount: number;
}

export default function OrdersPage() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<'active' | 'completed'>('active');
    const [expandedQr, setExpandedQr] = useState<string | null>(null);
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        try {
            const token = localStorage.getItem('ezdrink_token');
            if (!token) return;

            const res = await fetch(`${(process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "")}/api/orders`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();

            if (Array.isArray(data)) {
                setOrders(data);
            }
        } catch (error) {
            console.error("Erro ao buscar pedidos", error);
        } finally {
            setLoading(false);
        }
    };

    const displayedOrders = orders.filter(o =>
        activeTab === 'active'
            ? (o.status === 'pending_payment' || o.status === 'ready')
            : (o.status === 'completed' || o.status === 'cancelled')
    );

    return (
        <div className="fixed inset-0 bg-primary font-sans flex flex-col justify-end">
            {/* Sheet Container matching Cart Page */}
            <motion.div
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className="bg-[#f8f8f8] w-full h-[calc(100vh-24px)] rounded-t-[40px] shadow-2xl overflow-hidden flex flex-col"
            >

                {/* Header */}
                <header className="px-6 py-6 flex items-center sticky top-0 z-10 bg-[#f8f8f8]/90 backdrop-blur-md">
                    <button
                        onClick={() => router.back()}
                        className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-black/5 transition-colors absolute left-6"
                    >
                        <ArrowLeft className="w-6 h-6 text-black" />
                    </button>
                    <h1 className="text-xl font-bold text-black mx-auto">Meus pedidos</h1>
                </header>

                <main className="flex-1 px-6 pb-20 overflow-y-auto scrollbar-hide">
                    {/* Tabs */}
                    <div className="flex p-1 bg-gray-200 rounded-2xl mb-8 relative">
                        <motion.div
                            className="absolute top-1 bottom-1 bg-white rounded-xl shadow-sm z-0"
                            initial={false}
                            animate={{
                                left: activeTab === 'active' ? '4px' : '50%',
                                width: 'calc(50% - 4px)',
                                x: activeTab === 'active' ? 0 : 0
                            }}
                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        />
                        <button
                            onClick={() => setActiveTab('active')}
                            className={`flex-1 relative z-10 py-3 text-sm font-bold transition-colors ${activeTab === 'active' ? 'text-black' : 'text-gray-500'}`}
                        >
                            Ativos
                        </button>
                        <button
                            onClick={() => setActiveTab('completed')}
                            className={`flex-1 relative z-10 py-3 text-sm font-bold transition-colors ${activeTab === 'completed' ? 'text-black' : 'text-gray-500'}`}
                        >
                            Finalizados
                        </button>
                    </div>

                    {/* List */}
                    <div className="space-y-4">
                        {loading ? (
                            <div className="text-center py-10 text-gray-400">Carregando pedidos...</div>
                        ) : displayedOrders.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 opacity-50">
                                <FileText className="w-16 h-16 mb-4 text-gray-400" />
                                <p className="font-bold text-gray-400 text-lg">Você não possui pedidos {activeTab === 'active' ? 'ativos' : 'finalizados'}.</p>
                            </div>
                        ) : (
                            displayedOrders.map((order) => (
                                <motion.div
                                    key={order.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100"
                                >
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <h3 className="font-bold text-gray-900 text-lg line-clamp-1">{order.items[0]} {order.items.length > 1 && `+ ${order.items.length - 1}...`}</h3>
                                            <div className="flex flex-col gap-1 mt-1">
                                                <p className="text-xs text-gray-400 font-medium">{order.date}</p>
                                                {order.status === 'pending_payment' && (
                                                    <div className="flex items-center gap-1 text-red-500">
                                                        <AlertCircle className="w-3 h-3" />
                                                        <span className="text-xs font-bold">Pagamento pendente</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <span className="block font-bold text-black">R${Number(order.total).toFixed(2).replace('.', ',')}</span>
                                            <span className="text-xs font-mono bg-gray-100 text-gray-600 px-2 py-1 rounded-md mt-1 inline-block">
                                                {order.ticket_code || '---'}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex justify-end">
                                        {activeTab === 'active' ? (
                                            order.status === 'pending_payment' ? (
                                                <button
                                                    onClick={() => router.push('/payment/pix')}
                                                    className="bg-primary text-white px-4 py-2 rounded-xl text-xs font-bold hover:brightness-110 transition-colors shadow-sm"
                                                >
                                                    Ver copia e cola ativo
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={() => setExpandedQr(order.ticket_code)}
                                                    className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-2"
                                                >
                                                    Ver QR CODE
                                                </button>
                                            )
                                        ) : (
                                            <button
                                                className="bg-primary hover:brightness-110 text-white px-4 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-2"
                                            >
                                                <RefreshCw className="w-3 h-3" />
                                                Pedir novamente
                                            </button>
                                        )}
                                    </div>
                                </motion.div>
                            ))
                        )}
                    </div>
                </main>
            </motion.div>

            {/* QR Code Modal */}
            <AnimatePresence>
                {expandedQr && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 bg-white flex flex-col items-center justify-center p-6"
                        onClick={() => setExpandedQr(null)}
                    >
                        <button
                            onClick={() => setExpandedQr(null)}
                            className="absolute top-6 right-6 p-2 bg-gray-100 rounded-full text-black hover:bg-gray-200 transition-colors"
                        >
                            <X className="w-6 h-6" />
                        </button>

                        <h2 className="text-2xl font-bold mb-8">Código de Retirada</h2>

                        <div
                            className="bg-white p-4 rounded-3xl shadow-2xl border border-gray-100 mb-8"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <QRCode
                                value={JSON.stringify({ orderId: expandedQr, timestamp: Date.now() })}
                                size={300}
                                viewBox={`0 0 256 256`}
                                style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                            />
                        </div>
                        <p className="text-gray-500 font-medium text-lg text-center max-w-xs">
                            Mostre este código para retirar seu pedido #{expandedQr}
                        </p>
                    </motion.div>
                )}
            </AnimatePresence>
        </div >
    );
}
