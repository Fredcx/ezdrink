"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { Mail, KeyRound, Lock, ArrowRight, Loader2, User, FileText, ArrowLeft, RefreshCw } from "lucide-react";

type Step = 'EMAIL' | 'OTP' | 'PIN_LOGIN' | 'REGISTER' | 'FORGOT_EMAIL' | 'FORGOT_OTP' | 'FORGOT_NEW_PIN';

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
    const [phone, setPhone] = useState("");
    // Timer for Resend
    const [timeLeft, setTimeLeft] = useState(0);

    // Timer Logic
    useEffect(() => {
        if (timeLeft <= 0) return;
        const timer = setInterval(() => {
            setTimeLeft((prev) => prev - 1);
        }, 1000);
        return () => clearInterval(timer);
    }, [timeLeft]);



    const handleRequestOtp = async (targetStep: Step = 'OTP') => {
        if (!email.includes('@')) {
            setError("Digite um e-mail válido.");
            return;
        }

        // Timer Check
        if (timeLeft > 0) {
            setError(`Aguarde ${timeLeft}s para reenviar.`);
            return;
        }

        setLoading(true);
        setError("");

        try {
            const res = await fetch(`${(process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "")}/api/auth/otp/request`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                // If it's forgot password, we might want to validate CPF here?
                // The backend currently only looks for email. 
                // We'll update backend later to verify CPF if provided.
                body: JSON.stringify({ email, cpf: cpf || undefined })
            });
            const data = await res.json();

            if (res.ok) {
                setStep(targetStep);
                setTimeLeft(60); // Start 60s timer
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

    const formatPhone = (value: string) => {
        const digits = value.replace(/\D/g, '').slice(0, 11);
        return digits
            .replace(/(\d{2})(\d)/, '($1) $2')
            .replace(/(\d{5})(\d)/, '$1-$2');
    };

    const handleRegister = async () => {
        if (!name || !cpf || !phone || pin.length < 4) {
            setError("Preencha todos os campos (Nome, CPF, Telefone e PIN).");
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

    // ... (Render Block Updates) ...

    return (
        // ...
        // Inside REGISTER step
        { step === 'REGISTER' && (
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
                <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(formatPhone(e.target.value))}
                    placeholder="WhatsApp (11) 99999-9999"
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


// --- Forgot Password Flow ---

const handleForgotRequestOtp = async () => {
    if (!email.includes('@')) {
        setError("Digite um e-mail válido.");
        return;
    }

    // Timer Check
    if (timeLeft > 0) {
        setError(`Aguarde ${timeLeft}s para reenviar.`);
        return;
    }

    setLoading(true);
    setError("");

    try {
        const res = await fetch(`${(process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "")}/api/auth/otp/request`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, cpf })
        });
        const data = await res.json();

        if (res.ok) {
            setStep('FORGOT_OTP');
            setTimeLeft(60);
        } else {
            setError(data.error || "Erro ao enviar código.");
        }
    } catch (e) {
        setError("Erro de conexão.");
    } finally {
        setLoading(false);
    }
}

const handleForgotVerifyOtp = async () => {
    // Just client side check to move to next step, or verify with backend if needed.
    // But backend verify consumes OTP or returns login_pin action.
    // We want to move to NEW PIN step.
    // We can just check with backend if OTP is valid without consuming?
    // Our 'verify' route consumes OTP if valid? NO. It 'delete(email)' on valid ONLY IF user exists?
    // Line 256: otpStore.delete(email).
    // So we cannot use 'verify' route then 'reset'.
    // We will skip verification step here and verify inside 'reset-pin' route along with the new pin.
    // BUT, UX requires checking code first.
    // I should have made 'verify' NOT consume OTP.
    // Or I just pass the OTP to the next step and send it in 'reset-pin'.
    // Ideally, we verify first.
    // Hack: I'll assume if user enters 6 digits, we let them proceed to enter PIN, then 'reset-pin' validates Everything.
    if (otp.length === 6) {
        setStep('FORGOT_NEW_PIN');
    }
}

const handleResetPin = async () => {
    if (pin.length < 4) return;
    setLoading(true);
    setError("");

    try {
        const res = await fetch(`${(process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "")}/api/auth/reset-pin`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, code: otp, pin, cpf })
        });
        const data = await res.json();

        if (res.ok) {
            alert("PIN alterado com sucesso! Faça login.");
            setStep('PIN_LOGIN');
            setPin("");
            setOtp("");
        } else {
            setError(data.error || "Erro ao alterar PIN.");
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
            <div className="text-center flex flex-col items-center">
                <img src="/logo-z.png" alt="EZ" className="w-24 h-auto mb-6 drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]" />
                <h1 className="text-3xl font-black tracking-tighter uppercase mb-2">Bem-vindo</h1>
                <p className="text-gray-400 text-sm">Acesse sua conta para pedir</p>
            </div>

            <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-3xl space-y-6 shadow-2xl relative">

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
                            onClick={() => handleRequestOtp('OTP')}
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

                        <div className="flex flex-col gap-2">
                            <button
                                onClick={() => handleRequestOtp('OTP')}
                                disabled={loading || timeLeft > 0}
                                className="w-full text-xs text-gray-400 hover:text-white disabled:text-gray-600"
                            >
                                {timeLeft > 0 ? `Reenviar código em ${timeLeft}s` : "Reenviar Código"}
                            </button>
                            <button onClick={() => setStep('EMAIL')} className="w-full text-xs text-gray-500 hover:text-white">Voltar / Corrigir E-mail</button>
                        </div>
                    </div>
                )}

                {step === 'PIN_LOGIN' && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
                        <div className="text-center">
                            <h3 className="font-bold text-lg">Digite seu PIN</h3>
                            <p className="text-sm text-gray-400">Senha de 4 a 6 dígitos</p>
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
                            {loading ? <Loader2 className="animate-spin" /> : "Entrar (v2.2)"}
                        </button>
                        <button onClick={() => setStep('FORGOT_EMAIL')} className="w-full text-xs text-gray-500 hover:text-white underline">Esqueci meu PIN</button>
                    </div>
                )}

                {/* FORGOT PASSWORD STEPS */}
                {step === 'FORGOT_EMAIL' && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
                        <div className="flex items-center gap-2 mb-2">
                            <button onClick={() => setStep('PIN_LOGIN')} className="p-1 -ml-2 rounded-full hover:bg-white/10"><ArrowLeft className="w-5 h-5" /></button>
                            <h3 className="font-bold text-lg">Recuperar Conta</h3>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest pl-1">Confirme seu E-mail</label>
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
                            </div>

                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest pl-1">Confirme seu CPF</label>
                                <div className="relative">
                                    <FileText className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 w-5 h-5" />
                                    <input
                                        type="text"
                                        value={cpf}
                                        onChange={(e) => setCpf(formatCPF(e.target.value))}
                                        placeholder="000.000.000-00"
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white placeholder-gray-600 focus:outline-none focus:border-primary/50 focus:bg-white/10 transition-all font-medium"
                                    />
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={handleForgotRequestOtp}
                            disabled={loading || !email || cpf.length < 14} // CPF formatted length
                            className="w-full bg-primary text-black font-bold py-4 rounded-2xl transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 hover:brightness-110"
                        >
                            {loading ? <Loader2 className="animate-spin" /> : <>Enviar Código <RefreshCw className="w-4 h-4 ml-1" /></>}
                        </button>
                    </div>
                )}

                {step === 'FORGOT_OTP' && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
                        <div className="text-center">
                            <h3 className="font-bold text-lg">Código de Segurança</h3>
                            <p className="text-sm text-gray-400">Verifique seu email: {email}</p>
                        </div>
                        <div className="relative">
                            <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 w-5 h-5" />
                            <input
                                type="text"
                                value={otp}
                                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                placeholder="Código"
                                className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white text-center text-2xl tracking-[0.5em] focus:outline-none focus:border-primary/50 transition-all font-bold"
                            />
                        </div>
                        <button
                            onClick={handleForgotVerifyOtp}
                            disabled={loading || otp.length < 6}
                            className="w-full bg-white text-black font-bold py-4 rounded-2xl transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
                        >
                            {loading ? <Loader2 className="animate-spin" /> : "Confirmar Código"}
                        </button>

                        <button
                            onClick={handleForgotRequestOtp}
                            disabled={loading || timeLeft > 0}
                            className="w-full text-xs text-gray-400 hover:text-white disabled:text-gray-600"
                        >
                            {timeLeft > 0 ? `Reenviar código em ${timeLeft}s` : "Reenviar Código"}
                        </button>
                    </div>
                )}

                {step === 'FORGOT_NEW_PIN' && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
                        <div className="text-center">
                            <h3 className="font-bold text-lg">Novo PIN</h3>
                            <p className="text-sm text-gray-400">Confirme seus dados</p>
                        </div>

                        <div className="relative">
                            <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 w-5 h-5" />
                            <input
                                type="text"
                                value={cpf}
                                onChange={(e) => setCpf(formatCPF(e.target.value))}
                                placeholder="CPF (Confirmação)"
                                className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white placeholder-gray-600 focus:outline-none focus:border-primary/50 focus:bg-white/10 transition-all font-medium"
                            />
                        </div>

                        <div className="relative">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 w-5 h-5" />
                            <input
                                type="number"
                                inputMode="numeric"
                                value={pin}
                                onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                placeholder="Novo PIN (4-6)"
                                className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white text-center text-2xl tracking-[0.5em] focus:outline-none focus:border-primary/50 transition-all font-bold"
                            />
                        </div>

                        <button
                            onClick={handleResetPin}
                            disabled={loading || pin.length < 4 || cpf.length < 11}
                            className="w-full bg-primary text-black font-bold py-4 rounded-2xl transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
                        >
                            {loading ? <Loader2 className="animate-spin" /> : "Redefinir PIN"}
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
