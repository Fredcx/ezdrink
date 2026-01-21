"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, Check, Copy, Users, RefreshCw, Smartphone } from "lucide-react";
import QRCode from "react-qr-code";

interface Member {
    id: string;
    email: string;
    share_amount: number;
    status: 'pending' | 'paid' | 'pending_payment'; // Added pending_payment for when pix is generated but not paid (backend update pending)
}

interface GroupOrder {
    id: string;
    total_amount: number;
    status: 'pending' | 'completed' | 'cancelled';
    created_by: string;
    created_at: string;
    order_id: number;
    group_order_members: Member[];
}

function CountDownTimer({ createdAt }: { createdAt: string }) {
    const [timeLeft, setTimeLeft] = useState("");

    useEffect(() => {
        const interval = setInterval(() => {
            const created = new Date(createdAt).getTime();
            const now = Date.now();
            const expiresAt = created + (15 * 60 * 1000); // 15 minutes
            const diff = expiresAt - now;

            if (diff <= 0) {
                setTimeLeft("00:00");
                clearInterval(interval);
            } else {
                const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
                const seconds = Math.floor((diff % (1000 * 60)) / 1000);
                setTimeLeft(`${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
            }
        }, 1000);
        return () => clearInterval(interval);
    }, [createdAt]);

    return <span className="text-xs font-bold text-red-500 mt-1">Expira em: {timeLeft}</span>;
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
        const interval = setInterval(fetchGroupOrder, 3000);
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

    // Logic for progress
    // Assume members with status 'paid' count towards total.
    // What about 'pending_payment'? Only count 'paid'.

    // NOTE: Our backend doesn't automatically update status from Pagar.me yet via Webhook.
    // However, for the demo/verification, if we generated the pix and the user "Paid", 
    // we need to see it. 
    // The previous mocked backend logic set it to 'paid'. 
    // The CURRENT logic sets it to 'pending_payment'.
    // If it's 'pending_payment', we show it as "Processando".
    // Since we don't have webhooks, we can't auto-switch to "paid".
    // This is a blocker for "Checking if full amount is paid".

    // FIX for Demo/Dev: Treating 'pending_payment' as potentially paid? No, that's confusing.
    // User asked for "Real Transactions".
    // I will display them as "Pendente (Pix Gerado)".
    // BUT the group won't complete until they are PAID.
    // I might need to simulate status update via a button or timeout IF no webhook?
    // Actually, Pagar.me V5 Pix invalidates quickly.
    // I will list them.

    let totalPaid = 0;
    const payments = groupOrder.group_order_members.map(m => {
        if (m.status === 'paid') totalPaid += m.share_amount;
        // Temporary: for the sake of the user flow seeing "progress" if they claim they paid
        // But we shouldn't fake it. 
        return m;
    });

    const totalNeeded = groupOrder.total_amount;
    const remaining = totalNeeded - totalPaid;
    const progress = Math.min((totalPaid / totalNeeded) * 100, 100);
    const isCompleted = remaining <= 0.01; // Floating point tolerance

    const payLink = `${(process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "")}/pay-split/${id}`;

    return (
        <div className="fixed inset-0 bg-primary font-sans flex flex-col justify-end">
            <div className="bg-[#f4f4f5] w-full h-[calc(100vh-24px)] rounded-t-[40px] shadow-2xl overflow-hidden flex flex-col">
                <header className="px-6 py-6 flex items-center justify-between sticky top-0 z-10 bg-[#f4f4f5]/90 backdrop-blur-md">
                    <button
                        onClick={() => router.push('/orders')}
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

                    {/* Financial Progress & Timer */}
                    <div className="mb-6 mt-4 relative">
                        <svg className="w-48 h-48 transform -rotate-90">
                            <circle cx="96" cy="96" r="88" stroke="currentColor" strokeWidth="16" fill="transparent" className="text-gray-200" />
                            <circle cx="96" cy="96" r="88" stroke="currentColor" strokeWidth="16" fill="transparent"
                                strokeDasharray={552} strokeDashoffset={552 - (552 * progress) / 100}
                                className={`${groupOrder.status === 'cancelled' ? 'text-red-500' : 'text-primary'} transition-all duration-1000 ease-out`}
                            />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                            {groupOrder.status === 'cancelled' ? (
                                <>
                                    <span className="text-sm text-red-500 font-bold uppercase tracking-wider mb-1">Cancelado</span>
                                    <span className="text-xl font-black text-gray-800">Tempo Esgotado</span>
                                </>
                            ) : (
                                <>
                                    <span className="text-sm text-gray-500 font-bold uppercase tracking-wider mb-1">Restam</span>
                                    <span className="text-3xl font-black text-gray-800">R$ {remaining > 0 ? remaining.toFixed(2) : "0.00"}</span>
                                    <CountDownTimer createdAt={groupOrder.created_at} />
                                </>
                            )}
                        </div>
                    </div>

                    {!isCompleted && (
                        <div className="bg-white p-6 rounded-3xl shadow-md border border-gray-100 flex flex-col items-center w-full max-w-sm mb-8">
                            <h3 className="text-sm font-bold text-gray-500 mb-4 uppercase tracking-widest text-center">QR Code para Dividir</h3>
                            <p className="text-xs text-center text-gray-400 mb-2">Compartilhe este código para que seus amigos paguem.</p>
                            <div className="bg-white p-2 rounded-xl">
                                <QRCode value={payLink} size={160} />
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
                            Pagamentos ({groupOrder.group_order_members.length})
                        </h3>

                        {groupOrder.group_order_members.length === 0 ? (
                            <p className="text-center text-gray-400 py-4 italic">Nenhum pagamento iniciado.</p>
                        ) : (
                            <div className="space-y-4">
                                {groupOrder.group_order_members.map((m, idx) => (
                                    <div key={m.id} className="flex justify-between items-center bg-gray-50 p-3 rounded-xl">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${m.status === 'paid' ? 'bg-green-100 text-green-600' : 'bg-yellow-100 text-yellow-600'}`}>
                                                {m.status === 'paid' ? <Check className="w-4 h-4" /> : <Smartphone className="w-4 h-4" />}
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-sm font-bold text-gray-800">
                                                    {m.email.includes('@') ? m.email.split('@')[0] : m.email}
                                                </span>
                                                <span className="text-xs text-gray-400 font-medium">
                                                    {m.status === 'paid' ? 'Pago' : 'Pix Gerado / Pendente'}
                                                </span>
                                            </div>
                                        </div>
                                        <span className="font-black text-gray-800">R$ {m.share_amount.toFixed(2)}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {!isCompleted && (
                        <>
                            <button
                                onClick={() => router.push(`/pay-split/${id}`)}
                                className="w-full bg-primary text-primary-foreground font-bold py-4 rounded-xl shadow-md hover:brightness-110 mb-4 active:scale-95 transition-all"
                            >
                                Pagar uma parte
                            </button>
                            <button
                                onClick={() => {
                                    if (confirm("Tem certeza que deseja cancelar esta divisão?")) {
                                        // TODO: Call API to cancel group order
                                        router.push('/orders');
                                    }
                                }}
                                className="w-full bg-red-100 text-red-600 font-bold py-4 rounded-xl shadow-sm hover:bg-red-200 mb-8 active:scale-95 transition-all"
                            >
                                Cancelar Grupo
                            </button>
                        </>
                    )}

                    {isCompleted && (
                        <div className="text-center w-full animate-in fade-in slide-in-from-bottom-4 duration-700">
                            <div className="bg-green-100 text-green-800 p-4 rounded-xl font-bold mb-4 flex items-center justify-center gap-2">
                                <Check className="w-5 h-5 bg-green-600 text-white rounded-full p-1" />
                                Conta Finalizada!
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
