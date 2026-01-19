"use client";

import { motion } from "framer-motion";
import { ArrowLeft, CreditCard, Smartphone, Landmark, AlertCircle } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";

function PaymentErrorContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const failedMethod = searchParams.get('method') || 'card';

    const getMethodDetails = (id: string) => {
        switch (id) {
            case 'apple': return { name: 'Apple Pay', icon: Smartphone };
            case 'card': return { name: 'Cartão de Crédito', icon: CreditCard };
            default: return { name: 'Método de Pagamento', icon: CreditCard };
        }
    };

    const methodDetails = getMethodDetails(failedMethod);

    return (
        <div className="fixed inset-0 bg-primary font-sans flex flex-col justify-end">
            <motion.div
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
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
                        <h1 className="text-xl font-bold">Verificar pagamento</h1>
                        <span className="text-xs text-gray-500">Meu carrinho</span>
                    </div>
                    <div className="w-10" />
                </header>

                <main className="flex-1 px-6 pb-32 overflow-y-auto scrollbar-hide flex flex-col items-center pt-4">

                    {/* Error Message */}
                    <div className="w-full mb-8 text-center">
                        <h2 className="text-xl font-bold mb-2 flex items-center justify-center gap-2">
                            Forma de pagamento indisponível
                        </h2>
                        <p className="text-gray-500 text-sm leading-relaxed px-2">
                            Parece que seu cartão está sem limite ou saldo. Para fazer o pedido, escolha outra forma de pagamento ou entre em contato com seu banco.
                        </p>
                    </div>

                    {/* Failed Method */}
                    <div className="w-full mb-10">
                        <div className="w-full flex items-center p-4 rounded-2xl border-2 border-red-500 bg-white shadow-sm relative overflow-hidden">
                            <div className="absolute right-0 top-0 bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-bl-lg font-bold">
                                FALHOU
                            </div>
                            <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center mr-4">
                                <methodDetails.icon className="w-5 h-5 text-red-500" />
                            </div>
                            <span className="font-bold text-gray-900">{methodDetails.name}</span>
                        </div>
                    </div>

                    <div className="w-full h-px bg-gray-200 mb-8" />

                    {/* Alternative */}
                    <div className="w-full">
                        <h3 className="font-bold text-lg mb-4 text-left w-full">Escolha outra forma de pagamento</h3>

                        <button
                            onClick={() => router.push('/payment/pix')}
                            className="w-full flex items-center p-4 rounded-2xl border border-transparent bg-white shadow-sm hover:border-primary hover:shadow-md transition-all group"
                        >
                            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center mr-4 group-hover:bg-primary/20 transition-colors">
                                <div className="w-4 h-4 rounded-full border-2 border-gray-300 group-hover:border-primary" />
                            </div>

                            <div className="flex items-center gap-3">
                                <Landmark className="w-5 h-5 text-primary" />
                                <span className="font-semibold text-black">Pix</span>
                            </div>
                        </button>
                    </div>

                </main>
            </motion.div>
        </div>
    );
}

export default function PaymentErrorPage() {
    return (
        <Suspense fallback={<div className="bg-white" />}>
            <PaymentErrorContent />
        </Suspense>
    );
}
