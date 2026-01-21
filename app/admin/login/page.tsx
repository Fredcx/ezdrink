"use client";

import { Lock, ArrowRight, CornerDownLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

export default function AdminLoginPage() {
    const router = useRouter();
    const { login } = useAuth(); // We might need to handle token manually if context login is phone-only
    // But admin usually logs in via same mechanism?
    // Let's implement custom login logic here to ensure Admin Token.

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            // Admin usually login via email? Or Phone?
            // "admin@ezdrink.com" is email.
            // Need an endpoint for email login?
            // Existing `login` was `login-phone`.
            // Existing `api/auth/login` exists? Let's assume standard `login` handles email.
            // I'll check server.js but standard implementation usually has `api/auth/login`.
            // If not, I'll add `api/auth/login-email`.

            // Wait, previous session user mentioned "I have to logout...". 
            // `create_admin.js` created `admin@ezdrink.com`.
            // So we need clear email login.

            const res = await fetch(`${(process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "")}/api/auth/login`, { // Assuming this endpoint handles email from older code or I add it
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            const data = await res.json();

            if (res.ok) {
                // Check if admin
                if (data.user.user_type !== 'admin' && data.user.establishment_role !== 'manager') {
                    alert("Acesso negado. Usuário não é admin.");
                    return;
                }

                // SAVE TO ADMIN SPECIFIC TOKEN
                localStorage.setItem('ezdrink_admin_token', data.token);

                // Use replace to ensure fresh state
                window.location.replace("/admin");
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
        <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 text-center text-white relative">
            <Link href="/" className="absolute top-10 left-10 flex items-center gap-2 text-gray-500 hover:text-white transition-colors">
                <CornerDownLeft className="w-5 h-5" />
                Voltar ao início
            </Link>

            <div className="w-full max-w-sm bg-zinc-900 rounded-[32px] p-10 border border-zinc-800 shadow-2xl">
                <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center text-white mx-auto mb-6">
                    <Lock className="w-8 h-8" />
                </div>

                <h1 className="text-2xl font-bold mb-2">Painel Admin</h1>
                <p className="text-gray-500 mb-8 text-sm">Acesso restrito a gerentes.</p>

                <form onSubmit={handleLogin} className="space-y-4 mb-8 text-left">
                    <div>
                        <label className="text-xs font-bold text-gray-500 ml-4 mb-1 block">EMAIL</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-4 py-4 font-bold text-lg text-white outline-none focus:border-white transition-all"
                            placeholder="admin@ezdrink.com"
                        />
                    </div>

                    <div>
                        <label className="text-xs font-bold text-gray-500 ml-4 mb-1 block">SENHA</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-4 py-4 font-bold text-lg text-white outline-none focus:border-white transition-all"
                            placeholder="••••••"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-white text-black font-bold py-4 rounded-xl flex items-center justify-center gap-2 hover:bg-gray-200 transition-all disabled:opacity-50 mt-4"
                    >
                        {loading ? "Entrando..." : "Acessar Painel"}
                        {!loading && <ArrowRight className="w-5 h-5" />}
                    </button>
                </form>
            </div>
        </div>
    );
}
