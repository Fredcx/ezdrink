"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Mail, Plus, Trash2, Users } from "lucide-react";
import { motion } from "framer-motion";
import { useCart } from "@/context/CartContext";

export default function SplitCreatePage() {
    const router = useRouter();
    const { items, total } = useCart();
    const [emails, setEmails] = useState<string[]>([]);
    const [currentEmail, setCurrentEmail] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const handleAddEmail = () => {
        if (currentEmail && currentEmail.includes("@") && !emails.includes(currentEmail)) {
            setEmails([...emails, currentEmail]);
            setCurrentEmail("");
        }
    };

    const handleRemoveEmail = (email: string) => {
        setEmails(emails.filter(e => e !== email));
    };

    const handleCreateSplit = async () => {
        if (emails.length === 0) {
            alert("Adicione pelo menos um amigo para dividir.");
            return;
        }

        setIsLoading(true);
        try {
            const res = await fetch(`${(process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "")}/api/group-orders`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('ezdrink_token')}`
                },
                body: JSON.stringify({ cart: items, members: emails.map(e => ({ email: e })) })
            });
            const data = await res.json();

            if (data.success) {
                router.push(`/split/${data.groupOrderId}`);
            } else {
                alert("Erro ao criar divisão: " + data.error);
            }
        } catch (error) {
            console.error(error);
            alert("Erro de conexão");
        } finally {
            setIsLoading(false);
        }
    };

    const totalMembers = emails.length + 1; // +1 is you
    const shareValue = ((total + 3.75) / totalMembers).toFixed(2);

    return (
        <div className="min-h-screen bg-[#f4f4f5] font-sans flex flex-col">
            <header className="px-6 py-6 flex items-center justify-between bg-white shadow-sm sticky top-0 z-10">
                <button
                    onClick={() => router.back()}
                    className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-black/5 transition-colors"
                >
                    <ArrowLeft className="w-6 h-6" />
                </button>
                <h1 className="text-xl font-bold">Dividir Conta</h1>
                <div className="w-10" />
            </header>

            <main className="flex-1 p-6 flex flex-col max-w-lg mx-auto w-full">

                {/* Info Card */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-6">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center text-primary">
                            <Users className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 font-medium">Total com taxa</p>
                            <h2 className="text-2xl font-bold">R$ {(total + 3.75).toFixed(2)}</h2>
                        </div>
                    </div>
                    <div className="h-px bg-gray-100 my-2" />
                    <div className="flex justify-between items-center mt-2">
                        <span className="text-gray-600 font-medium">Sua parte ({totalMembers} pessoas)</span>
                        <span className="text-primary font-bold text-lg">~ R$ {shareValue}</span>
                    </div>
                </div>

                {/* Invite Form */}
                <div className="mb-6">
                    <label className="text-sm font-bold text-gray-700 mb-2 block">Convidar amigos por e-mail</label>
                    <div className="flex gap-2">
                        <input
                            type="email"
                            value={currentEmail}
                            onChange={(e) => setCurrentEmail(e.target.value)}
                            placeholder="amigo@email.com"
                            className="flex-1 p-4 rounded-xl border border-gray-200 focus:outline-none focus:border-black"
                        />
                        <button
                            onClick={handleAddEmail}
                            className="bg-black text-white px-4 rounded-xl hover:bg-black/80 transition-colors"
                        >
                            <Plus className="w-6 h-6" />
                        </button>
                    </div>
                </div>

                {/* List */}
                <div className="flex-1 overflow-y-auto space-y-3 mb-6">
                    {emails.length === 0 && (
                        <div className="text-center text-gray-400 py-8 text-sm">
                            Nenhum amigo adicionado ainda.
                        </div>
                    )}
                    {emails.map((email) => (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            key={email}
                            className="bg-white p-4 rounded-xl border border-gray-100 flex items-center justify-between"
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                                    <Mail className="w-4 h-4 text-gray-500" />
                                </div>
                                <span className="font-medium text-sm text-gray-700">{email}</span>
                            </div>
                            <button
                                onClick={() => handleRemoveEmail(email)}
                                className="text-red-400 hover:text-red-600 p-2"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </motion.div>
                    ))}
                </div>

                <button
                    disabled={emails.length === 0 || isLoading}
                    onClick={handleCreateSplit}
                    className="w-full bg-primary text-primary-foreground font-bold text-lg py-4 rounded-xl hover:brightness-110 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isLoading ? "Criando Grupo..." : "Confirmar e Enviar Convites"}
                </button>

            </main>
        </div>
    );
}
