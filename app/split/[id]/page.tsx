"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, Check, Clock, Copy, RefreshCw, Smartphone, User, Users } from "lucide-react";
import QRCode from "react-qr-code";
import { motion, AnimatePresence } from "framer-motion";

interface Member {
    id: string;
    email: string;
    share_amount: number;
    status: 'pending' | 'paid';
}

interface GroupOrder {
    id: string;
    total_amount: number;
    status: 'pending' | 'completed';
    created_by: string;
    order_id: number;
    group_order_members: Member[];
}


export default function SplitLobbyPage() {
    const router = useRouter();
    const params = useParams();
    const id = params.id as string;
    const [groupOrder, setGroupOrder] = useState<GroupOrder | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [copied, setCopied] = useState(false);

    const fetchGroupOrder = async () => {
        try {
            const res = await fetch(`${(process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "")}/api/group-orders/${id}`);
            if (res.ok) {
                const data = await res.json();
                setGroupOrder(data);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchGroupOrder();
        const interval = setInterval(fetchGroupOrder, 3000); // Poll faster for demos
        return () => clearInterval(interval);
    }, [id]);

    const handleCopyLink = () => {
        const link = `${(process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "")}/pay-split/${id}`;
        navigator.clipboard.writeText(link);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    if (isLoading) return <div className="min-h-screen flex items-center justify-center font-bold">Carregando...</div>;
    if (!groupOrder) return <div className="min-h-screen flex items-center justify-center">Grupo não encontrado</div>;

    const isCompleted = groupOrder.status === 'completed';
    const paidCount = groupOrder.group_order_members.filter(m => m.status === 'paid').length;
    const totalCount = groupOrder.group_order_members.length;
    const progress = (paidCount / totalCount) * 100;
    const payLink = `${(process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "")}/pay-split/${id}`;

    return (
        <div className="fixed inset-0 bg-primary font-sans flex flex-col justify-end">
            <div className="bg-[#f4f4f5] w-full h-[calc(100vh-24px)] rounded-t-[40px] shadow-2xl overflow-hidden flex flex-col">
                <header className="px-6 py-6 flex items-center justify-between sticky top-0 z-10 bg-[#f4f4f5]/90 backdrop-blur-md">
                    <button
                        onClick={() => router.push('/cart')}
                        className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-black/5 transition-colors"
                    >
                        <ArrowLeft className="w-6 h-6" />
                    </button>
                    <h1 className="text-xl font-bold">
                        {isCompleted ? "Conta Paga!" : "Dividindo a Conta"}
                    </h1>
                    <div className="w-10" />
                </header>

                <main className="flex-1 px-6 pb-32 overflow-y-auto scrollbar-hide flex flex-col items-center">

                    {/* Status Circle */}
                    <div className="mb-8 mt-4 relative">
                        <svg className="w-40 h-40 transform -rotate-90">
                            <circle cx="80" cy="80" r="70" stroke="currentColor" strokeWidth="12" fill="transparent" className="text-gray-200" />
                            <circle cx="80" cy="80" r="70" stroke="currentColor" strokeWidth="12" fill="transparent"
                                strokeDasharray={440} strokeDashoffset={440 - (440 * progress) / 100}
                                className="text-primary transition-all duration-1000 ease-out"
                            />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                            <span className="text-3xl font-bold">{paidCount}/{totalCount}</span>
                            <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Pagos</span>
                        </div>
                    </div>

                    {!isCompleted && (
                        <div className="bg-white p-6 rounded-3xl shadow-md border border-gray-100 flex flex-col items-center w-full max-w-sm mb-8">
                            <h3 className="text-sm font-bold text-gray-500 mb-4 uppercase tracking-widest">Escaneie para Pagar</h3>
                            <div className="bg-white p-2 rounded-xl">
                                <QRCode value={payLink} size={180} />
                            </div>
                            <button onClick={handleCopyLink} className="mt-4 flex items-center gap-2 text-primary font-bold text-sm bg-primary/5 px-4 py-2 rounded-full hover:bg-primary/10">
                                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                {copied ? "Link Copiado!" : "Copiar Link"}
                            </button>
                        </div>
                    )}

                    {/* Member List */}
                    <div className="w-full bg-white rounded-2xl p-6 shadow-sm mb-6 border border-gray-100">
                        <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                            <Users className="w-5 h-5 text-primary" />
                            Cotas ({totalCount})
                        </h3>
                        <div className="space-y-4">
                            {groupOrder.group_order_members.map((m, idx) => (
                                <div key={m.id} className="flex justify-between items-center">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${m.status === 'paid' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                                            {m.status === 'paid' ? <Check className="w-4 h-4" /> : <User className="w-4 h-4" />}
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-sm font-medium text-gray-800">
                                                {m.email.includes('@') ? m.email.split('@')[0] : `Pessoa ${idx + 1}`}
                                            </span>
                                            <span className="text-xs text-gray-400 font-bold">R$ {m.share_amount.toFixed(2)}</span>
                                        </div>
                                    </div>
                                    <span className={`text-xs font-bold px-2 py-1 rounded-md ${m.status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                        {m.status === 'paid' ? 'Pago' : 'Pendente'}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {!isCompleted && (
                        <button
                            onClick={() => router.push(`/pay-split/${id}`)}
                            className="w-full bg-primary text-primary-foreground font-bold py-4 rounded-xl shadow-md hover:brightness-110 mb-8"
                        >
                            Pagar minha parte
                        </button>
                    )}

                    {isCompleted && (
                        <div className="text-center w-full animate-in fade-in slide-in-from-bottom-4 duration-700">
                            <div className="bg-green-100 text-green-800 p-4 rounded-xl font-bold mb-4">
                                Tudo pago! 🚀
                            </div>
                            <div className="bg-white p-6 rounded-3xl shadow-lg border border-gray-100 flex flex-col items-center mx-auto mb-8 max-w-xs">
                                <QRCode value={`ORDER-${groupOrder.order_id}`} size={160} />
                                <p className="mt-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Apresente no Balcão</p>
                            </div>
                            <button
                                onClick={() => router.push('/orders')}
                                className="bg-black text-white px-8 py-4 rounded-xl font-bold w-full shadow-lg"
                            >
                                Ver meus pedidos
                            </button>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
}

