"use client";

import { motion } from "framer-motion";
import { ArrowLeft, CreditCard, DollarSign, Check, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AddCardModal } from "@/components/AddCardModal";

export default function BalancePage() {
    const router = useRouter();
    const [balance, setBalance] = useState(0);
    const [amount, setAmount] = useState(50);
    const [customAmount, setCustomAmount] = useState("");
    const [cards, setCards] = useState<any[]>([]);
    const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);
    const [success, setSuccess] = useState(false);

    // Modal
    const [isAddCardOpen, setIsAddCardOpen] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const token = localStorage.getItem('ezdrink_token');
            if (!token) {
                router.push('/login');
                return;
            }

            // Fetch Balance
            const balRes = await fetch('http://localhost:3001/api/balance', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const balData = await balRes.json();
            if (balData.balance !== undefined) setBalance(balData.balance);

            // Fetch Cards
            const cardsRes = await fetch('http://localhost:3001/api/cards', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const cardsData = await cardsRes.json();
            if (Array.isArray(cardsData)) {
                setCards(cardsData);
                if (cardsData.length > 0) setSelectedCardId(cardsData[0].id);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleAmountSelect = (val: number) => {
        setAmount(val);
        setCustomAmount("");
    };

    const handleCustomAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value.replace(/\D/g, "");
        setCustomAmount(val);
        if (val) setAmount(Number(val));
        else setAmount(0);
    };

    const handleAddBalance = async () => {
        if (!selectedCardId) {
            alert("Selecione uma forma de pagamento");
            return;
        }

        if (amount <= 0) {
            alert("Selecione um valor válido");
            return;
        }

        // Handle Pix / Apple special flows
        if (selectedCardId === 'pix') {
            router.push(`/payment/pix?amount=${amount}&type=balance`);
            return;
        }

        if (selectedCardId === 'apple') {
            alert("Apple Pay indisponível no momento.");
            return;
        }

        const selectedCard = cards.find(c => c.id === selectedCardId);

        setProcessing(true);
        try {
            const token = localStorage.getItem('ezdrink_token');
            const res = await fetch('http://localhost:3001/api/balance/add', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    amount: amount,
                    payment_method: 'credit_card',
                    // If card has 'raw' (temp), send it. Otherwise send card_id for lookup.
                    // @ts-ignore
                    card_raw: selectedCard?.raw || undefined,
                    card_id: selectedCard?.raw ? undefined : selectedCardId
                })
            });
            const data = await res.json();

            if (data.success) {
                setSuccess(true);
                setBalance(data.balance);
                // Redirect to Success Screen
                router.push(`/payment/pending?success=true&type=deposit&total=${amount}&id=${data.pagarme_id}`);
            } else {
                alert(data.message || "Erro ao adicionar saldo");
            }
        } catch (error) {
            console.error(error);
            alert("Erro de conexão");
        } finally {
            setProcessing(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-primary font-sans flex flex-col justify-end">
            <div className="bg-[#f4f4f5] w-full h-[calc(100vh-24px)] rounded-t-[40px] shadow-2xl overflow-hidden flex flex-col">
                {/* Header */}
                <header className="px-6 py-6 flex items-center justify-between sticky top-0 z-10 bg-[#f4f4f5]/90 backdrop-blur-md">
                    <button onClick={() => router.back()} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-black/5 transition-colors">
                        <ArrowLeft className="w-6 h-6" />
                    </button>
                    <div className="flex flex-col items-center">
                        <h1 className="text-xl font-bold">Adicionar Saldo</h1>
                        <span className="text-xs text-gray-500">Carteira EzDrink</span>
                    </div>
                    <div className="w-10" />
                </header>

                <main className="flex-1 px-6 pb-32 overflow-y-auto scrollbar-hide">
                    {/* Balance Display - Simple */}
                    <div className="text-center mb-8 mt-4">
                        <p className="text-gray-500 text-sm font-bold uppercase tracking-wider mb-1">Saldo Atual</p>
                        <h2 className="text-4xl font-black text-green-500">
                            R$ {loading ? "..." : balance.toFixed(2).replace('.', ',')}
                        </h2>
                    </div>

                    {/* Amount Selection */}
                    <div className="mb-8">
                        <h3 className="text-gray-500 text-sm font-bold uppercase tracking-wider mb-4 px-1">Recarregar</h3>
                        <div className="grid grid-cols-2 gap-3 mb-4">
                            {[20, 50, 100, 200].map((val) => (
                                <button
                                    key={val}
                                    onClick={() => handleAmountSelect(val)}
                                    className={`relative py-6 rounded-2xl font-bold transition-all text-xl ${amount === val && !customAmount
                                        ? "bg-white border-2 border-primary shadow-lg text-black"
                                        : "bg-white border-2 border-transparent hover:border-gray-200 text-gray-600 shadow-sm"
                                        }`}
                                >
                                    R$ {val}
                                    {amount === val && !customAmount && (
                                        <div className="absolute top-2 right-2 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                                            <Check className="w-3 h-3 text-white" />
                                        </div>
                                    )}
                                </button>
                            ))}
                        </div>
                        <div className="bg-white rounded-2xl p-4 flex items-center shadow-sm border border-transparent focus-within:border-primary transition-colors">
                            <DollarSign className="w-5 h-5 text-gray-400 mr-2" />
                            <input
                                type="text"
                                placeholder="Outro valor..."
                                value={customAmount}
                                onChange={handleCustomAmountChange}
                                className="flex-1 font-bold outline-none text-gray-900 placeholder-gray-300"
                            />
                        </div>
                    </div>

                    {/* Payment Method */}
                    <div className="mb-8">
                        <div className="flex items-center justify-between mb-4 px-1">
                            <h3 className="text-gray-500 text-sm font-bold uppercase tracking-wider">Forma de Pagamento</h3>
                            <button
                                onClick={() => setIsAddCardOpen(true)}
                                className="text-primary text-xs font-bold hover:underline"
                            >
                                + Adicionar Cartão
                            </button>
                        </div>

                        <div className="space-y-3">
                            {/* Pix Option */}
                            <button
                                onClick={() => setSelectedCardId('pix')}
                                className={`w-full flex items-center justify-between p-4 rounded-3xl border transition-all duration-200 ${selectedCardId === 'pix'
                                    ? "bg-white border-primary shadow-[0_0_0_2px_#47f15a]"
                                    : "bg-white border-transparent shadow-sm hover:shadow-md"
                                    }`}
                            >
                                <div className="flex items-center gap-4">
                                    {/* Simple Pix Icon or Placeholder */}
                                    <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 font-bold text-xs">PIX</div>
                                    <span className="font-bold text-gray-900">Pix</span>
                                </div>
                                {selectedCardId === 'pix' && (
                                    <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                                        <Check className="w-3 h-3 text-white" />
                                    </div>
                                )}
                            </button>

                            {/* Apple Pay Option */}
                            <button
                                onClick={() => setSelectedCardId('apple')}
                                className={`w-full flex items-center justify-between p-4 rounded-3xl border transition-all duration-200 ${selectedCardId === 'apple'
                                    ? "bg-white border-primary shadow-[0_0_0_2px_#47f15a]"
                                    : "bg-white border-transparent shadow-sm hover:shadow-md"
                                    }`}
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 font-bold text-xs"></div>
                                    <span className="font-bold text-gray-900">Apple Pay</span>
                                </div>
                                {selectedCardId === 'apple' && (
                                    <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                                        <Check className="w-3 h-3 text-white" />
                                    </div>
                                )}
                            </button>

                            {cards.map((card) => (
                                <button
                                    key={card.id}
                                    onClick={() => setSelectedCardId(card.id)}
                                    className={`w-full flex items-center justify-between p-4 rounded-3xl border transition-all duration-200 ${selectedCardId === card.id
                                        ? "bg-white border-primary shadow-[0_0_0_2px_#47f15a]"
                                        : "bg-white border-transparent shadow-sm hover:shadow-md"
                                        }`}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-600">
                                            <CreditCard className="w-5 h-5" />
                                        </div>
                                        <div className="flex flex-col items-start">
                                            <span className="font-bold text-gray-900 capitalize">{card.brand}</span>
                                            <span className="text-xs text-gray-500 font-medium">•••• {card.last4}</span>
                                        </div>
                                    </div>
                                    {selectedCardId === card.id && (
                                        <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                                            <Check className="w-3 h-3 text-white" />
                                        </div>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>
                </main>

                <div className="p-6 bg-white border-t border-gray-100 shadow-lg">
                    {success ? (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-green-100 text-green-700 py-4 rounded-xl font-bold text-center flex items-center justify-center gap-2"
                        >
                            <Check className="w-5 h-5" />
                            Recarga Confirmada!
                        </motion.div>
                    ) : (
                        <button
                            disabled={processing || !selectedCardId || amount <= 0}
                            onClick={handleAddBalance}
                            className={`w-full font-bold text-lg py-4 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 ${processing || !selectedCardId || amount <= 0
                                ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                                : "bg-primary text-primary-foreground hover:brightness-110"
                                }`}
                        >
                            {processing && <Loader2 className="w-5 h-5 animate-spin" />}
                            {processing ? "Processando..." : `Confirmar R$ ${amount.toFixed(2)}`}
                        </button>
                    )}
                </div>
            </div>

            <AddCardModal
                isOpen={isAddCardOpen}
                onClose={() => setIsAddCardOpen(false)}
                onSave={(newCard) => {
                    setCards([...cards, newCard]);
                    setSelectedCardId(newCard.id || null);
                    setIsAddCardOpen(false);
                }}
            />
        </div>
    );
}
