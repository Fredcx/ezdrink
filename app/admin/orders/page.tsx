"use client";

import { useState, useEffect } from "react";
import { Search, Filter, Eye, CheckCircle, Clock, XCircle } from "lucide-react";
import { motion } from "framer-motion";

interface Order {
    id: number;
    user_email: string;
    total_amount: number;
    status: string;
    ticket_code: string;
    created_at: string;
    items?: any[];
    total?: number;
}

export default function AdminOrdersPage() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");

    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        try {
            const res = await fetch(`${(process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "")}/api/orders`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('ezdrink_token') || ''}` }
            });
            const data = await res.json();
            // Backend returns array of orders
            if (Array.isArray(data)) {
                setOrders(data);
            }
        } catch (error) {
            console.error("Failed to fetch orders", error);
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'completed': return 'bg-green-100 text-green-600';
            case 'paid': return 'bg-green-100 text-green-600';
            case 'pending_payment': return 'bg-yellow-100 text-yellow-600';
            case 'cancelled': return 'bg-red-100 text-red-600';
            default: return 'bg-gray-100 text-gray-600';
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'completed': return 'Concluído';
            case 'paid': return 'Pago';
            case 'pending_payment': return 'Pendente';
            case 'cancelled': return 'Cancelado';
            default: return status;
        }
    };

    const filteredOrders = orders.filter(order => {
        const matchesSearch = order.ticket_code?.includes(searchTerm) || order.user_email?.includes(searchTerm);
        const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    return (
        <div className="max-w-7xl mx-auto">
            <header className="mb-10">
                <h1 className="text-3xl font-black text-gray-900">Pedidos</h1>
                <p className="text-gray-500 font-medium">Acompanhe todas as vendas em tempo real.</p>
            </header>

            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-4 mb-8">
                <div className="flex-1 bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-3">
                    <Search className="w-5 h-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Buscar por código ou email..."
                        className="flex-1 font-medium outline-none text-gray-700 placeholder:text-gray-400"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0">
                    {['all', 'paid', 'pending_payment', 'completed'].map((status) => (
                        <button
                            key={status}
                            onClick={() => setStatusFilter(status)}
                            className={`px-6 py-4 rounded-2xl font-bold whitespace-nowrap transition-all border ${statusFilter === status
                                ? 'bg-black text-white border-black'
                                : 'bg-white text-gray-500 border-gray-100 hover:border-gray-300'
                                }`}
                        >
                            {status === 'all' ? 'Todos' : getStatusLabel(status)}
                        </button>
                    ))}
                </div>
            </div>

            {/* Orders Table */}
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden overflow-x-auto">
                <table className="w-full text-left min-w-[1000px]">
                    <thead className="bg-gray-50 border-b border-gray-100/50">
                        <tr>
                            <th className="p-6 font-bold text-gray-400 text-xs tracking-wider">PEDIDO</th>
                            <th className="p-6 font-bold text-gray-400 text-xs tracking-wider">CLIENTE</th>
                            <th className="p-6 font-bold text-gray-400 text-xs tracking-wider">DATA</th>
                            <th className="p-6 font-bold text-gray-400 text-xs tracking-wider">STATUS</th>
                            <th className="p-6 font-bold text-gray-400 text-xs tracking-wider text-right">TOTAL</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {loading ? (
                            <tr>
                                <td colSpan={5} className="p-10 text-center text-gray-400 animate-pulse">Carregando pedidos...</td>
                            </tr>
                        ) : filteredOrders.map((order) => (
                            <tr key={order.id} className="hover:bg-gray-50/50 transition-colors cursor-pointer">
                                <td className="p-6 font-bold text-gray-900">#{order.ticket_code}</td>
                                <td className="p-6 text-gray-600 font-medium">{order.user_email}</td>
                                <td className="p-6 text-gray-500 text-sm">
                                    {new Date(order.created_at).toLocaleDateString('pt-BR')} <br />
                                    {new Date(order.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                </td>
                                <td className="p-6">
                                    <span className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1 w-fit ${getStatusColor(order.status)}`}>
                                        {getStatusLabel(order.status)}
                                    </span>
                                </td>
                                <td className="p-6 text-right font-black text-gray-900">
                                    R$ {(order.total || order.total_amount || 0).toFixed(2).replace('.', ',')}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {!loading && filteredOrders.length === 0 && (
                    <div className="p-10 text-center text-gray-400 font-medium">
                        Nenhum pedido encontrado.
                    </div>
                )}
            </div>
        </div>
    );
}
