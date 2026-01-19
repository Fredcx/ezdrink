"use client";

import { useState, useEffect } from "react";
import { UserPlus, Search, UserCheck, Trash2, Copy, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface TeamMember {
    id: number;
    full_name: string;
    email: string;
    user_type: string;
    establishment_role: string | null;
}

export default function AdminTeamPage() {
    const [team, setTeam] = useState<TeamMember[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newMemberName, setNewMemberName] = useState("");
    const [newMemberRole, setNewMemberRole] = useState("waiter");
    const [generatedCredentials, setGeneratedCredentials] = useState<any>(null);

    useEffect(() => {
        fetchTeam();
    }, []);

    const fetchTeam = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${(process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "")}/api/establishment/team`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('ezdrink_token') || ''}` }
            });
            if (res.ok) {
                const data = await res.json();
                setTeam(data);
            }
        } catch (error) {
            console.error("Failed", error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm("Tem certeza que deseja remover este membro?")) return;

        try {
            const token = localStorage.getItem('ezdrink_token');
            const res = await fetch(`${(process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "")}/api/establishment/team/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.ok) {
                // Remove from state immediately
                setTeam(prev => prev.filter(p => p.id !== id));
            } else {
                alert("Erro ao remover membro.");
            }
        } catch (error) {
            console.error(error);
            alert("Erro de conexão.");
        }
    };

    const [isGenerating, setIsGenerating] = useState(false);

    const handleCreateMember = async () => {
        if (!newMemberName) return;
        setIsGenerating(true);
        try {
            const res = await fetch(`${(process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "")}/api/establishment/team/generate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('ezdrink_token') || ''}`
                },
                body: JSON.stringify({ name: newMemberName, role: newMemberRole })
            });
            const data = await res.json();

            if (data.success) {
                setGeneratedCredentials(data.credentials);
                fetchTeam();
            } else {
                alert(data.error || "Erro ao gerar conta.");
            }
        } catch (error) {
            console.error(error);
            alert("Erro de conexão ao criar membro.");
        } finally {
            setIsGenerating(false);
        }
    };

    const getRoleLabel = (role: string | null) => {
        switch (role) {
            case 'waiter': return 'Garçom';
            case 'barman': return 'Barman';
            case 'manager': return 'Gerente';
            default: return 'Outro';
        }
    };

    const getRoleColor = (role: string | null) => {
        switch (role) {
            case 'waiter': return 'bg-purple-100 text-purple-600';
            case 'barman': return 'bg-orange-100 text-orange-600';
            case 'manager': return 'bg-blue-100 text-blue-600';
            default: return 'bg-gray-100 text-gray-600';
        }
    };

    const filteredTeam = team.filter(u =>
        u.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="max-w-7xl mx-auto">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
                <div>
                    <h1 className="text-3xl font-black text-gray-900">Equipe</h1>
                    <p className="text-gray-500 font-medium">Gerencie garçons, barmans e gerentes.</p>
                </div>
                <button
                    onClick={() => { setIsModalOpen(true); setGeneratedCredentials(null); }}
                    className="bg-primary text-white font-bold px-6 py-3 rounded-xl flex items-center gap-2 hover:brightness-110 transition-all shadow-lg shadow-primary/20"
                >
                    <UserPlus className="w-5 h-5" />
                    Novo Membro
                </button>
            </header>

            {/* Search */}
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 mb-8 flex items-center gap-3">
                <Search className="w-5 h-5 text-gray-400" />
                <input
                    type="text"
                    placeholder="Buscar membro..."
                    className="flex-1 font-medium outline-none text-gray-700 placeholder:text-gray-400"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            {/* List */}
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden overflow-x-auto">
                <table className="w-full text-left min-w-[800px]">
                    <thead className="bg-gray-50 border-b border-gray-100/50">
                        <tr>
                            <th className="p-6 font-bold text-gray-400 text-xs tracking-wider">NOME</th>
                            <th className="p-6 font-bold text-gray-400 text-xs tracking-wider">LOGIN</th>
                            <th className="p-6 font-bold text-gray-400 text-xs tracking-wider">FUNÇÃO</th>
                            <th className="p-6 font-bold text-gray-400 text-xs tracking-wider text-right">AÇÕES</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {loading ? (
                            <tr><td colSpan={4} className="p-10 text-center animate-pulse">Carregando...</td></tr>
                        ) : filteredTeam.map((u) => (
                            <tr key={u.id} className="hover:bg-gray-50/50 transition-colors">
                                <td className="p-6">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold">
                                            {u.full_name?.substring(0, 2).toUpperCase()}
                                        </div>
                                        <span className="font-bold text-gray-900">{u.full_name}</span>
                                    </div>
                                </td>
                                <td className="p-6 text-gray-600 font-medium">{u.email}</td>
                                <td className="p-6 text-gray-600 font-medium">{u.email}</td>
                                <td className="p-6">
                                    <span className={`px-3 py-1 rounded-lg text-xs font-bold ${getRoleColor(u.establishment_role)}`}>
                                        {getRoleLabel(u.establishment_role)}
                                    </span>
                                </td>
                                <td className="p-6 text-right">
                                    <button
                                        onClick={() => handleDelete(u.id)}
                                        className="text-red-400 hover:text-red-500 transition-colors"
                                    >
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {!loading && filteredTeam.length === 0 && (
                    <div className="p-10 text-center text-gray-400 font-medium">
                        Nenhum membro encontrado.
                    </div>
                )}
            </div>

            {/* Create Member Modal */}
            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl"
                        >
                            {!generatedCredentials ? (
                                <>
                                    <h2 className="text-2xl font-bold mb-2">Novo Membro</h2>
                                    <p className="text-gray-500 mb-6">Crie uma conta de acesso para sua equipe.</p>

                                    <div className="mb-4">
                                        <label className="text-xs font-bold text-gray-400 ml-2 mb-2 block">NOME</label>
                                        <input
                                            autoFocus
                                            type="text"
                                            className="w-full bg-gray-50 border border-gray-200 rounded-xl p-4 font-bold outline-none focus:border-primary"
                                            placeholder="Ex: Carlos Silva"
                                            value={newMemberName}
                                            onChange={(e) => setNewMemberName(e.target.value)}
                                        />
                                    </div>

                                    <div className="mb-6">
                                        <label className="text-xs font-bold text-gray-400 ml-2 mb-2 block">FUNÇÃO</label>
                                        <div className="grid grid-cols-3 gap-2">
                                            {['waiter', 'barman', 'manager'].map((role) => (
                                                <button
                                                    key={role}
                                                    onClick={() => setNewMemberRole(role)}
                                                    className={`py-3 rounded-xl font-bold text-sm transition-all border-2 ${newMemberRole === role
                                                        ? 'border-primary bg-primary/10 text-primary'
                                                        : 'border-transparent bg-gray-50 text-gray-500 hover:bg-gray-100'
                                                        }`}
                                                >
                                                    {getRoleLabel(role)}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="flex gap-3">
                                        <button
                                            onClick={() => setIsModalOpen(false)}
                                            className="flex-1 bg-gray-100 text-gray-600 font-bold py-3 rounded-xl"
                                        >
                                            Cancelar
                                        </button>
                                        <button
                                            onClick={handleCreateMember}
                                            disabled={!newMemberName || isGenerating}
                                            className="flex-1 bg-primary text-white font-bold py-3 rounded-xl disabled:opacity-50 flex items-center justify-center gap-2"
                                        >
                                            {isGenerating ? (
                                                <>
                                                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                    Gerando...
                                                </>
                                            ) : (
                                                "Gerar Acesso"
                                            )}
                                        </button>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="text-center mb-6">
                                        <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <Check className="w-8 h-8" />
                                        </div>
                                        <h2 className="text-2xl font-bold mb-2">Acesso Gerado!</h2>
                                        <p className="text-gray-500">Credenciais para <b>{newMemberName}</b>.</p>
                                    </div>

                                    <div className="bg-gray-50 p-6 rounded-2xl mb-6 space-y-4 border border-gray-100">
                                        <div>
                                            <label className="text-[10px] font-bold text-gray-400 tracking-wider">LOGIN</label>
                                            <div className="flex items-center justify-between">
                                                <span className="font-bold text-lg text-gray-900">{generatedCredentials.email}</span>
                                                <Copy
                                                    className="w-4 h-4 text-gray-400 cursor-pointer hover:text-primary"
                                                    onClick={() => navigator.clipboard.writeText(generatedCredentials.email)}
                                                />
                                            </div>
                                        </div>
                                        <div className="h-px bg-gray-200" />
                                        <div>
                                            <label className="text-[10px] font-bold text-gray-400 tracking-wider">SENHA (PIN)</label>
                                            <div className="flex items-center justify-between">
                                                <span className="font-bold text-2xl text-primary tracking-widest">{generatedCredentials.password}</span>
                                                <Copy
                                                    className="w-4 h-4 text-gray-400 cursor-pointer hover:text-primary"
                                                    onClick={() => navigator.clipboard.writeText(generatedCredentials.password)}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => { setIsModalOpen(false); setGeneratedCredentials(null); setNewMemberName(""); }}
                                        className="w-full bg-black text-white font-bold py-4 rounded-xl"
                                    >
                                        Concluir
                                    </button>
                                </>
                            )}
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
