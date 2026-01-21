"use client";

import { motion } from "framer-motion";
import { DollarSign, ShoppingBag, Users, TrendingUp, ArrowUpRight, CreditCard, Banknote, QrCode } from "lucide-react";
import { useState, useEffect } from "react";
// Force Re-Deploy Trigger
import { useRouter } from "next/navigation";

export default function AdminDashboard() {
    const router = useRouter();

    const [stats, setStats] = useState({
        sales: 0,
        orders: 0,
        users: 12,
        ticket: 0
    });

    const [dashboardData, setDashboardData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('ezdrink_admin_token');
        if (!token) {
            router.push('/admin/login');
        } else {
            setLoading(false);
            fetchData();
        }
    }, [router]);

    const fetchData = async () => {
        try {
            const token = localStorage.getItem('ezdrink_admin_token');
            if (!token) {
                router.push('/admin/login');
                return;
            }
            const headers = { 'Authorization': `Bearer ${token}` };

            // Fetch Stats Aggregates
            const resStats = await fetch(`${(process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "")}/api/admin/dashboard-stats`, { headers });

            if (resStats.ok) {
                const data = await resStats.json();
                setDashboardData(data); // { salesByHour, countByHour, paymentStats, totalOrders, topProductByHour, recentOrders }

                // Calculate Totals for top cards
                const salesTotal = data.salesByHour ? data.salesByHour.reduce((a: number, b: number) => a + b, 0) : 0;
                const ordersTotal = data.totalOrders || 0;
                const ticket = ordersTotal > 0 ? salesTotal / ordersTotal : 0;

                setStats({
                    sales: salesTotal,
                    orders: ordersTotal,
                    users: 0, // Fallback
                    ticket: ticket
                });
            } else {
                console.warn("Dashboard stats endpoint unavailable");
            }

            // Also fetch basic users count just for the card
            const resUsers = await fetch(`${(process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "")}/api/admin/users`, { headers });
            if (resUsers.ok) {
                const users = await resUsers.json();
                setStats(prev => ({ ...prev, users: Array.isArray(users) ? users.length : 0 }));
            }

        } catch (error) {
            console.error("Failed to fetch dashboard data", error);
        } finally {
            setLoading(false);
        }
    };

    const STATS = [
        { label: "Vendas Hoje", value: `R$ ${stats.sales.toFixed(2).replace('.', ',')}`, icon: DollarSign, trend: "+12.5%", color: "bg-green-100 text-green-600" },
        { label: "Pedidos", value: stats.orders.toString(), icon: ShoppingBag, trend: "+8.2%", color: "bg-blue-100 text-blue-600" },
        { label: "Usuários", value: stats.users.toString(), icon: Users, trend: "+2.4%", color: "bg-purple-100 text-purple-600" },
        { label: "Ticket Médio", value: `R$ ${stats.ticket.toFixed(2).replace('.', ',')}`, icon: TrendingUp, trend: "+4.1%", color: "bg-orange-100 text-orange-600" },
    ];

    const getPct = (val: number) => {
        if (!dashboardData || !dashboardData.totalOrders || dashboardData.totalOrders === 0) return 0;
        return Math.round((val / dashboardData.totalOrders) * 100);
    };

    return (
        <div className="max-w-7xl mx-auto space-y-8 pb-10">
            <header>
                <h1 className="text-3xl font-black text-gray-900">Dashboard de Vendas</h1>
                <p className="text-gray-500 font-medium">Visão geral do desempenho em tempo real.</p>
            </header>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
                        </div>
                        <h3 className="text-gray-500 font-medium text-sm mb-1">{stat.label}</h3>
                        <p className="text-2xl font-black text-gray-900">{stat.value}</p>
                    </motion.div>
                ))}
            </div>

            {/* Charts Section */}
            {dashboardData && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                    {/* Hourly Sales Chart */}
                    <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 lg:col-span-2">
                        <h2 className="text-xl font-bold text-gray-900 mb-6">Vendas por Hora</h2>
                        <div className="h-64 flex items-end justify-between gap-2">
                            {dashboardData.salesByHour && dashboardData.salesByHour.map((val: number, h: number) => {
                                const max = Math.max(...(dashboardData.salesByHour || [1]), 1);
                                const heightPct = (val / max) * 100;
                                const isPeak = val === max && val > 0;

                                return (
                                    <div key={h} className="flex flex-col items-center flex-1 group relative">
                                        <div
                                            className={`w-full max-w-[20px] rounded-t-lg transition-all duration-500 ${isPeak ? 'bg-primary' : 'bg-gray-100 group-hover:bg-primary/50'}`}
                                            style={{ height: `${heightPct}%` }}
                                        ></div>
                                        <div className="absolute -top-12 opacity-0 group-hover:opacity-100 transition-opacity bg-black text-white text-xs p-2 rounded-lg whitespace-nowrap z-10 pointer-events-none">
                                            {h}h: R$ {val.toFixed(0)} ({dashboardData.countByHour[h]} peds)
                                            {dashboardData.topProductByHour[h] && (
                                                <div className="text-gray-300 text-[10px]">Top: {dashboardData.topProductByHour[h].name}</div>
                                            )}
                                        </div>
                                        <span className="text-[10px] text-gray-400 mt-2">{h}h</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Payment Specs */}
                    <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 space-y-6">
                        <h2 className="text-xl font-bold text-gray-900 mb-2">Índices de Conversão</h2>

                        {['credit_card', 'pix', 'cash'].map((method) => {
                            const val = dashboardData.paymentStats ? dashboardData.paymentStats[method] : 0;
                            const pct = getPct(val);
                            const label = method === 'credit_card' ? 'Cartão' : method === 'pix' ? 'Pix' : 'Outros';
                            const Icon = method === 'credit_card' ? CreditCard : method === 'pix' ? QrCode : Banknote;
                            const color = method === 'credit_card' ? 'bg-blue-500' : method === 'pix' ? 'bg-green-500' : 'bg-gray-400';

                            return (
                                <div key={method} className="space-y-2">
                                    <div className="flex justify-between text-sm font-bold text-gray-700">
                                        <span className="flex items-center gap-2"><Icon className="w-4 h-4" /> {label}</span>
                                        <span>{pct}%</span>
                                    </div>
                                    <div className="h-3 w-full bg-gray-100 rounded-full overflow-hidden">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${pct}%` }}
                                            className={`h-full ${color} rounded-full`}
                                        />
                                    </div>
                                </div>
                            );
                        })}

                        {/* Top Products Timeline */}
                        <div className="pt-6 border-t border-gray-100">
                            <h3 className="text-sm font-bold text-gray-900 mb-4">Destaques por Horário</h3>
                            <div className="space-y-3 h-48 overflow-y-auto pr-2 custom-scrollbar">
                                {dashboardData.topProductByHour && dashboardData.topProductByHour.map((prod: any, h: number) => {
                                    if (!prod) return null;
                                    return (
                                        <div key={h} className="flex items-center justify-between text-xs">
                                            <span className="font-mono bg-gray-100 px-2 py-1 rounded text-gray-500">{h}:00</span>
                                            <span className="font-bold text-gray-800 truncate max-w-[120px]">{prod.name}</span>
                                            <span className="text-primary font-bold">{prod.count} un.</span>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>

                    </div>
                </div>
            )}

            {/* Recent Orders Preview (Restored) */}
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 md:p-8 mt-10 overflow-x-auto">
                <div className="flex items-center justify-between mb-8 min-w-[600px]">
                    <h2 className="text-xl font-bold text-gray-900">Pedidos Recentes</h2>
                    <button onClick={() => router.push('/admin/orders')} className="text-primary font-bold text-sm hover:underline">Ver todos</button>
                </div>

                <div className="space-y-4 min-w-[600px]">
                    {loading ? (
                        <div className="text-center py-10 text-gray-400 animate-pulse">Carregando...</div>
                    ) : (!dashboardData?.recentOrders || dashboardData.recentOrders.length === 0) ? (
                        <div className="text-center py-10 text-gray-400">Nenhum pedido recente.</div>
                    ) : dashboardData.recentOrders.map((order: any, i: number) => (
                        <div key={i} className="flex items-center justify-between p-4 hover:bg-gray-50 rounded-2xl transition-colors border border-transparent hover:border-gray-100 group">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center font-bold text-gray-500">
                                    #{order.ticket_code}
                                </div>
                                <div>
                                    <h4 className="font-bold text-gray-900">Pedido #{order.id}</h4>
                                    <p className="text-xs text-gray-500 font-medium">{order.user_email || order.customer_name || 'Cliente'}</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <span className="block font-bold text-gray-900">R$ {(order.total || order.total_amount || 0).toFixed(2).replace('.', ',')}</span>
                                <span className={`text-xs font-bold px-2 py-1 rounded-md ${order.status === 'paid' ? 'text-green-600 bg-green-100' :
                                    order.status === 'ready' ? 'text-blue-600 bg-blue-100' :
                                        order.status === 'completed' ? 'text-gray-600 bg-gray-100' :
                                            order.status === 'cancelled' ? 'text-red-600 bg-red-100' :
                                                'text-yellow-600 bg-yellow-100'
                                    }`}>
                                    {order.status === 'paid' ? 'Pago' :
                                        order.status === 'ready' ? 'Pronto' :
                                            order.status === 'completed' ? 'Concluído' :
                                                order.status === 'cancelled' ? 'Cancelado' : order.status}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

        </div>
    );
}
