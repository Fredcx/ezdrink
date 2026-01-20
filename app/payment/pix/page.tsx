"use client";

import { motion } from "framer-motion";
import { ArrowLeft, Copy, Check, Smartphone } from "lucide-react";
import QRCode from "react-qr-code";
import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import { useCart } from "@/context/CartContext";

function PixPaymentContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { total } = useCart();
    const [copied, setCopied] = useState(false);

    // Logic to determine amount
    const amountParam = searchParams.get('amount');
    const displayAmount = amountParam ? parseFloat(amountParam) : (total + 3.75);

    // Timer State
    const initialTime = 600; // 10 minutes
    const [timeLeft, setTimeLeft] = useState(initialTime);

    const pixCode = searchParams.get('qr_code') || "00020126580014BR.GOV.BCB.PIX0136123e4567-e89b-12d3-a456-426614174000520400005303986540510.005802BR5913Ez Drink Ltd6008Brasilia62070503***6304E2CA";
    const ticket = searchParams.get('ticket');

    useEffect(() => {
        const timer = setInterval(() => {
            setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(pixCode);
        setCopied(true);
        setTimeout(() => setCopied(false), 3000);
    };

    const progressPercentage = (timeLeft / initialTime) * 100;

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
                        <span className="text-xs text-gray-500">{ticket ? `Pedido #${ticket}` : "Meu carrinho"}</span>
                    </div>
                    <div className="w-10" />
                </header>

                <main className="flex-1 px-6 pb-32 overflow-y-auto scrollbar-hide flex flex-col items-center">
                    <div className="w-full h-px bg-gray-200 mb-8 mx-auto max-w-[200px]" />

                    {/* Illustration */}
                    <div className="w-32 h-32 bg-primary/20 rounded-full flex items-center justify-center mb-6 relative">
                        <div className="absolute inset-4 bg-primary rounded-full opacity-20 blur-xl animate-pulse" />
                        <Smartphone className="w-14 h-14 text-primary relative z-10" />
                    </div>

                    <h2 className="text-xl font-bold text-center mb-1">Pedido aguardando pagamento</h2>
                    <h1 className="text-4xl font-extrabold text-center text-primary mb-4 tracking-tight">
                        R$ {displayAmount.toFixed(2).replace('.', ',')}
                    </h1>

                    {/* QR Code Visual */}
                    <div className="bg-white p-4 rounded-3xl shadow-sm border border-gray-200 mb-6 flex flex-col items-center">
                        <QRCode
                            value={pixCode}
                            size={200}
                            style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                            viewBox={`0 0 256 256`}
                        />
                        <p className="mt-4 text-xs font-bold text-gray-400 uppercase tracking-widest text-center">
                            Escaneie com seu app do banco
                        </p>
                    </div>

                    <p className="text-gray-500 text-sm text-center px-4 mb-4">
                        Ou copie o código abaixo para usar o Pix Copia e Cola:
                    </p>

                    {/* Copy Paste Field */}
                    <button
                        onClick={handleCopy}
                        className="w-full bg-white p-4 rounded-xl border border-gray-200 flex items-center justify-between gap-3 shadow-sm mb-10 group hover:border-primary transition-colors">
                        <p className="flex-1 font-mono text-xs text-gray-400 truncate text-left">
                            {pixCode}
                        </p>
                        <Copy className="w-5 h-5 text-gray-400 group-hover:text-primary transition-colors" />
                    </button>

                    {/* Timer Section */}
                    <div className="w-full mb-8">
                        <p className="text-sm font-bold text-gray-700 mb-2">O tempo para você pagar acaba em</p>
                        <h3 className="text-4xl font-extrabold text-black mb-2">{formatTime(timeLeft)}</h3>

                        {/* Progress Bar */}
                        <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                            <motion.div
                                initial={{ width: "100%" }}
                                animate={{ width: `${progressPercentage}%` }}
                                transition={{ ease: "linear", duration: 1 }}
                                className="h-full bg-primary"
                            />
                        </div>
                    </div>

                    <button
                        onClick={handleCopy}
                        className={`w-full font-bold text-lg py-4 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 mb-4 ${copied
                            ? "bg-green-600 text-white"
                            : "bg-primary text-primary-foreground hover:brightness-110"
                            }`}
                    >
                        {copied ? <Check className="w-6 h-6" /> : <Copy className="w-6 h-6" />}
                        {copied ? "Código Copiado!" : "Copiar código"}
                    </button>

                    <button
                        onClick={() => router.push('/orders')}
                        className="text-sm text-gray-500 font-bold hover:text-black transition-colors"
                    >
                        Já realizei o pagamento
                    </button>

                </main>
            </div>
        </div>
    );
}

export default function PixPaymentPage() {
    return (
        <Suspense fallback={
            <div className="fixed inset-0 bg-[#f4f4f5] flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
        }>
            <PixPaymentContent />
        </Suspense>
    );
}
