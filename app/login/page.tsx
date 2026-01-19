"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { Mail, KeyRound, Lock, ArrowRight, Loader2, User, FileText } from "lucide-react";

type Step = 'EMAIL' | 'OTP' | 'PIN_LOGIN' | 'REGISTER';

export default function LoginPage() {
    const router = useRouter();
    const { login } = useAuth();

    const [step, setStep] = useState<Step>('EMAIL');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    // Form Data
    const [email, setEmail] = useState("");
    const [otp, setOtp] = useState("");
    const [pin, setPin] = useState("");

    // Register Data
    const [name, setName] = useState("");
    const [cpf, setCpf] = useState("");
    const [phone, setPhone] = useState(""); // Optional/Contact

    const handleRequestOtp = async () => {
        if (!email.includes('@')) {
            setError("Digite um e-mail válido.");
            return;
        }
        setLoading(true);
        setError("");

        try {
            const res = await fetch(`${(process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "")}/api/auth/otp/request`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });
            const data = await res.json();

            if (res.ok) {
                setStep('OTP');
            } else {
                setError(data.error || "Erro ao enviar código.");
            }
        } catch (e) {
            setError("Erro de conexão.");
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOtp = async () => {
        if (otp.length < 6) return;
        setLoading(true);
        setError("");

        try {
            const res = await fetch(`${(process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "")}/api/auth/otp/verify`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, code: otp })
            });
            const data = await res.json();

            if (res.ok) {
                if (data.action === 'login_pin') {
                    setStep('PIN_LOGIN');
                } else if (data.action === 'register') {
                    setStep('REGISTER');
                }
            } else {
                setError(data.error || "Código inválido.");
            }
        } catch (e) {
            setError("Erro de conexão.");
        } finally {
            setLoading(false);
        }
    };

    const handleLoginWithPin = async () => {
        if (pin.length < 4) return;
        setLoading(true);
        setError("");

        try {
            const res = await fetch(`${(process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "")}/api/auth/login-pin`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, pin })
            });
            const data = await res.json();

            if (res.ok) {
                login(data.token, data.user);
                router.push('/');
            } else {
                setError(data.error || "PIN incorreto.");
            }
        } catch (e) {
            setError("Erro de conexão.");
        } finally {
            setLoading(false);
        }
    };

    const handleRegister = async () => {
        if (!name || !cpf || pin.length < 4) {
            setError("Preencha todos os campos e defina um PIN.");
            return;
        }
        setLoading(true);
        setError("");

        try {
            const res = await fetch(`${(process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "")}/api/auth/otp/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email,
                    code: otp,
                    pin,
                    full_name: name,
                    cpf,
                    phone
                })
            });
            const data = await res.json();

            if (res.ok) {
                login(data.token, data.user);
                router.push('/');
            } else {
                setError(data.error || "Erro no cadastro.");
            }
        } catch (e) {
            setError("Erro de conexão.");
        } finally {
            setLoading(false);
        }
    };

    const formatCPF = (value: string) => {
        const digits = value.replace(/\D/g, '').slice(0, 11);
        return digits
            .replace(/(\d{3})(\d)/, '$1.$2')
            .replace(/(\d{3})(\d)/, '$1.$2')
            .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
    };

    return (
        <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6 relative overflow-hidden">

            {/* Background Gradient */}
            <div className="absolute top-0 left-0 w-full h-[50vh] bg-gradient-to-b from-[#2a0e45] to-black -z-10" />

            <div className="w-full max-w-sm space-y-8 z-10">
                <div className="text-center space-y-2">
                    <h1 className="text-4xl font-black tracking-tighter">EZ DRINK<span className="text-primary">.</span></h1>
                    <p className="text-gray-400 text-sm">Acesse sua conta para pedir</p>
                </div>

                <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-3xl space-y-6 shadow-2xl">

                    {/* Progress Dots */}
                    <div className="flex justify-center gap-2 mb-4">
                        <div className={`w-2 h-2 rounded-full transition-all ${step === 'EMAIL' ? 'bg-primary w-6' : 'bg-white/20'}`} />
                        <div className={`w-2 h-2 rounded-full transition-all ${step === 'OTP' ? 'bg-primary w-6' : 'bg-white/20'}`} />
                        <div className={`w-2 h-2 rounded-full transition-all ${step === 'PIN_LOGIN' || step === 'REGISTER' ? 'bg-primary w-6' : 'bg-white/20'}`} />
                    </div>

                    {step === 'EMAIL' && (
                        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest pl-1">E-mail</label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 w-5 h-5" />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="seu@email.com"
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white placeholder-gray-600 focus:outline-none focus:border-primary/50 focus:bg-white/10 transition-all font-medium"
                                />
                            </div>
                            <button
                                onClick={handleRequestOtp}
                                disabled={loading}
                                className="w-full bg-primary hover:bg-primary/90 text-black font-bold py-4 rounded-2xl transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
                            >
                                {loading ? <Loader2 className="animate-spin" /> : <>Continuar <ArrowRight className="w-5 h-5" /></>}
                            </button>
                        </div>
                    )}

                    {step === 'OTP' && (
                        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
                            <div className="text-center">
                                <h3 className="font-bold text-lg">Código de Verificação</h3>
                                <p className="text-sm text-gray-400">Enviado para {email}</p>
                            </div>
                            <div className="relative">
                                <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 w-5 h-5" />
                                <input
                                    type="text"
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                    placeholder="000000"
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white text-center text-2xl tracking-[0.5em] focus:outline-none focus:border-primary/50 transition-all font-bold"
                                />
                            </div>
                            <button
                                onClick={handleVerifyOtp}
                                disabled={loading}
                                className="w-full bg-primary hover:bg-primary/90 text-black font-bold py-4 rounded-2xl transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
                            >
                                {loading ? <Loader2 className="animate-spin" /> : "Verificar Código"}
                            </button>
                            <button onClick={() => setStep('EMAIL')} className="w-full text-xs text-gray-500 hover:text-white">Voltar / Corrigir E-mail</button>
                        </div>
                    )}

                    {step === 'PIN_LOGIN' && (
                        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
                            <div className="text-center">
                                <h3 className="font-bold text-lg">Digite seu PIN</h3>
                                <p className="text-sm text-gray-400">Sua senha de 4 dígitos</p>
                            </div>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 w-5 h-5" />
                                <input
                                    type="password"
                                    value={pin}
                                    onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                    placeholder="••••"
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white text-center text-2xl tracking-[0.5em] focus:outline-none focus:border-primary/50 transition-all font-bold"
                                />
                            </div>
                            <button
                                onClick={handleLoginWithPin}
                                disabled={loading}
                                className="w-full bg-primary hover:bg-primary/90 text-black font-bold py-4 rounded-2xl transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
                            >
                                {loading ? <Loader2 className="animate-spin" /> : "Entrar"}
                            </button>
                        </div>
                    )}

                    {step === 'REGISTER' && (
                        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
                            <div className="text-center">
                                <h3 className="font-bold text-lg">Quase lá!</h3>
                                <p className="text-sm text-gray-400">Complete seu cadastro</p>
                            </div>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Nome Completo"
                                className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white placeholder-gray-600 focus:border-primary/50 outline-none"
                            />
                            <input
                                type="text"
                                value={cpf}
                                onChange={(e) => setCpf(formatCPF(e.target.value))}
                                placeholder="CPF (000.000.000-00)"
                                className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white placeholder-gray-600 focus:border-primary/50 outline-none"
                            />
                            <div className="relative">
                                <p className="text-xs text-gray-500 mb-1 ml-1">Crie um PIN (Senha numérica)</p>
                                <input
                                    type="number"
                                    inputMode="numeric"
                                    pattern="[0-9]*"
                                    value={pin}
                                    onChange={(e) => setPin(e.target.value.slice(0, 6))}
                                    placeholder="PIN (4-6 dígitos)"
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white placeholder-gray-600 focus:border-primary/50 outline-none font-bold text-center tracking-widest"
                                />
                            </div>

                            <button
                                onClick={handleRegister}
                                disabled={loading}
                                className="w-full bg-primary hover:bg-primary/90 text-black font-bold py-4 rounded-2xl transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
                            >
                                {loading ? <Loader2 className="animate-spin" /> : "Finalizar Cadastro"}
                            </button>
                        </div>
                    )}

                    {error && (
                        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-200 text-sm text-center animate-in fade-in">
                            {error}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
