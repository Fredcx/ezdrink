"use client";

import { motion } from "framer-motion";
import { ArrowLeft, CreditCard, Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { AddCardModal } from "@/components/AddCardModal";

export default function MyCardsPage() {
    const router = useRouter();
    const [isAddCardOpen, setIsAddCardOpen] = useState(false);
    // Mock saved cards - ideally this would come from a context or backend
    const [savedCards, setSavedCards] = useState<{ id: string, brand: string, last4: string }[]>([]);

    useEffect(() => {
        fetchCards();
    }, []);

    const fetchCards = async () => {
        try {
            const token = localStorage.getItem('ezdrink_token');
            if (!token) return;

            const res = await fetch(`${(process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "")}/api/cards`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (Array.isArray(data)) {
                setSavedCards(data);
            }
        } catch (err) {
            console.error("Erro ao carregar cartões", err);
        }
    };

    const handleSaveCard = () => {
        fetchCards();
        setIsAddCardOpen(false);
    };

    const handleDeleteCard = async (id: string) => {
        if (!confirm("Remover este cartão?")) return;
        try {
            const token = localStorage.getItem('ezdrink_token');
            await fetch(`${(process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "")}/api/cards/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            fetchCards();
        } catch (err) {
            alert("Erro ao remover cartão");
        }
    }

    return (
        <div className="min-h-screen bg-[#f4f4f5] font-sans">
            <header className="px-6 py-6 flex items-center justify-between sticky top-0 z-10 bg-[#f4f4f5]/90 backdrop-blur-md">
                <button
                    onClick={() => router.back()}
                    className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-black/5 transition-colors"
                >
                    <ArrowLeft className="w-6 h-6 text-black" />
                </button>
                <h1 className="text-xl font-bold text-black">Meus Cartões</h1>
                <button
                    onClick={() => setIsAddCardOpen(true)}
                    className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-black/5 transition-colors text-primary"
                >
                    <Plus className="w-6 h-6" />
                </button>
            </header>

            <main className="px-6 pb-20">
                <div className="space-y-4">
                    {savedCards.map((card) => (
                        <div
                            key={card.id}
                            className="w-full flex items-center justify-between p-5 rounded-3xl bg-white shadow-sm"
                        >
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center text-gray-600">
                                    <CreditCard className="w-6 h-6" />
                                </div>
                                <div className="flex flex-col items-start">
                                    <span className="font-bold text-lg text-gray-900 capitalize">{card.brand}</span>
                                    <span className="text-sm text-gray-400 font-medium">•••• •••• •••• {card.last4}</span>
                                </div>
                            </div>

                            <button
                                onClick={() => handleDeleteCard(card.id)}
                                className="p-2 text-gray-300 hover:text-red-500 transition-colors"
                            >
                                <Trash2 className="w-5 h-5" />
                            </button>
                        </div>
                    ))}

                    <button
                        onClick={() => setIsAddCardOpen(true)}
                        className="w-full py-4 border-2 border-dashed border-gray-300 rounded-3xl text-gray-400 font-bold flex items-center justify-center gap-2 hover:border-primary hover:text-primary transition-colors"
                    >
                        <Plus className="w-5 h-5" />
                        Adicionar novo cartão
                    </button>
                </div>
            </main>

            <AddCardModal
                isOpen={isAddCardOpen}
                onClose={() => setIsAddCardOpen(false)}
                onSave={handleSaveCard}
            />
        </div>
    );
}
