"use client";

import { motion } from "framer-motion";
import { DollarSign, ShoppingBag, Users, TrendingUp, ArrowUpRight, CreditCard, Banknote, QrCode } from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";

export default function AdminDashboard() {
    const { isAuthenticated, isLoading: isAuthLoading } = useAuth(); // Global Auth
    const router = useRouter();

    const [stats, setStats] = useState({
        sales: 0,
        orders: 0,
        users: 12,
        ticket: 0
    });

    // New Dashboard Data
    const [dashboardData, setDashboardData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!isAuthLoading && !isAuthenticated) {
            router.push('/login');
        } else if (isAuthenticated) {
            fetchData();
        }
    }, [isAuthLoading, isAuthenticated, router]);

    // Force re-fetch on auth change just in case
    useEffect(() => {
        if (isAuthenticated) fetchData();
    }, [isAuthenticated]);

    if (isAuthLoading || !isAuthenticated) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    const fetchData = async () => {
        try {
            const token = localStorage.getItem('ezdrink_token');
            const headers = { 'Authorization': `Bearer ${token}` };

            // Fetch Stats Aggregates (New Endpoint)
            const resStats = await fetch(`${(process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "")}/api/admin/dashboard-stats`, { headers });

            if (resStats.ok) {
                const data = await resStats.json();
                setDashboardData(data); // { salesByHour, countByHour, paymentStats, totalOrders, topProductByHour }

                // Calculate Totals for top cards
                const salesTotal = data.salesByHour.reduce((a: number, b: number) => a + b, 0);
                const ordersTotal = data.totalOrders;
                const ticket = ordersTotal > 0 ? salesTotal / ordersTotal : 0;

                setStats({
                    sales: salesTotal,
                    orders: ordersTotal,
                    users: 0, // We could fetch users count if needed, or stick to dummy/separate call
                    ticket: ticket
                });
            } else {
                // Fallback to old method if endpoint fails (or 404 while deploying)
                console.warn("Dashboard stats endpoint unavailable");
            }

            // Also fetch basic users count just for the card
            const resUsers = await fetch(`${(process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "")}/api/admin/users`, { headers });
            if (resUsers.ok) {
                const users = await resUsers.json();
                setStats(prev => ({ ...prev, users: users.length }));
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

    // Helper to calculate percentage
    const getPct = (val: number) => {
        if (!dashboardData || dashboardData.totalOrders === 0) return 0;
        return Math.round((val / dashboardData.totalOrders) * 100);
    };

    return (
        <div className="max-w-7xl mx-auto space-y-8">
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
                            {dashboardData.salesByHour.map((val: number, h: number) => {
                                // Simple Normalization
                                const max = Math.max(...dashboardData.salesByHour, 1);
                                const heightPct = (val / max) * 100;
                                const isPeak = val === max && val > 0;

                                return (
                                    <div key={h} className="flex flex-col items-center flex-1 group relative">
                                        <div
                                            className={`w-full max-w-[20px] rounded-t-lg transition-all duration-500 ${isPeak ? 'bg-primary' : 'bg-gray-100 group-hover:bg-primary/50'}`}
                                            style={{ height: `${heightPct}%` }}
                                        ></div>
                                        {/* Tooltip */}
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

                    {/* Payment Specs (Conversion) */}
                    <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 space-y-6">
                        <h2 className="text-xl font-bold text-gray-900 mb-2">Índices de Conversão</h2>

                        {/* Card */}
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm font-bold text-gray-700">
                                <span className="flex items-center gap-2"><CreditCard className="w-4 h-4" /> Cartão</span>
                                <span>{getPct(dashboardData.paymentStats.credit_card)}%</span>
                            </div>
                            <div className="h-3 w-full bg-gray-100 rounded-full overflow-hidden">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${getPct(dashboardData.paymentStats.credit_card)}%` }}
                                    className="h-full bg-blue-500 rounded-full"
                                />
                            </div>
                        </div>

                        {/* Pix */}
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm font-bold text-gray-700">
                                <span className="flex items-center gap-2"><QrCode className="w-4 h-4" /> Pix</span>
                                <span>{getPct(dashboardData.paymentStats.pix)}%</span>
                            </div>
                            <div className="h-3 w-full bg-gray-100 rounded-full overflow-hidden">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${getPct(dashboardData.paymentStats.pix)}%` }}
                                    className="h-full bg-green-500 rounded-full"
                                />
                            </div>
                        </div>

                        {/* Money/Other */}
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm font-bold text-gray-700">
                                <span className="flex items-center gap-2"><Banknote className="w-4 h-4" /> Outros</span>
                                <span>{getPct(dashboardData.paymentStats.cash)}%</span>
                            </div>
                            <div className="h-3 w-full bg-gray-100 rounded-full overflow-hidden">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${getPct(dashboardData.paymentStats.cash)}%` }}
                                    className="h-full bg-gray-400 rounded-full"
                                />
                            </div>
                        </div>

                        {/* Top Products Timeline Mini-List */}
                        <div className="pt-6 border-t border-gray-100">
                            <h3 className="text-sm font-bold text-gray-900 mb-4">Destaques por Horário</h3>
                            <div className="space-y-3 h-48 overflow-y-auto pr-2 custom-scrollbar">
                                {dashboardData.topProductByHour.map((prod: any, h: number) => {
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

        </div>
    );
}
