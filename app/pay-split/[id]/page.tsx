"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { ArrowLeft, Check, Smartphone, User, RefreshCw, Copy } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import QRCode from "react-qr-code";

function GuestPaySplitContent() {
    const router = useRouter();
    const params = useParams();
    const searchParams = useSearchParams();
    const id = params.id as string;

    const [isLoading, setIsLoading] = useState(false);
    const [name, setName] = useState("");
    const [customAmount, setCustomAmount] = useState<string>("");
    const [cpf, setCpf] = useState("");

    // Payment Success / QR State
    const [qrCode, setQrCode] = useState<string | null>(null);
    const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);
    const [paymentSuccess, setPaymentSuccess] = useState(false);

    // Initial fetch to get max amount? (Optional, skipping for speed)

    const handlePay = async () => {
        if (!name || !customAmount || !cpf) {
            alert("Preencha todos os campos!");
            return;
        }

        const amountNum = parseFloat(customAmount.replace('R$', '').replace(',', '.'));
        if (isNaN(amountNum) || amountNum <= 0) {
            alert("Valor inválido");
            return;
        }

        if (cpf.length < 11) {
            alert("CPF Inválido");
            return;
        }

        setIsLoading(true);
        try {
            const res = await fetch(`${(process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "")}/api/group-orders/${id}/pay`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: name, // Using Name as Identifier for 'Guests'
                    cpf: cpf.replace(/\D/g, ''),
                    amount: amountNum, // Now sending custom amount
                    payment_method: 'pix'
                })
            });
            const data = await res.json();

            if (data.success) {
                if (data.qr_code) {
                    setQrCode(data.qr_code);
                    setQrCodeUrl(data.qr_code_url);
                } else {
                    // Assuming instant success/simulated
                    setPaymentSuccess(true);
                }
            } else {
                alert("Erro: " + data.error);
            }
        } catch (e) {
            alert("Erro de conexão");
        } finally {
            setIsLoading(false);
        }
    };

    const handleCopy = () => {
        if (qrCode) {
            navigator.clipboard.writeText(qrCode);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const handleCheckPaymentStatus = async () => {
        // Logic to check if *this* specific payment was paid? 
        // For real Pagar.me, we just wait for webhook or poll.
        // For now, let's allow user to click "I Paid" which redirects to the Group Lobby to see if it updated.
        router.push(`/split/${id}`);
    };

    // --- RENDER ---

    if (qrCode) {
        return (
            <div className="fixed inset-0 bg-primary font-sans flex flex-col items-center justify-center p-6">
                <div className="bg-white p-8 rounded-[32px] w-full max-w-sm shadow-2xl flex flex-col items-center">
                    <h2 className="text-xl font-bold mb-2">Escaneie para Pagar</h2>
                    <p className="text-gray-500 mb-6 text-sm">Use o App do seu banco</p>

                    <div className="bg-gray-100 p-4 rounded-2xl mb-6">
                        <QRCode value={qrCode} size={200} />
                    </div>

                    <div className="w-full space-y-3">
                        <button
                            onClick={handleCopy}
                            className="w-full bg-gray-100 text-black font-bold py-4 rounded-xl flex items-center justify-center gap-2 hover:bg-gray-200 transition-all"
                        >
                            {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                            {copied ? "Código Copiado!" : "Copiar Código Pix"}
                        </button>

                        <button
                            onClick={handleCheckPaymentStatus}
                            className="w-full bg-primary text-black font-bold py-4 rounded-xl shadow-lg hover:brightness-110 transition-all animate-pulse"
                        >
                            Já paguei!
                        </button>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="fixed inset-0 bg-primary font-sans flex flex-col justify-end">
            <div className="bg-[#f4f4f5] w-full h-[calc(100vh-24px)] rounded-t-[40px] shadow-2xl overflow-hidden flex flex-col">
                <header className="px-6 py-6 flex items-center justify-between sticky top-0 z-10 bg-[#f4f4f5]/90 backdrop-blur-md">
                    <button onClick={() => router.push(`/split/${id}`)} className="p-2 hover:bg-black/5 rounded-full">
                        <ArrowLeft className="w-6 h-6" />
                    </button>
                    <h1 className="text-xl font-bold">Pagar Parcela</h1>
                    <div className="w-10" />
                </header>

                <main className="flex-1 px-6 flex flex-col items-center justify-center -mt-20">

                    <div className="w-full max-w-xs space-y-6">

                        <div>
                            <label className="block text-sm font-bold text-gray-400 mb-2 ml-1 uppercase tracking-wider">Seu Nome / Identificador</label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Ex: João Silva"
                                className="w-full p-4 border-2 border-transparent bg-white rounded-2xl text-lg font-bold focus:border-primary focus:outline-none transition-all shadow-sm"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-gray-400 mb-2 ml-1 uppercase tracking-wider">Valor a Pagar (R$)</label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">R$</span>
                                <input
                                    type="number"
                                    value={customAmount}
                                    onChange={(e) => setCustomAmount(e.target.value)}
                                    placeholder="0,00"
                                    className="w-full p-4 pl-12 border-2 border-transparent bg-white rounded-2xl text-2xl font-black text-primary focus:border-primary focus:outline-none transition-all shadow-sm"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-gray-400 mb-2 ml-1 uppercase tracking-wider">CPF (Para o Pix)</label>
                            <input
                                type="text"
                                value={cpf}
                                onChange={(e) => setCpf(e.target.value)}
                                placeholder="000.000.000-00"
                                className="w-full p-4 border-2 border-transparent bg-white rounded-2xl text-lg font-bold focus:border-primary focus:outline-none transition-all shadow-sm"
                            />
                        </div>

                        <button
                            onClick={handlePay}
                            disabled={isLoading || !name || !customAmount || !cpf}
                            className="w-full bg-primary text-black font-extrabold text-xl py-5 rounded-2xl shadow-xl hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 mt-8 disabled:opacity-50 disabled:scale-100"
                        >
                            {isLoading ? "Gerando Pix..." : (
                                <>
                                    <Smartphone className="w-6 h-6" />
                                    Gerar Pix
                                </>
                            )}
                        </button>

                    </div>

                </main>
            </div>
        </div>
    );
}

export default function GuestPaySplitPage() {
    return (
        <Suspense fallback={<div>Carregando...</div>}>
            <GuestPaySplitContent />
        </Suspense>
    );
}
