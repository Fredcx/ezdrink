"use client";

import { useState, useEffect } from "react";
import { Users, Search } from "lucide-react";

interface Customer {
    id: number;
    full_name: string;
    email: string;
    user_type: string;
    created_at: string;
}

export default function AdminCustomersPage() {
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        fetchCustomers();
    }, []);

    const fetchCustomers = async () => {
        try {
            const res = await fetch('http://localhost:3001/api/admin/users', {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('ezdrink_token') || ''}` }
            });
            if (res.ok) {
                const data = await res.json();
                setCustomers(data.filter((u: any) => u.user_type === 'customer'));
            }
        } catch (error) {
            console.error("Failed", error);
        } finally {
            setLoading(false);
        }
    };

    const filteredCustomers = customers.filter(u =>
        u.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="max-w-7xl mx-auto">
            <header className="mb-10">
                <h1 className="text-3xl font-black text-gray-900">Clientes</h1>
                <p className="text-gray-500 font-medium">Lista de usuários cadastrados no app.</p>
            </header>

            {/* Search */}
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 mb-8 flex items-center gap-3">
                <Search className="w-5 h-5 text-gray-400" />
                <input
                    type="text"
                    placeholder="Buscar cliente..."
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
                            <th className="p-6 font-bold text-gray-400 text-xs tracking-wider">EMAIL / TELEFONE</th>
                            <th className="p-6 font-bold text-gray-400 text-xs tracking-wider text-right">CADASTRO</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {loading ? (
                            <tr><td colSpan={3} className="p-10 text-center animate-pulse">Carregando...</td></tr>
                        ) : filteredCustomers.map((u) => (
                            <tr key={u.id} className="hover:bg-gray-50/50 transition-colors">
                                <td className="p-6">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold">
                                            {u.full_name?.substring(0, 2).toUpperCase()}
                                        </div>
                                        <span className="font-bold text-gray-900">{u.full_name}</span>
                                    </div>
                                </td>
                                <td className="p-6 text-gray-600 font-medium">{u.email}</td>
                                <td className="p-6 text-right text-gray-400 text-sm">
                                    Em breve
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {!loading && filteredCustomers.length === 0 && (
                    <div className="p-10 text-center text-gray-400 font-medium">
                        Nenhum cliente encontrado.
                    </div>
                )}
            </div>
        </div>
    );
}
