"use client";

import { useState } from "react";
import { Lock, Save, AlertCircle, CheckCircle } from "lucide-react";

export default function AdminSettingsPage() {
    const [oldPassword, setOldPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const [loading, setLoading] = useState(false);
    const [msg, setMsg] = useState<{ text: string, type: 'success' | 'error' } | null>(null);

    const checkToken = () => {
        return localStorage.getItem('ezdrink_token');
    };

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setMsg(null);

        if (!oldPassword || !newPassword || !confirmPassword) {
            setMsg({ text: "Preencha todos os campos.", type: 'error' });
            return;
        }

        if (newPassword !== confirmPassword) {
            setMsg({ text: "As novas senhas não coincidem.", type: 'error' });
            return;
        }

        if (newPassword.length < 4) {
            setMsg({ text: "A nova senha deve ter pelo menos 4 caracteres.", type: 'error' });
            return;
        }

        setLoading(true);

        try {
            const token = checkToken();
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/change-password`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ oldPassword, newPassword })
            });
            const data = await res.json();

            if (res.ok) {
                setMsg({ text: "Senha atualizada com sucesso!", type: 'success' });
                setOldPassword("");
                setNewPassword("");
                setConfirmPassword("");
            } else {
                setMsg({ text: data.error || "Erro ao atualizar senha.", type: 'error' });
            }
        } catch (error) {
            setMsg({ text: "Erro de conexão.", type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-gray-900">Configurações</h1>
                <p className="text-gray-500">Gerencie suas preferências e segurança.</p>
            </div>

            <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
                <div className="flex items-center gap-4 mb-8">
                    <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
                        <Lock className="w-6 h-6" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">Segurança</h2>
                        <p className="text-sm text-gray-500">Alterar sua senha de acesso</p>
                    </div>
                </div>

                <form onSubmit={handleChangePassword} className="space-y-6 max-w-lg">
                    {msg && (
                        <div className={`p-4 rounded-xl flex items-center gap-3 ${msg.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                            }`}>
                            {msg.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                            <span className="font-medium text-sm">{msg.text}</span>
                        </div>
                    )}

                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-2 ml-1">Senha Atual</label>
                        <input
                            type="password"
                            value={oldPassword}
                            onChange={(e) => setOldPassword(e.target.value)}
                            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 font-medium outline-none focus:border-primary transition-all"
                            placeholder="Digite sua senha atual"
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-2 ml-1">Nova Senha</label>
                            <input
                                type="password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 font-medium outline-none focus:border-primary transition-all"
                                placeholder="Nova senha"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-2 ml-1">Confirmar Nova Senha</label>
                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 font-medium outline-none focus:border-primary transition-all"
                                placeholder="Confirme a nova senha"
                            />
                        </div>
                    </div>

                    <div className="pt-4">
                        <button
                            type="submit"
                            disabled={loading}
                            className="bg-primary text-white font-bold px-8 py-3 rounded-xl flex items-center gap-2 hover:brightness-110 transition-all disabled:opacity-50"
                        >
                            {loading ? "Salvando..." : "Salvar Alterações"}
                            {!loading && <Save className="w-5 h-5" />}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
