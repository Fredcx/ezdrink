"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, ShoppingBag, Users, Utensils, Settings, LogOut, Menu, X, UserCheck } from "lucide-react";
import { useAuth } from "@/context/AuthContext"; // Kept for logout from client if needed, or remove? Better keep for consistency but use local logic.
import { motion, AnimatePresence } from "framer-motion";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const [isMobileOpen, setIsMobileOpen] = useState(false);

    const LINKS = [
        { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
        { href: "/admin/orders", label: "Pedidos", icon: ShoppingBag },
        { href: "/admin/products", label: "Cardápio", icon: Utensils },
        { href: "/admin/team", label: "Equipe", icon: UserCheck },
        { href: "/admin/customers", label: "Clientes", icon: Users },
        { href: "/admin/settings", label: "Configurações", icon: Settings },
    ];

    const isActive = (path: string) => pathname === path;

    const handleLogout = () => {
        localStorage.removeItem('ezdrink_admin_token');
        window.location.href = '/admin/login';
    };

    // Independent Admin Auth Logic
    // We do NOT rely on global AuthContext (which is for Clients) to avoid conflicts.
    useEffect(() => {
        if (pathname === '/admin/login') return;

        const checkAdminAuth = async () => {
            const token = localStorage.getItem('ezdrink_admin_token');
            if (!token) {
                console.log("AdminLayout: No admin token found. Redirecting.");
                window.location.href = '/admin/login';
                return;
            }

            try {
                // Verify token validity and role
                const res = await fetch(`${(process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "")}/api/users/me`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (res.ok) {
                    const data = await res.json();
                    const isManager = data.establishment_role === 'manager';
                    const isAdmin = data.user_type === 'admin';

                    if (!isAdmin && !isManager) {
                        console.log("AdminLayout: Token valid but not admin. Redirecting.");
                        localStorage.removeItem('ezdrink_admin_token'); // Clear invalid
                        window.location.href = '/admin/login';
                    }
                    // Else: Access Granted.
                } else {
                    console.log("AdminLayout: Token verification failed. Redirecting.");
                    localStorage.removeItem('ezdrink_admin_token');
                    window.location.href = '/admin/login';
                }
            } catch (e) {
                console.error("AdminLayout: Verification Error", e);
                // Don't loop forcefully on network error, keep current state (maybe offline?)
            }
        };

        checkAdminAuth();

    }, [pathname]);

    // If on login page, render just children (simple layout)
    if (pathname === '/admin/login') {
        return <>{children}</>;
    }

    return (
        <div className="min-h-screen bg-[#f4f4f5] flex font-sans text-gray-900">

            {/* Desktop Sidebar */}
            <aside className="hidden md:flex w-64 bg-primary text-white flex-col fixed inset-y-0 z-50">
                <div className="p-8">
                    <h1 className="text-2xl font-black tracking-tight">EZ DRINK<span className="text-black">.</span></h1>
                    <p className="text-xs font-medium opacity-70 tracking-widest mt-1">ADMIN PANEL</p>
                </div>

                <nav className="flex-1 px-4 space-y-2">
                    {LINKS.map(link => (
                        <Link
                            key={link.href}
                            href={link.href}
                            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-bold ${isActive(link.href)
                                ? "bg-white text-black shadow-lg"
                                : "text-white/70 hover:bg-white/10 hover:text-white"
                                }`}
                        >
                            <link.icon className="w-5 h-5" />
                            {link.label}
                        </Link>
                    ))}
                </nav>

                <div className="p-4">
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 px-4 py-3 rounded-xl text-white/70 hover:bg-red-500/20 hover:text-red-100 transition-colors w-full font-bold"
                    >
                        <LogOut className="w-5 h-5" />
                        Sair
                    </button>
                </div>
            </aside>

            {/* Mobile Header */}
            <div className="md:hidden fixed top-0 w-full bg-primary z-40 px-6 py-4 flex items-center justify-between text-white">
                <h1 className="font-bold text-lg">EZ DRINK <span className="text-white/50">ADMIN</span></h1>
                <button onClick={() => setIsMobileOpen(!isMobileOpen)}>
                    {isMobileOpen ? <X /> : <Menu />}
                </button>
            </div>

            {/* Mobile Sidebar Overlay */}
            <AnimatePresence>
                {isMobileOpen && (
                    <motion.div
                        initial={{ x: "-100%" }}
                        animate={{ x: 0 }}
                        exit={{ x: "-100%" }}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        className="fixed inset-0 z-30 bg-primary pt-20 px-4 md:hidden"
                    >
                        <nav className="space-y-2">
                            {LINKS.map(link => (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    onClick={() => setIsMobileOpen(false)}
                                    className={`flex items-center gap-3 px-4 py-4 rounded-xl transition-all font-bold text-lg ${isActive(link.href)
                                        ? "bg-white text-black shadow-lg"
                                        : "text-white/70 hover:bg-white/10"
                                        }`}
                                >
                                    <link.icon className="w-6 h-6" />
                                    {link.label}
                                </Link>
                            ))}
                            <button
                                onClick={handleLogout}
                                className="flex items-center gap-3 px-4 py-4 mt-8 rounded-xl text-red-200 bg-red-500/20 w-full font-bold"
                            >
                                <LogOut className="w-6 h-6" />
                                Sair
                            </button>
                        </nav>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Main Content */}
            <main className="flex-1 md:ml-64 p-6 md:p-10 pt-24 md:pt-10 overflow-y-auto w-full">
                {children}
            </main>
        </div>
    );
}
