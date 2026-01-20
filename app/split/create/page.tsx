"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Users } from "lucide-react";
import { motion } from "framer-motion";
import { useCart } from "@/context/CartContext";

export default function SplitCreatePage() {
    const router = useRouter();
    const { items, total } = useCart();
    const [participantCount, setParticipantCount] = useState(2);
    const [isLoading, setIsLoading] = useState(false);

    const handleCreateSplit = async () => {
        setIsLoading(true);
        try {
            const res = await fetch(`${(process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "")}/api/group-orders`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('ezdrink_token')}`
                },
                body: JSON.stringify({ cart: items, totalMembers: participantCount })
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

    const shareValue = ((total + 3.75) / participantCount).toFixed(2);

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
                        <span className="text-gray-600 font-medium">Sua parte ({participantCount} pessoas)</span>
                        <span className="text-primary font-bold text-lg">~ R$ {shareValue}</span>
                    </div>
                </div>


                {/* Count Selection */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-6">
                    <label className="text-sm font-bold text-gray-700 mb-4 block">Quantas pessoas vão dividir?</label>

                    <div className="flex items-center justify-between mb-8">
                        <button
                            onClick={() => setParticipantCount(Math.max(2, participantCount - 1))}
                            className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-xl font-bold hover:bg-gray-200"
                        >
                            -
                        </button>
                        <div className="flex flex-col items-center">
                            <span className="text-4xl font-extrabold text-primary">{participantCount}</span>
                            <span className="text-xs text-gray-500 font-bold uppercase tracking-wider">Pessoas</span>
                        </div>
                        <button
                            onClick={() => setParticipantCount(participantCount + 1)}
                            className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-xl font-bold hover:bg-gray-200"
                        >
                            +
                        </button>
                    </div>

                    <div className="bg-blue-50 p-4 rounded-xl flex items-center gap-3">
                        <Users className="w-5 h-5 text-blue-600" />
                        <p className="text-sm text-blue-800 font-medium">
                            Você + {participantCount - 1} amigos
                        </p>
                    </div>
                </div>


                <button
                    disabled={isLoading}
                    onClick={handleCreateSplit}
                    className="w-full bg-primary text-primary-foreground font-bold text-lg py-4 rounded-xl hover:brightness-110 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isLoading ? "Criando Grupo..." : "Gerar QR Code de Pagamento"}
                </button>

            </main>
        </div>
    );
}
