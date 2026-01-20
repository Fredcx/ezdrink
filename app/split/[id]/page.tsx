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
    const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null);

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
        // Decode token to get email roughly or fetch profile
        const token = localStorage.getItem('ezdrink_token');
        if (token) {
            // Simplified decode for demo or fetch /api/me
            // For now, let's assume valid auth is required to view simpler
            // In a real app we'd decode jwt properly
            fetch(`${(process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "")}/api/auth/me`, {
                headers: { 'Authorization': `Bearer ${token}` }
            }).then(r => r.json()).then(data => {
                if (data.user) setCurrentUserEmail(data.user.email);
            });
        } else {
            // Check for guest email as fallback
            const guest = localStorage.getItem('ezdrink_guest_email');
            if (guest) setCurrentUserEmail(guest);
        }
        fetchGroupOrder();
        const interval = setInterval(fetchGroupOrder, 5000); // Poll every 5s
        return () => clearInterval(interval);
    }, [id]);

    const handlePayMyShare = async () => {
        if (!currentUserEmail) return;
        try {
            const res = await fetch(`${(process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "")}/api/group-orders/${id}/pay`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: currentUserEmail,
                    payment_method: 'pix_mock'
                })
            });
            const data = await res.json();
            if (data.success) {
                fetchGroupOrder(); // Refresh immediately
            } else {
                alert("Erro: " + data.error);
            }
        } catch (e) {
            alert("Erro de conexão");
        }
    };

    if (isLoading) return <div className="min-h-screen flex items-center justify-center font-bold">Carregando...</div>;
    if (!groupOrder) return <div className="min-h-screen flex items-center justify-center">Grupo não encontrado</div>;

    const myMember = groupOrder.group_order_members.find(m => m.email === currentUserEmail);
    const isCompleted = groupOrder.status === 'completed';
    const paidCount = groupOrder.group_order_members.filter(m => m.status === 'paid').length;
    const totalCount = groupOrder.group_order_members.length;

    // Calculate progress
    const progress = (paidCount / totalCount) * 100;

    return (
        <div className="fixed inset-0 bg-primary font-sans flex flex-col justify-end">
            <div className="bg-[#f4f4f5] w-full h-[calc(100vh-24px)] rounded-t-[40px] shadow-2xl overflow-hidden flex flex-col">
                <header className="px-6 py-6 flex items-center justify-between sticky top-0 z-10 bg-[#f4f4f5]/90 backdrop-blur-md">
                    {/* If completed, maybe no back button or go to home? */}
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
                            <circle
                                cx="80"
                                cy="80"
                                r="70"
                                stroke="currentColor"
                                strokeWidth="12"
                                fill="transparent"
                                className="text-gray-200"
                            />
                            <circle
                                cx="80"
                                cy="80"
                                r="70"
                                stroke="currentColor"
                                strokeWidth="12"
                                fill="transparent"
                                strokeDasharray={440}
                                strokeDashoffset={440 - (440 * progress) / 100}
                                className="text-primary transition-all duration-1000 ease-out"
                            />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                            {isCompleted ? (
                                <Check className="w-12 h-12 text-green-600 mb-1" />
                            ) : (
                                <span className="text-3xl font-bold">{paidCount}/{totalCount}</span>
                            )}
                            <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">
                                {isCompleted ? "Concluído" : "Pagos"}
                            </span>
                        </div>
                    </div>

                    {isCompleted ? (
                        <div className="text-center w-full animate-in fade-in slide-in-from-bottom-4 duration-700">
                            <h2 className="text-2xl font-bold mb-2 text-green-600">Pagamento Finalizado!</h2>
                            <p className="text-gray-600 mb-8">Todos pagaram. Aqui está o seu pedido.</p>

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
                    ) : (
                        <>
                            <div className="w-full bg-white rounded-2xl p-6 shadow-sm mb-6 border border-gray-100">
                                <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                                    <Users className="w-5 h-5 text-primary" />
                                    Participantes
                                </h3>
                                <div className="space-y-4">
                                    {groupOrder.group_order_members.map((m) => (
                                        <div key={m.id} className="flex justify-between items-center">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${m.status === 'paid' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                                                    {m.status === 'paid' ? <Check className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-medium text-gray-800 truncate max-w-[150px]">{m.email}</span>
                                                    <span className="text-xs text-gray-400 font-bold">R$ {m.share_amount}</span>
                                                </div>
                                            </div>
                                            <span className={`text-xs font-bold px-2 py-1 rounded-md ${m.status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                                {m.status === 'paid' ? 'Pago' : 'Pendente'}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* My Action Area */}
                            {myMember && myMember.status === 'pending' && (
                                <div className="w-full bg-primary/10 rounded-2xl p-6 border border-primary/20">
                                    <div className="flex justify-between items-end mb-4">
                                        <div>
                                            <p className="text-sm text-primary font-bold mb-1">Sua parte</p>
                                            <h2 className="text-3xl font-extrabold text-primary">R$ {myMember.share_amount}</h2>
                                        </div>
                                    </div>
                                    <button
                                        onClick={handlePayMyShare}
                                        className="w-full bg-primary text-primary-foreground font-bold py-4 rounded-xl shadow-md hover:brightness-110 mb-2"
                                    >
                                        Pagar agora (Pix)
                                    </button>
                                    <p className="text-xs text-center text-primary/60 font-medium">Simulação de pagamento imediato</p>
                                </div>
                            )}

                            {myMember && myMember.status === 'paid' && (
                                <div className="p-4 bg-green-50 text-green-700 rounded-xl font-medium text-center border border-green-200">
                                    Você já pagou sua parte! <br /> Aguardando os amigos...
                                </div>
                            )}
                        </>
                    )}

                </main>
            </div>
        </div>
    );
}
