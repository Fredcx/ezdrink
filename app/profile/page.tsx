"use client";

import { useAuth } from "@/context/AuthContext";
import { motion } from "framer-motion";
import { ArrowLeft, User, Bell, Wallet, HelpCircle, LogOut, ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function ProfilePage() {
    const router = useRouter();
    const { logout, user } = useAuth();

    const MENU_ITEMS = [
        { icon: User, label: "Meus Dados", href: "/profile/data" },
        { icon: Wallet, label: "Minha Carteira", href: "/wallet/cards" },
        { icon: HelpCircle, label: "Ajuda e Suporte", href: "#" },
    ];

    return (
        <div className="fixed inset-0 bg-primary font-sans flex flex-col justify-end">
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
                    <h1 className="text-xl font-bold text-black mx-auto">Meu Perfil</h1>
                </header>

                <main className="flex-1 px-6 pb-20 overflow-y-auto scrollbar-hide">
                    {/* User Card */}
                    <div className="flex items-center gap-4 mb-8 bg-white p-4 rounded-3xl shadow-sm border border-gray-100">
                        <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center text-primary font-bold text-2xl">
                            {user?.name?.substring(0, 2).toUpperCase() || "EZ"}
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-gray-900">{user?.name || "Visitante"}</h2>
                            <p className="text-sm text-gray-500">{user?.phone || ""}</p>
                        </div>
                    </div>

                    {/* Menu Options */}
                    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden mb-8">
                        {MENU_ITEMS.map((item, index) => (
                            <Link
                                key={item.label}
                                href={item.href}
                                className={`flex items-center justify-between p-4 hover:bg-gray-50 transition-colors ${index !== MENU_ITEMS.length - 1 ? "border-b border-gray-100" : ""
                                    }`}
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center text-gray-600">
                                        <item.icon className="w-5 h-5" />
                                    </div>
                                    <span className="font-bold text-gray-700">{item.label}</span>
                                </div>
                                <ChevronRight className="w-5 h-5 text-gray-400" />
                            </Link>
                        ))}
                    </div>

                    {/* Logout Button */}
                    <button
                        onClick={logout}
                        className="w-full bg-red-50 text-red-500 font-bold py-4 rounded-xl hover:bg-red-100 transition-colors flex items-center justify-center gap-2"
                    >
                        <LogOut className="w-5 h-5" />
                        Sair da conta
                    </button>

                    <p className="text-center text-xs text-gray-400 mt-6">
                        Versão 1.0.0
                    </p>
                </main>
            </motion.div>
        </div>
    );
}
