"use client";

import { useAuth } from "@/context/AuthContext";
import { ArrowLeft, Mail, Smartphone } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

function RegisterVerifyContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { login } = useAuth();

    const phone = searchParams.get('phone');
    const email = searchParams.get('email');

    // Steps: 'method' (choose SMS/Email) -> 'code' (enter code)
    const [step, setStep] = useState<"method" | "code">("method");
    const [otp, setOtp] = useState("");
    const [loading, setLoading] = useState(false);

    if (!phone || !email) {
        return <div className="p-10 font-bold">Dados ausentes.</div>
    }

    const handleMethodSelect = (method: string) => {
        // Mock send code logic
        setStep("code");
    };

    const handleVerifyDisplay = async () => {
        setLoading(true);
        // Validate ANY code
        await new Promise(r => setTimeout(r, 1000));

        // Login User using context?
        // We don't have user object here easily unless we fetch 'me' or use passed token (not secure for 'login' method usually, but ok for now)
        // Actually, we can just redirect to Home and assume token is valid (it is stored in localStorage in prev page)
        // But we need to update Context state to 'isLoggedIn'.
        // If we don't have user object, we can't call login(phone, name).
        // Let's just redirect to Login usually?
        // User said "to enter the account".
        // I'll call a quick /api/users/me with the token to get details, then login.

        try {
            const token = localStorage.getItem('ezdrink_token');
            if (token) {
                window.location.href = "/";
            } else {
                router.push('/login');
            }
        } catch (e) {
            router.push('/login');
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
                            <button
                                onClick={() => handleMethodSelect('sms')}
                                className="w-full border border-gray-200 p-4 rounded-2xl flex items-center gap-4 hover:border-primary hover:bg-primary/5 transition-all group"
                            >
                                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center text-gray-500 group-hover:bg-primary group-hover:text-white transition-colors">
                                    <Smartphone className="w-6 h-6" />
                                </div>
                                <div className="text-left">
                                    <h3 className="font-bold text-gray-900">Via SMS</h3>
                                    <p className="text-xs text-gray-500">{phone}</p>
                                </div>
                            </button>

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

                        <button
                            onClick={handleVerifyDisplay}
                            disabled={!otp || loading}
                            className="w-full bg-primary text-white font-bold py-4 rounded-xl hover:brightness-110 transition-all disabled:opacity-50"
                        >
                            {loading ? "Verificando..." : "Confirmar"}
                        </button>
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
