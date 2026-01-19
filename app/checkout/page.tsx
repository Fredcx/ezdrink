"use client";

import { motion } from "framer-motion";
import { ArrowLeft, CreditCard, Landmark, Smartphone, Wallet, Check } from "lucide-react"; // Using available icons
import { useRouter } from "next/navigation";
import { useCart } from "@/context/CartContext";
import { useEffect, useState } from "react";

import { OrderReviewModal } from "@/components/OrderReviewModal";

import { AddCardModal } from "@/components/AddCardModal";

export default function CheckoutPage() {
    const router = useRouter();
    const { total, items, clearCart } = useCart();

    // State
    const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
    const [isReviewOpen, setIsReviewOpen] = useState(false);
    const [isAddCardOpen, setIsAddCardOpen] = useState(false);
    const [savedCards, setSavedCards] = useState<{ id: string, brand: string, last4: string }[]>([]);
    const [balance, setBalance] = useState(0);

    useEffect(() => {
        fetchCards();
    }, []);

    const fetchCards = async () => {
        try {
            const token = localStorage.getItem('ezdrink_token');
            if (!token) return;

            // Fetch Cards
            const res = await fetch(`${(process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "")}/api/cards`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (Array.isArray(data)) {
                setSavedCards(data);
                // Pre-select logic...
            }

            // Fetch Balance
            const balRes = await fetch(`${(process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "")}/api/balance`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const balData = await balRes.json();
            if (balData.balance !== undefined) setBalance(balData.balance);
            else setBalance(0); // Default to 0 if undefined

        } catch (err) {
            console.error("Erro ao carregar dados", err);
        }
    };

    // Handle Adding New Card
    const handleSaveCard = (card: { id?: string, last4: string; brand: string }) => {
        // Refresh list instead of manual add to ensure sync
        fetchCards();
        if (card.id) setSelectedMethod(card.id);
        setIsAddCardOpen(false);
    };

    const handleDeleteCard = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation(); // Prevent selecting the card when clicking delete
        if (!confirm("Remover este cartão?")) return;

        try {
            const token = localStorage.getItem('ezdrink_token');
            await fetch(`${(process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "")}/api/cards/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            fetchCards();
            if (selectedMethod === id) setSelectedMethod(null);
        } catch (err) {
            alert("Erro ao remover cartão");
        }
    };

    // Redirect if cart empty
    useEffect(() => {
        if (items.length === 0) {
            router.push("/");
        }
    }, [items, router]);

    const finalTotal = total + 3.75;

    const handleConfirmOrder = async () => {
        if (selectedMethod === 'pix') {
            router.push(`/payment/pix?amount=${finalTotal}`);
        } else if (selectedMethod === 'cash') {
            try {
                const res = await fetch(`${(process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "")}/api/orders/create-cash`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('ezdrink_token')}`
                    },
                    body: JSON.stringify({ cart: items })
                });
                const data = await res.json();
                if (data.success) {
                    clearCart();
                    router.push(`/payment/pending?ticket=${data.ticketCode}&total=${data.total}`);
                } else {
                    alert("Erro ao criar pedido: " + data.error);
                }
            } catch (error) {
                console.error(error);
                alert("Erro de conexão");
            }
        } else if (selectedMethod === 'balance') {
            // REAL Balance Payment
            try {
                const res = await fetch(`${(process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "")}/api/orders/create-balance`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('ezdrink_token')}`
                    },
                    body: JSON.stringify({ cart: items })
                });
                const data = await res.json();

                if (data.success) {
                    // Redirect to success/pending with balance flag
                    router.push(`/payment/pending?ticket=${data.orderId}&total=${data.total}&success=true&method=balance&type=order`);
                } else {
                    router.push(`/payment/error?method=balance&error=${encodeURIComponent(data.error || "Erro no pagamento")}`);
                }
            } catch (error) {
                console.error(error);
                router.push(`/payment/error?method=balance`);
            }
        } else if (selectedMethod === 'apple' || savedCards.find(c => c.id === selectedMethod)) {
            if (selectedMethod === 'apple') {
                router.push(`/payment/error?method=apple`);
            } else {
                // REAL CARD FLOW
                try {
                    const res = await fetch(`${(process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "")}/api/orders/create-card`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${localStorage.getItem('ezdrink_token')}`
                        },
                        body: JSON.stringify({
                            cart: items,
                            card_id: selectedMethod
                        })
                    });
                    const data = await res.json();

                    if (data.success) {
                        // Redirect to success/pending with balance flag
                        router.push(`/payment/pending?ticket=${data.orderId}&total=${data.total}&success=true&type=order`);
                    } else {
                        // Redirect to error page with message
                        const encodedError = encodeURIComponent(data.error || "Pagamento recusado");
                        router.push(`/payment/error?method=card&error=${encodedError}`);
                    }
                } catch (err) {
                    console.error(err);
                    router.push(`/payment/error?method=card&error=Erro de Conexão`);
                }
            }
        } else {
            alert("Fluxo indefinido");
        }
    };

    const getPaymentMethodName = () => {
        if (selectedMethod === 'balance') return "Saldo EzDrink";
        if (selectedMethod === 'pix') return "Pix";
        if (selectedMethod === 'apple') return "Apple Pay";

        const card = savedCards.find(c => c.id === selectedMethod);
        if (card) return `Cartão final ${card.last4}`;

        return "Pagamento";
    }

    return (
        <div className="fixed inset-0 bg-primary font-sans flex flex-col justify-end">
            <div
                className="bg-[#f4f4f5] w-full h-[calc(100vh-24px)] rounded-t-[40px] shadow-2xl overflow-hidden flex flex-col"
            >
                <header className="px-6 py-6 flex items-center justify-between sticky top-0 z-10 bg-[#f4f4f5]/90 backdrop-blur-md">
                    <button
                        onClick={() => router.back()}
                        className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-black/5 transition-colors"
                    >
                        <ArrowLeft className="w-6 h-6" />
                    </button>
                    <div className="flex flex-col items-center">
                        <h1 className="text-xl font-bold">Pagamento</h1>
                        <span className="text-xs text-gray-500">Meu carrinho</span>
                    </div>
                    <div className="w-10" />
                </header>

                <main className="flex-1 px-6 pb-32 overflow-y-auto scrollbar-hide">
                    <div className="w-full h-px bg-gray-200 mb-8 mx-auto max-w-[200px]" />

                    {/* Payment Methods */}
                    {/* Main Payment Sections */}
                    <div className="space-y-6 mb-8">

                        {/* Balance Section */}
                        <section>
                            <h3 className="text-gray-500 text-sm font-bold uppercase tracking-wider mb-3 px-1">Seu Saldo</h3>
                            <div
                                onClick={() => setSelectedMethod('balance')}
                                className={`w-full flex items-center justify-between p-4 rounded-3xl border transition-all duration-200 cursor-pointer ${selectedMethod === 'balance'
                                    ? "bg-white border-primary shadow-[0_0_0_2px_#47f15a]"
                                    : "bg-white border-transparent shadow-sm hover:shadow-md"
                                    }`}
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center text-primary">
                                        <Wallet className="w-6 h-6" />
                                    </div>
                                    <div className="flex flex-col items-start">
                                        <span className="font-bold text-lg text-gray-900">Saldo EzDrink</span>
                                        <span className={`text-sm font-bold ${balance >= finalTotal ? "text-green-600" : "text-red-500"}`}>
                                            R$ {balance.toFixed(2).replace('.', ',')} disponível
                                        </span>
                                    </div>
                                </div>

                                {balance < finalTotal && selectedMethod !== 'balance' && (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            router.push('/wallet/deposit');
                                        }}
                                        className="ml-auto bg-black text-white text-xs font-bold px-3 py-1.5 rounded-full hover:bg-gray-800"
                                    >
                                        Recarregar
                                    </button>
                                )}

                                {selectedMethod === 'balance' ? (
                                    <div className="w-6 h-6 bg-primary rounded-full border-2 border-primary flex items-center justify-center">
                                        <Check className="w-4 h-4 text-white" />
                                    </div>
                                ) : (
                                    <div className="w-6 h-6 rounded-full border-2 border-gray-300" />
                                )}
                            </div>
                        </section>

                        {/* Cards Section */}
                        <section>
                            <div className="flex items-center justify-between mb-3 px-1">
                                <h3 className="text-gray-500 text-sm font-bold uppercase tracking-wider">Meus Cartões</h3>
                                <button
                                    onClick={() => setIsAddCardOpen(true)}
                                    className="bg-primary/10 text-primary px-3 py-1.5 rounded-full text-xs font-bold hover:bg-primary/20 transition-colors"
                                >
                                    + Adicionar
                                </button>
                            </div>

                            <div className="space-y-3">
                                {savedCards.map((card) => (
                                    <button
                                        key={card.id}
                                        onClick={() => setSelectedMethod(card.id)}
                                        className={`w-full flex items-center justify-between p-4 rounded-3xl border transition-all duration-200 ${selectedMethod === card.id
                                            ? "bg-white border-primary shadow-[0_0_0_2px_#47f15a]"
                                            : "bg-white border-transparent shadow-sm hover:shadow-md"
                                            }`}
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-gray-600">
                                                <CreditCard className="w-6 h-6" />
                                            </div>
                                            <div className="flex flex-col items-start">
                                                <span className="font-bold text-lg text-gray-900 capitalize">{card.brand}</span>
                                                <span className="text-sm text-gray-500 font-medium">•••• •••• •••• {card.last4}</span>
                                            </div>
                                        </div>

                                        {/* Checkbox Visual */}
                                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${selectedMethod === card.id
                                            ? "bg-primary border-primary"
                                            : "bg-transparent border-gray-300"
                                            }`}>
                                            {selectedMethod === card.id && (
                                                <Check className="w-4 h-4 text-white" />
                                            )}
                                        </div>
                                    </button>
                                ))}

                                <button
                                    onClick={() => router.push('/wallet/cards')}
                                    className="w-full py-3 bg-gray-100 rounded-2xl text-gray-500 text-xs font-bold hover:bg-gray-200 transition-colors uppercase tracking-wide"
                                >
                                    Ver todos os cartões
                                </button>
                            </div>
                        </section>

                        {/* Other Methods */}
                        <section>
                            <h3 className="text-gray-500 text-sm font-bold uppercase tracking-wider mb-3 px-1">Outras formas</h3>
                            <div className="grid grid-cols-3 gap-3">
                                <button
                                    onClick={() => setSelectedMethod('pix')}
                                    className={`flex flex-col items-center justify-center p-4 rounded-3xl border h-24 transition-all duration-200 ${selectedMethod === 'pix'
                                        ? "bg-white border-primary shadow-[0_0_0_2px_#47f15a]"
                                        : "bg-white border-transparent shadow-sm hover:shadow-md"
                                        }`}
                                >
                                    <Landmark className={`w-8 h-8 mb-2 ${selectedMethod === 'pix' ? 'text-primary' : 'text-gray-400'}`} />
                                    <span className="font-bold text-gray-900 text-xs">Pix</span>
                                </button>

                                <button
                                    onClick={() => setSelectedMethod('apple')}
                                    className={`flex flex-col items-center justify-center p-4 rounded-3xl border h-24 transition-all duration-200 ${selectedMethod === 'apple'
                                        ? "bg-white border-primary shadow-[0_0_0_2px_#47f15a]"
                                        : "bg-white border-transparent shadow-sm hover:shadow-md"
                                        }`}
                                >
                                    <Smartphone className={`w-8 h-8 mb-2 ${selectedMethod === 'apple' ? 'text-primary' : 'text-gray-400'}`} />
                                    <span className="font-bold text-gray-900 text-xs">Apple Pay</span>
                                </button>

                                <button
                                    onClick={() => setSelectedMethod('cash')}
                                    className={`flex flex-col items-center justify-center p-4 rounded-3xl border h-24 transition-all duration-200 ${selectedMethod === 'cash'
                                        ? "bg-white border-primary shadow-[0_0_0_2px_#47f15a]"
                                        : "bg-white border-transparent shadow-sm hover:shadow-md"
                                        }`}
                                >
                                    <div className={`w-8 h-8 mb-2 flex items-center justify-center rounded-full font-bold ${selectedMethod === 'cash' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}>$</div>
                                    <span className="font-bold text-gray-900 text-xs">Dinheiro</span>
                                </button>
                            </div>
                        </section>
                    </div>

                    {/* Summary */}
                    <section className="bg-white p-6 rounded-3xl shadow-sm">
                        <h2 className="font-bold text-lg mb-4">Resumo de valores</h2>
                        <div className="space-y-3">
                            <div className="flex justify-between items-center font-bold text-lg">
                                <span>Subtotal</span>
                                <span>R${total.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between items-center font-bold text-sm text-gray-500">
                                <span>Taxa</span>
                                <span>R$3,75</span>
                            </div>
                            <div className="border-t border-dashed border-black/20 my-2" />
                            <div className="flex justify-between items-center font-bold text-xl">
                                <span>Total</span>
                                <span>R${finalTotal.toFixed(2)}</span>
                            </div>
                        </div>
                    </section>
                </main>

                <div className="p-6 bg-white border-t border-gray-100 shadow-lg">
                    <button
                        disabled={!selectedMethod}
                        onClick={() => setIsReviewOpen(true)}
                        className={`w-full font-bold text-lg py-4 rounded-xl transition-all shadow-md flex items-center justify-center ${selectedMethod
                            ? "bg-primary text-primary-foreground hover:brightness-110"
                            : "bg-gray-200 text-gray-400 cursor-not-allowed"
                            }`}
                    >
                        Revisar pedido - R${finalTotal.toFixed(2)}
                    </button>
                </div>
            </div >

            <OrderReviewModal
                isOpen={isReviewOpen}
                onClose={() => setIsReviewOpen(false)}
                onConfirm={handleConfirmOrder}
                total={finalTotal}
                paymentMethodName={getPaymentMethodName()}
                items={items}
            />
            <AddCardModal
                isOpen={isAddCardOpen}
                onClose={() => setIsAddCardOpen(false)}
                onSave={handleSaveCard}
            />
        </div >
    );
}
