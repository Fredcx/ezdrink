"use client";

import { motion } from "framer-motion";
import { DollarSign, ShoppingBag, Users, TrendingUp, ArrowUpRight } from "lucide-react";
import { useState, useEffect } from "react";

export default function AdminDashboard() {
    const [stats, setStats] = useState({
        sales: 0,
        orders: 0,
        users: 12,
        ticket: 0
    });
    const [recentOrders, setRecentOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const token = localStorage.getItem('ezdrink_token');
            const headers = { 'Authorization': `Bearer ${token}` };

            // Fetch Orders
            const resOrders = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/orders`, { headers });
            const orders = await resOrders.json();

            // Fetch Users
            const resUsers = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/users`, { headers });
            const users = await resUsers.json();

            if (Array.isArray(orders)) {
                // Calculate Stats
                const today = new Date().toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' }); // e.g. "14 de janeiro" matches order.date format usually? 
                // Wait, order.date format in JSON is "14 de janeiro às ...".
                // Better check string inclusion.

                const validOrders = orders.filter((o: any) => ['paid', 'completed', 'ready'].includes(o.status));

                // Sales Today
                const todayOrders = validOrders.filter((o: any) => o.date && o.date.includes(today));
                const salesToday = todayOrders.reduce((sum: number, o: any) => sum + (o.total || o.total_amount || 0), 0);

                // Total Sales (All Time) for Ticket Avg? Or Ticket Avg of Today?
                // Label just says "Ticket Médio". Usually implies overall or monthly. 
                // Use All Valid Orders for stable average.
                const allSales = validOrders.reduce((sum: number, o: any) => sum + (o.total || o.total_amount || 0), 0);
                const ticketAvg = validOrders.length > 0 ? allSales / validOrders.length : 0;

                setStats({
                    sales: salesToday,
                    orders: validOrders.length, // Showing Total Valid Orders count
                    users: Array.isArray(users) ? users.length : 0,
                    ticket: ticketAvg
                });
                setRecentOrders(orders.slice(0, 5));
            }
        } catch (error) {
            console.error("Failed to fetch dashboard data", error);
        } finally {
            setLoading(false);
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'paid': return { label: 'Pago', color: 'text-green-600 bg-green-100' };
            case 'ready': return { label: 'Aguardando Retirada', color: 'text-blue-600 bg-blue-100' };
            case 'completed': return { label: 'Concluído', color: 'text-gray-600 bg-gray-100' };
            case 'pending_payment': return { label: 'Pendente', color: 'text-yellow-600 bg-yellow-100' };
            case 'cancelled': return { label: 'Cancelado', color: 'text-red-600 bg-red-100' };
            default: return { label: status, color: 'text-gray-600 bg-gray-100' };
        }
    };

    const STATS = [
        { label: "Vendas Hoje", value: `R$ ${stats.sales.toFixed(2).replace('.', ',')}`, icon: DollarSign, trend: "+12.5%", color: "bg-green-100 text-green-600" },
        { label: "Pedidos", value: stats.orders.toString(), icon: ShoppingBag, trend: "+8.2%", color: "bg-blue-100 text-blue-600" },
        { label: "Novos Usuários", value: stats.users.toString(), icon: Users, trend: "+2.4%", color: "bg-purple-100 text-purple-600" },
        { label: "Ticket Médio", value: `R$ ${stats.ticket.toFixed(2).replace('.', ',')}`, icon: TrendingUp, trend: "+4.1%", color: "bg-orange-100 text-orange-600" },
    ];

    return (
        <div className="max-w-7xl mx-auto">
            <header className="mb-10">
                <h1 className="text-3xl font-black text-gray-900">Dashboard</h1>
                <p className="text-gray-500 font-medium">Bem-vindo ao painel de controle.</p>
            </header>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                {STATS.map((stat, i) => (
                    <motion.div
                        key={stat.label}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${stat.color}`}>
                                <stat.icon className="w-6 h-6" />
                            </div>
                            <span className="text-xs font-bold bg-gray-50 text-gray-600 px-2 py-1 rounded-lg flex items-center gap-1">
                                {stat.trend} <ArrowUpRight className="w-3 h-3" />
                            </span>
                        </div>
                        <h3 className="text-gray-500 font-medium text-sm mb-1">{stat.label}</h3>
                        <p className="text-2xl font-black text-gray-900">{stat.value}</p>
                    </motion.div>
                ))}
            </div>

            {/* Recent Orders Preview */}
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 md:p-8 overflow-x-auto">
                <div className="flex items-center justify-between mb-8 min-w-[600px]">
                    <h2 className="text-xl font-bold text-gray-900">Pedidos Recentes</h2>
                    <button className="text-primary font-bold text-sm hover:underline">Ver todos</button>
                </div>

                <div className="space-y-4 min-w-[600px]">
                    {loading ? (
                        <div className="text-center py-10 text-gray-400 animate-pulse">Carregando...</div>
                    ) : recentOrders.map((order, i) => (
                        <div key={i} className="flex items-center justify-between p-4 hover:bg-gray-50 rounded-2xl transition-colors border border-transparent hover:border-gray-100 group">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center font-bold text-gray-500">
                                    #{order.ticket_code}
                                </div>
                                <div>
                                    <h4 className="font-bold text-gray-900">Pedido #{order.id}</h4>
                                    <p className="text-xs text-gray-500 font-medium">{order.user_email}</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <span className="block font-bold text-gray-900">R$ {(order.total || order.total_amount || 0).toFixed(2).replace('.', ',')}</span>
                                <span className={`text-xs font-bold px-2 py-1 rounded-md ${getStatusLabel(order.status).color}`}>
                                    {getStatusLabel(order.status).label}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
