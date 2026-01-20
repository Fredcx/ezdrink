"use client";

import { useAuth } from "@/context/AuthContext";
import { ArrowLeft, Mail, Smartphone, RefreshCw } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState, useEffect } from "react";

function RegisterVerifyContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { login } = useAuth(); // If we need to login

    const phone = searchParams.get('phone');
    const email = searchParams.get('email');

    // Steps: 'method' (choose SMS/Email) -> 'code' (enter code)
    const [step, setStep] = useState<"method" | "code">("method");
    const [otp, setOtp] = useState("");
    const [loading, setLoading] = useState(false);

    // Timer State
    const [timeLeft, setTimeLeft] = useState(0);

    // Timer Logic
    useEffect(() => {
        if (timeLeft <= 0) return;
        const interval = setInterval(() => {
            setTimeLeft(prev => prev - 1);
        }, 1000);
        return () => clearInterval(interval);
    }, [timeLeft]);

    if (!phone && !email) {
        return <div className="p-10 font-bold">Dados ausentes.</div>
    }

    const handleMethodSelect = async (method: string) => {
        setLoading(true);
        try {
            // Using email for now as backend only has email OTP implemented in 'server.js' snippet I saw
            // If phone logic exists, we can use it.
            // Assuming email only for MVP robustness based on Login page.

            const res = await fetch(`${(process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "")}/api/auth/otp/request`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: email || "nomail@nomail.com" }) // Fallback if phone only...
            });

            if (res.ok) {
                setStep("code");
                setTimeLeft(60); // Start 60s cooldown
            } else {
                alert("Erro ao enviar código.");
            }
        } catch (e) {
            alert("Erro de conexão.");
        } finally {
            setLoading(false);
        }
    };

    const handleResend = () => {
        if (timeLeft > 0) return;
        handleMethodSelect('resend');
    };

    const handleVerifyDisplay = async () => {
        setLoading(true);
        try {
            // We use 'otp/verify'.
            // Note: 'verify' checks if user exists.
            // If user exists -> returns 'login_pin' action.
            // If user new -> returns 'register' action.
            // This 'Verify' page is usually for Registration verification.

            const res = await fetch(`${(process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "")}/api/auth/otp/verify`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, code: otp })
            });
            const data = await res.json();

            if (res.ok) {
                // Success!
                // Redirect based on action?
                // Or just go to Login page to finish?
                // User said "to enter the account".
                // If account exists, go to Login.
                router.push('/login');
            } else {
                alert(data.error || "Código inválido.");
            }
        } catch (e) {
            alert("Erro de conexão");
        }
        setLoading(false);
    };

    return (
        <div className="min-h-screen bg-primary flex flex-col items-center justify-center p-6 text-center relative">
            <button
                onClick={() => router.back()}
                className="absolute top-6 left-6 w-10 h-10 bg-black/10 rounded-full flex items-center justify-center text-black hover:bg-black/20 transition-colors"
            >
                <ArrowLeft className="w-6 h-6" />
            </button>

            <div className="w-full max-w-sm bg-white rounded-[32px] p-8 shadow-xl">
                {step === 'method' && (
                    <>
                        <h1 className="text-2xl font-bold mb-2">Verificar Conta</h1>
                        <p className="text-gray-500 mb-8 text-sm">Como deseja receber o código?</p>

                        <div className="space-y-4">
                            {/* SMS Button (Disabled for MVP if backend doesn't support, but UI kept) */}
                            {phone && (
                                <button
                                    className="w-full border border-gray-200 p-4 rounded-2xl flex items-center gap-4 hover:border-primary hover:bg-primary/5 transition-all group opacity-50 cursor-not-allowed"
                                    title="SMS indisponível no momento"
                                >
                                    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center text-gray-500 transition-colors">
                                        <Smartphone className="w-6 h-6" />
                                    </div>
                                    <div className="text-left">
                                        <h3 className="font-bold text-gray-900">Via SMS</h3>
                                        <p className="text-xs text-gray-500">{phone}</p>
                                    </div>
                                </button>
                            )}

                            {email && (
                                <button
                                    onClick={() => handleMethodSelect('email')}
                                    className="w-full border border-gray-200 p-4 rounded-2xl flex items-center gap-4 hover:border-primary hover:bg-primary/5 transition-all group"
                                >
                                    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center text-gray-500 group-hover:bg-primary group-hover:text-white transition-colors">
                                        <Mail className="w-6 h-6" />
                                    </div>
                                    <div className="text-left">
                                        <h3 className="font-bold text-gray-900">Via Email</h3>
                                        <p className="text-xs text-gray-500">{email}</p>
                                    </div>
                                </button>
                            )}
                        </div>
                    </>
                )}

                {step === 'code' && (
                    <>
                        <h1 className="text-2xl font-bold mb-2">Digite o código</h1>
                        <p className="text-gray-500 mb-8 text-sm">Insira o código enviado.</p>

                        <input
                            type="text"
                            value={otp}
                            onChange={(e) => setOtp(e.target.value)}
                            className="w-full bg-gray-50 border border-gray-200 rounded-xl p-4 text-center text-2xl font-bold tracking-widest mb-6 focus:border-primary outline-none"
                            placeholder="0000"
                        />

                        <div className="space-y-3">
                            <button
                                onClick={handleVerifyDisplay}
                                disabled={!otp || loading}
                                className="w-full bg-primary text-white font-bold py-4 rounded-xl hover:brightness-110 transition-all disabled:opacity-50"
                            >
                                {loading ? "Verificando..." : "Confirmar"}
                            </button>

                            <button
                                onClick={handleResend}
                                disabled={timeLeft > 0 || loading}
                                className="w-full text-sm text-gray-500 font-medium py-2 flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                {timeLeft > 0 ? (
                                    <span>Aguarde {timeLeft}s para reenviar</span>
                                ) : (
                                    <>
                                        <RefreshCw className="w-4 h-4" />
                                        Reenviar Código
                                    </>
                                )}
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

export default function RegisterVerifyPage() {
    return (
        <Suspense fallback={<div>Carregando...</div>}>
            <RegisterVerifyContent />
        </Suspense>
    );
}
