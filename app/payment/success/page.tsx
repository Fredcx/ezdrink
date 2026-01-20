"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Check, Home, Maximize2, X, ArrowLeft, Smartphone, ShoppingBag } from "lucide-react";
import QRCode from "react-qr-code";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import confetti from "canvas-confetti";


function PaymentSuccessContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const ticket = searchParams.get('ticket') || "8832";
    const total = searchParams.get('total') || "0.00";
    const method = searchParams.get('method') || "Pix";

    const [isExpanded, setIsExpanded] = useState(false);

    useEffect(() => {
        // Trigger confetti on mount
        const duration = 3 * 1000;
        const animationEnd = Date.now() + duration;
        const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

        const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

        const interval: any = setInterval(function () {
            const timeLeft = animationEnd - Date.now();

            if (timeLeft <= 0) {
                return clearInterval(interval);
            }

            const particleCount = 50 * (timeLeft / duration);
            confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
            confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
        }, 250);

        return () => clearInterval(interval);
    }, []);

    return (
        <div className="fixed inset-0 bg-primary font-sans flex flex-col justify-end">
            {/* Main Sheet */}
            <div className="bg-[#f4f4f5] w-full h-[calc(100vh-24px)] rounded-t-[40px] shadow-2xl overflow-hidden flex flex-col">

                {/* Header */}
                <header className="px-6 py-6 flex items-center justify-between sticky top-0 z-10 bg-[#f4f4f5]/90 backdrop-blur-md">
                    <div className="w-10 h-10" /> {/* Spacer */}
                    <div className="flex flex-col items-center">
                        <h1 className="text-xl font-bold">Pagamento</h1>
                        <span className="text-xs text-gray-500">
                            {ticket ? `Pedido #${ticket}` : "Sucesso"}
                        </span>
                    </div>
                    <div className="w-10" /> {/* Spacer */}
                </header>

                <main className="flex-1 px-6 pb-32 overflow-y-auto scrollbar-hide flex flex-col items-center">
                    <div className="w-full h-px bg-gray-200 mb-8 mx-auto max-w-[200px]" />

                    {/* Illustration / Check */}
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 260, damping: 20 }}
                        className="w-32 h-32 bg-primary/20 rounded-full flex items-center justify-center mb-6 relative shrink-0"
                    >
                        <div className="absolute inset-4 bg-primary rounded-full opacity-20 blur-xl animate-pulse" />
                        <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center shadow-lg relative z-10">
                            <Check className="w-10 h-10 text-white stroke-[3px]" />
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="text-center mb-8"
                    >
                        <h1 className="text-2xl font-extrabold text-black mb-1">
                            Pagamento Confirmado!
                        </h1>
                        <p className="text-gray-500 font-medium text-sm">
                            Seu pedido já foi enviado para a cozinha.
                        </p>
                    </motion.div>

                    {/* QR Code Card (Withdrawal) */}
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.4 }}
                        className="bg-white p-6 rounded-3xl shadow-sm border border-primary/20 flex flex-col items-center w-full max-w-[320px] relative mb-8"
                    >
                        <button
                            onClick={() => setIsExpanded(true)}
                            className="absolute top-4 right-4 text-gray-400 hover:text-black transition-colors"
                        >
                            <Maximize2 className="w-5 h-5" />
                        </button>

                        <div className="bg-white p-2 rounded-xl mb-4">
                            <QRCode
                                value={JSON.stringify({ orderId: ticket, timestamp: Date.now() })}
                                size={180}
                                viewBox={`0 0 256 256`}
                                style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                            />
                        </div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1 text-center">CÓDIGO DE RETIRADA</p>
                        <p className="text-sm font-medium text-gray-500 text-center max-w-[200px]">
                            Mostre este código no balcão para retirar.
                        </p>
                    </motion.div>

                    {/* Info Card */}
                    <div className="w-full max-w-[320px] bg-white rounded-2xl p-5 mb-8 border border-gray-100 shadow-sm">
                        <div className="space-y-3">
                            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                                <span className="text-gray-500 font-medium text-sm">Total pago</span>
                                <span className="text-black font-bold text-base">R$ {parseFloat(total).toFixed(2).replace('.', ',')}</span>
                            </div>
                            <div className="flex justify-between items-center pb-1">
                                <span className="text-gray-500 font-medium text-sm">Forma</span>
                                <span className="text-black font-bold text-base capitalize">{method === 'credit_card' ? 'Cartão de Crédito' : method}</span>
                            </div>
                        </div>
                    </div>


                    {/* Actions */}
                    <div className="w-full space-y-3 mt-auto">
                        <button
                            onClick={() => router.push('/orders')}
                            className="w-full bg-primary text-white font-bold text-lg py-4 rounded-2xl hover:brightness-110 transition-all shadow-md flex items-center justify-center gap-2"
                        >
                            <ShoppingBag className="w-5 h-5" />
                            Ver meus pedidos
                        </button>

                        <button
                            onClick={() => router.push('/')}
                            className="w-full text-gray-400 font-bold text-base py-3 hover:text-black transition-colors flex items-center justify-center gap-2"
                        >
                            <Home className="w-5 h-5" />
                            Voltar ao Início
                        </button>
                    </div>

                </main>
            </div>

            {/* Fullscreen Modal */}
            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 bg-white flex flex-col items-center justify-center p-6"
                        onClick={() => setIsExpanded(false)}
                    >
                        <button
                            onClick={() => setIsExpanded(false)}
                            className="absolute top-6 right-6 p-2 bg-gray-100 rounded-full text-black"
                        >
                            <X className="w-6 h-6" />
                        </button>

                        <h2 className="text-2xl font-bold mb-8">Código de Retirada</h2>

                        <div className="bg-white p-4 rounded-3xl shadow-2xl border border-gray-100 mb-8">
                            <QRCode
                                value={JSON.stringify({ orderId: ticket, timestamp: Date.now() })}
                                size={300}
                                viewBox={`0 0 256 256`}
                                style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                            />
                        </div>
                        <p className="text-gray-500 font-medium text-lg text-center max-w-xs">
                            Mostre este código para retirar seu pedido #{ticket}
                        </p>
                    </motion.div>
                )}
            </AnimatePresence>

        </div>
    );
}

export default function PaymentSuccessPage() {
    return (
        <Suspense fallback={
            <div className="fixed inset-0 bg-[#f4f4f5] flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
        }>
            <PaymentSuccessContent />
        </Suspense>
    );
}
