"use client";

import { UserCircle, ArrowRight, CornerDownLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

export default function WaiterLoginPage() {
    const router = useRouter();
    const { login } = useAuth();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            // Use the standard Email Login we added to server.js
            const res = await fetch('http://localhost:3001/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            const data = await res.json();

            if (res.ok) {
                // Check if user has a role
                if (!['waiter', 'barman', 'manager'].includes(data.user.establishment_role)) {
                    alert("Acesso negado. Apenas equipe.");
                    return;
                }

                localStorage.setItem('ezdrink_token', data.token);
                // Force load to Waiter Dashboard
                window.location.href = "/waiter";
            } else {
                alert(data.error || "Erro ao entrar");
            }
        } catch (error) {
            console.error(error);
            alert("Erro de conexão");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-6 text-center text-white relative">
            <Link href="/" className="absolute top-10 left-10 flex items-center gap-2 text-zinc-500 hover:text-white transition-colors">
                <CornerDownLeft className="w-5 h-5" />
                Voltar ao início
            </Link>

            <div className="w-full max-w-sm bg-zinc-900 rounded-[32px] p-10 border border-zinc-800 shadow-2xl">
                <div className="w-16 h-16 bg-primary/20 text-primary rounded-full flex items-center justify-center mx-auto mb-6">
                    <UserCircle className="w-8 h-8" />
                </div>

                <h1 className="text-2xl font-bold mb-2">Exclusivo Equipe</h1>
                <p className="text-zinc-500 mb-8 text-sm">Entre com suas credenciais de equipe.</p>

                <form onSubmit={handleLogin} className="space-y-4 mb-8 text-left">
                    <div>
                        <label className="text-xs font-bold text-zinc-500 ml-4 mb-1 block">LOGIN (EMAIL)</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-4 py-4 font-bold text-lg text-white outline-none focus:border-white transition-all"
                            placeholder="garcom@ezdrink.com"
                        />
                    </div>

                    <div>
                        <label className="text-xs font-bold text-zinc-500 ml-4 mb-1 block">SENHA (PIN)</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-4 py-4 font-bold text-lg text-white outline-none focus:border-white transition-all"
                            placeholder="••••"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-primary text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 hover:brightness-110 transition-all disabled:opacity-50 mt-4 shadow-lg shadow-primary/20"
                    >
                        {loading ? "Entrando..." : "Acessar"}
                        {!loading && <ArrowRight className="w-5 h-5" />}
                    </button>
                </form>
            </div>
        </div>
    );
}
