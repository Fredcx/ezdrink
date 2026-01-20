"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { ArrowLeft, Check, Smartphone, User } from "lucide-react";
import { motion } from "framer-motion";

function GuestPaySplitContent() {
    const router = useRouter();
    const params = useParams();
    const searchParams = useSearchParams();
    const id = params.id as string;
    const email = searchParams.get('email');

    const [isLoading, setIsLoading] = useState(false);
    const [amount, setAmount] = useState<number | null>(null);
    const [alreadyPaid, setAlreadyPaid] = useState(false);

    useEffect(() => {
        if (!email) {
            alert("Email não fornecido no link.");
            return;
        }

        // Fetch Group details to see my share
        fetch(`${(process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "")}/api/group-orders/${id}`)
            .then(res => res.json())
            .then(data => {
                if (data.group_order_members) {
                    const me = data.group_order_members.find((m: any) => m.email === email);
                    if (me) {
                        setAmount(me.share_amount);
                        if (me.status === 'paid') setAlreadyPaid(true);
                    } else {
                        alert("Você não faz parte desta divisão.");
                    }
                }
            })
            .catch(err => console.error(err));
    }, [id, email]);

    const handlePay = async () => {
        setIsLoading(true);
        try {
            const res = await fetch(`${(process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "")}/api/group-orders/${id}/pay`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: email,
                    payment_method: 'pix_mock'
                })
            });
            const data = await res.json();

            if (data.success) {
                // Determine user type (if they have token, they are user, else guest)
                // We'll redirect to Lobby anyway
                // Store email in localStorage so Lobby knows who we are if we are guest
                if (!localStorage.getItem('ezdrink_token')) {
                    localStorage.setItem('ezdrink_guest_email', email || '');
                }

                router.push(`/split/${id}`);
            } else {
                alert("Erro: " + data.error);
            }
        } catch (e) {
            alert("Erro de conexão");
        } finally {
            setIsLoading(false);
        }
    };

    if (!amount) return <div className="min-h-screen flex items-center justify-center font-bold">Carregando informações...</div>;

    return (
        <div className="fixed inset-0 bg-primary font-sans flex flex-col justify-end">
            <div className="bg-[#f4f4f5] w-full h-[calc(100vh-24px)] rounded-t-[40px] shadow-2xl overflow-hidden flex flex-col">
                <header className="px-6 py-6 flex items-center justify-between sticky top-0 z-10 bg-[#f4f4f5]/90 backdrop-blur-md">
                    <div className="w-10" />
                    <h1 className="text-xl font-bold">Pagamento Pendente</h1>
                    <div className="w-10" />
                </header>

                <main className="flex-1 px-6 flex flex-col items-center justify-center">

                    <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-sm mb-6">
                        <User className="w-10 h-10 text-primary" />
                    </div>

                    <h2 className="text-2xl font-bold text-center mb-2">Olá, {email?.split('@')[0]}</h2>
                    <p className="text-gray-500 text-center mb-8 max-w-xs">
                        Você foi convidado para dividir a conta. Sua parte é:
                    </p>

                    <h1 className="text-5xl font-extrabold text-primary mb-8 tracking-tight">
                        R$ {amount}
                    </h1>

                    {alreadyPaid ? (
                        <button
                            onClick={() => router.push(`/split/${id}`)}
                            className="w-full bg-green-600 text-white font-bold text-lg py-4 rounded-xl shadow-md"
                        >
                            Já pago! Ver Grupo
                        </button>
                    ) : (
                        <button
                            onClick={handlePay}
                            disabled={isLoading}
                            className="w-full bg-primary text-primary-foreground font-bold text-lg py-4 rounded-xl hover:brightness-110 transition-all shadow-md flex items-center justify-center gap-2"
                        >
                            {isLoading ? "Processando..." : (
                                <>
                                    <Smartphone className="w-5 h-5" />
                                    Pagar com Pix
                                </>
                            )}
                        </button>
                    )}

                    <p className="mt-4 text-xs text-center text-gray-400">
                        Ambiente Seguro EzDrink
                    </p>
                </main>
            </div>
        </div>
    );
}

export default function GuestPaySplitPage() {
    return (
        <Suspense fallback={
            <div className="fixed inset-0 bg-[#f4f4f5] flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
        }>
            <GuestPaySplitContent />
        </Suspense>
    );
}
