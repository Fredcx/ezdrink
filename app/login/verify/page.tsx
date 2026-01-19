"use client";

import { useAuth } from "@/context/AuthContext";
import { ArrowLeft } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState, useRef } from "react";

function VerifyContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { login } = useAuth();

    const phone = searchParams.get('phone');
    const name = searchParams.get('name');

    // 4 digit otp
    const [otp, setOtp] = useState(["", "", "", ""]);
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

    const [loading, setLoading] = useState(false);
    const [timer, setTimer] = useState(30);
    const [showResendToast, setShowResendToast] = useState(false);

    useEffect(() => {
        if (!phone) router.push('/login');

        // Focus first input on mount
        if (inputRefs.current[0]) {
            inputRefs.current[0].focus();
        }

        // Countdown
        const interval = setInterval(() => {
            setTimer((prev) => (prev > 0 ? prev - 1 : 0));
        }, 1000);

        return () => clearInterval(interval);
    }, [phone, router]);

    const handleChange = (index: number, value: string) => {
        if (!/^\d*$/.test(value)) return;

        const newOtp = [...otp];
        newOtp[index] = value;
        setOtp(newOtp);

        // Auto move next
        if (value && index < 3) {
            inputRefs.current[index + 1]?.focus();
        }

        // Auto submit
        if (newOtp.every(digit => digit !== "")) {
            handleSubmit(newOtp.join(""));
        }
    };

    const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Backspace" && !otp[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    const handleResend = () => {
        setTimer(30);
        setShowResendToast(true);
        setTimeout(() => setShowResendToast(false), 3000);
    };

    const handleSubmit = async (code: string) => {
        setLoading(true);
        // Mock API Verify
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Success
        login(phone!, name || undefined);
        setLoading(false);
    };

    return (
        <div className="min-h-screen bg-primary flex flex-col items-center justify-center p-6 text-center relative">
            {/* Resend Toast */}
            {showResendToast && (
                <div className="absolute top-10 bg-black/80 text-white px-6 py-3 rounded-full text-sm font-bold animate-fade-in-down shadow-lg">
                    Código reenviado com sucesso! 📨
                </div>
            )}

            <button
                onClick={() => router.back()}
                className="absolute top-6 left-6 w-10 h-10 bg-black/10 rounded-full flex items-center justify-center text-black hover:bg-black/20 transition-colors"
            >
                <ArrowLeft className="w-6 h-6" />
            </button>

            <div className="w-full max-w-sm bg-white rounded-[32px] p-8 shadow-xl">
                <h1 className="text-2xl font-bold mb-2">Código enviado</h1>
                <p className="text-gray-500 mb-8 text-sm">
                    Enviamos um código para <br />
                    <span className="font-bold text-gray-800">{phone}</span>
                </p>

                <div className="flex justify-center gap-3 mb-8">
                    {otp.map((digit, index) => (
                        <input
                            key={index}
                            ref={el => { inputRefs.current[index] = el }}
                            type="tel"
                            maxLength={1}
                            value={digit}
                            onChange={(e) => handleChange(index, e.target.value)}
                            onKeyDown={(e) => handleKeyDown(index, e)}
                            className="w-14 h-16 bg-gray-50 border-2 border-gray-200 rounded-2xl text-center text-3xl font-bold outline-none focus:border-primary focus:scale-110 transition-all caret-primary"
                        />
                    ))}
                </div>

                <div className="text-center">
                    {loading ? (
                        <p className="text-primary font-bold animate-pulse">Verificando...</p>
                    ) : (
                        <button
                            disabled={timer > 0}
                            onClick={handleResend}
                            className={`text-sm font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${timer > 0 ? 'text-gray-300' : 'text-primary hover:brightness-110 underline'
                                }`}
                        >
                            {timer > 0 ? `Reenviar código em 00:${timer.toString().padStart(2, '0')}` : "Reenviar código"}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

export default function VerifyPage() {
    return (
        <Suspense fallback={<div>Carregando...</div>}>
            <VerifyContent />
        </Suspense>
    );
}
