"use client";

import { useAuth } from "@/context/AuthContext";
import { motion } from "framer-motion";
import { ArrowLeft, Save, User as UserIcon, Phone } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

export default function MyDataPage() {
    const router = useRouter();
    const { user, updateUser } = useAuth();

    const [name, setName] = useState("");
    const [loading, setLoading] = useState(false);
    const [showToast, setShowToast] = useState(false);

    useEffect(() => {
        if (user) {
            setName(user.name);
        }
    }, [user]);

    const handleSave = async () => {
        setLoading(true);
        // Mock save delay
        await new Promise(resolve => setTimeout(resolve, 800));

        updateUser({ name });
        setLoading(false);

        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
    };

    return (
        <div className="fixed inset-0 bg-primary font-sans flex flex-col justify-end">
            {/* Success Toast */}
            {showToast && (
                <div className="absolute top-6 left-1/2 -translate-x-1/2 z-50 bg-black/80 text-white px-6 py-3 rounded-full text-sm font-bold animate-fade-in-down shadow-lg flex items-center gap-2">
                    <Save className="w-4 h-4 text-primary" />
                    Dados atualizados!
                </div>
            )}

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
                    <h1 className="text-xl font-bold text-black mx-auto">Meus Dados</h1>
                </header>

                <main className="flex-1 px-6 pb-20 overflow-y-auto scrollbar-hide">

                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col gap-6">

                        {/* Avatar */}
                        <div className="flex flex-col items-center justify-center mb-2">
                            <div className="w-24 h-24 bg-primary/20 rounded-full flex items-center justify-center text-primary font-bold text-4xl mb-4">
                                {name?.substring(0, 2).toUpperCase() || "EZ"}
                            </div>
                            <button className="text-primary text-xs font-bold hover:underline">
                                Alterar foto
                            </button>
                        </div>

                        {/* Name Input */}
                        <div>
                            <label className="text-xs font-bold text-gray-400 ml-4 mb-2 flex items-center gap-1">
                                <UserIcon className="w-3 h-3" /> NOME
                            </label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-4 font-bold text-lg outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                            />
                        </div>

                        {/* Phone Input (Disabled) */}
                        <div>
                            <label className="text-xs font-bold text-gray-400 ml-4 mb-2 flex items-center gap-1">
                                <Phone className="w-3 h-3" /> CELULAR
                            </label>
                            <div className="relative">
                                <input
                                    type="text"
                                    value={user?.phone || ""}
                                    disabled
                                    className="w-full bg-gray-100/50 border border-gray-200 rounded-2xl px-4 py-4 font-bold text-lg text-gray-400 outline-none cursor-not-allowed"
                                />
                                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-bold text-gray-400 bg-gray-200 px-2 py-1 rounded-md">
                                    Não editável
                                </span>
                            </div>
                            <p className="text-[10px] text-gray-400 mt-2 ml-4">
                                Para alterar seu número, entre em contato com o suporte.
                            </p>
                        </div>

                    </div>

                </main>

                {/* Footer Actions */}
                <div className="p-6 bg-white border-t border-gray-100">
                    <button
                        onClick={handleSave}
                        disabled={loading || name.length < 2}
                        className="w-full bg-primary text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary/20"
                    >
                        {loading ? "Salvando..." : "Salvar Alterações"}
                    </button>
                </div>
            </motion.div>
        </div>
    );
}
