"use client";

import { useState, useEffect } from "react";
import { QrCode, PlusCircle, Clock, CheckCircle2, ChevronRight, LogOut, Search } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

import { useAuth } from "@/context/AuthContext";

export default function WaiterDashboard() {
    const router = useRouter();
    const { isAuthenticated, isLoading: isAuthLoading } = useAuth(); // Global Auth

    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [waiterName, setWaiterName] = useState("Equipe");

    useEffect(() => {
        // Protect Route
        if (!isAuthLoading && !isAuthenticated) {
            router.push('/login'); // Or specific waiter login if needed
        } else if (isAuthenticated) {
            // In real app, decode token to get name
            setWaiterName("Garçom");
            fetchMyValidations();
        }
    }, [isAuthLoading, isAuthenticated, router]);

    // Strict Loading State: Don't render dashboard until auth is confirmed
    if (isAuthLoading || !isAuthenticated) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    const fetchMyValidations = async () => {
        try {
            // This endpoint needs to be created or mocked
            // For now, fetching all orders and filtering locally as a mockup
            const res = await fetch(`${(process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "")}/api/orders`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('ezdrink_token') || ''}` }
            });
            const data = await res.json();
            if (Array.isArray(data)) {
                // Filter only completed orders for the history list
                const completedOrders = data.filter((o: any) => o.status === 'completed' || o.status === 'entregue').slice(0, 15);
                setOrders(completedOrders);
            }
        } catch (error) {
            console.error("Failed", error);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('ezdrink_token');
        router.push('/waiter/login');
    };

    return (
        <div className="min-h-screen bg-[#f4f4f5] pb-20">
            {/* Header */}
            <header className="bg-white px-6 pt-12 pb-6 rounded-b-[40px] shadow-sm mb-6">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <p className="text-zinc-400 text-xs font-bold tracking-widest uppercase">ÁREA DA EQUIPE</p>
                        <h1 className="text-2xl font-black text-gray-900">Olá, {waiterName} 👋</h1>
                    </div>
                    <button onClick={handleLogout} className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-500">
                        <LogOut className="w-5 h-5" />
                    </button>
                </div>

                {/* Main Actions */}
                <div className="grid grid-cols-2 gap-4">
                    <Link href="/waiter/scan" className="bg-black text-white p-5 rounded-3xl flex flex-col items-center justify-center gap-3 shadow-lg shadow-black/20 active:scale-95 transition-transform">
                        <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-black">
                            <QrCode className="w-6 h-6" />
                        </div>
                        <span className="font-bold text-sm">Ler Ticket</span>
                    </Link>

                    <Link href="/waiter/new-order" className="bg-white text-gray-900 border border-gray-100 p-5 rounded-3xl flex flex-col items-center justify-center gap-3 shadow-sm active:scale-95 transition-transform">
                        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center text-green-600">
                            <PlusCircle className="w-6 h-6" />
                        </div>
                        <span className="font-bold text-sm">Venda Direta</span>
                    </Link>
                </div>
            </header>

            {/* Recent Validations */}
            <div className="px-6">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="font-bold text-gray-900">Últimas Entregas</h2>
                    <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-1 rounded-lg">{orders.length} hoje</span>
                </div>

                <div className="space-y-4">
                    {loading ? (
                        <div className="text-center py-10 text-gray-400 text-sm animate-pulse">Carregando histórico...</div>
                    ) : orders.length === 0 ? (
                        <div className="text-center py-10 bg-white rounded-3xl border border-gray-100">
                            <Clock className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                            <p className="text-gray-400 text-sm font-medium">Nenhuma entrega hoje.</p>
                        </div>
                    ) : (
                        orders.map((order) => (
                            <div key={order.id} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center text-green-600">
                                        <CheckCircle2 className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-gray-900 text-sm">Pedido #{order.id}</h3>
                                        <p className="text-xs text-gray-400">Ticket: {order.ticket_code}</p>
                                    </div>
                                </div>
                                <span className="text-sm font-black text-gray-900">R$ {order.total_amount?.toFixed(2)}</span>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
