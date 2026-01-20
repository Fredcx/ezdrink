"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, Plus, Trash2, Save, GripVertical } from "lucide-react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

interface Category {
    id: number;
    name: string;
    icon: string;
    order_index: number;
}

export default function AdminCategoriesPage() {
    const router = useRouter();
    const [categories, setCategories] = useState<Category[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    // New Category State
    const [newCategoryName, setNewCategoryName] = useState("");
    const [newCategoryIcon, setNewCategoryIcon] = useState("");

    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        try {
            const { data, error } = await supabase
                .from('categories')
                .select('*')
                .order('order_index', { ascending: true });

            if (error) throw error;
            setCategories(data || []);
        } catch (error) {
            console.error("Error fetching categories:", error);
            alert("Erro ao carregar categorias.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreateCategory = async () => {
        if (!newCategoryName.trim()) return;
        setIsSaving(true);
        try {
            const { error } = await supabase
                .from('categories')
                .insert([{
                    name: newCategoryName,
                    icon: newCategoryIcon,
                    order_index: categories.length // Append to end
                }]);

            if (error) throw error;

            setNewCategoryName("");
            setNewCategoryIcon("");
            fetchCategories();
        } catch (error: any) {
            console.error("Error creating category:", error);
            alert("Erro ao criar categoria: " + error.message);
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteCategory = async (id: number) => {
        if (!confirm("Tem certeza? Produtos nesta categoria podem ficar órfãos.")) return;
        try {
            const { error } = await supabase
                .from('categories')
                .delete()
                .eq('id', id);

            if (error) throw error;
            fetchCategories();
        } catch (error: any) {
            console.error("Delete error:", error);
            alert("Erro ao remover: " + error.message);
        }
    };

    const handleUpdateOrder = async () => {
        // Just a placeholder. Reordering requires drag-n-drop or Up/Down buttons.
        // For MVP, we use order_index based on creation or simple manual edit?
        // Let's implement simple Up/Down later if requested.
    };

    return (
        <div className="min-h-screen bg-[#121212] text-white font-sans">
            <header className="p-6 flex items-center gap-4 bg-[#1e1e1e] border-b border-white/10">
                <button
                    onClick={() => router.push('/admin/products')}
                    className="p-2 hover:bg-white/10 rounded-full transition-colors"
                >
                    <ArrowLeft className="w-6 h-6" />
                </button>
                <h1 className="text-xl font-bold">Gerenciar Categorias</h1>
            </header>

            <main className="p-6 max-w-2xl mx-auto space-y-6">

                {/* Create New */}
                <div className="bg-[#1e1e1e] p-6 rounded-2xl border border-white/5 space-y-4">
                    <h2 className="font-bold text-lg">Nova Categoria</h2>
                    <div className="grid gap-4 md:grid-cols-2">
                        <input
                            type="text"
                            placeholder="Nome (ex: Drinks)"
                            value={newCategoryName}
                            onChange={(e) => setNewCategoryName(e.target.value)}
                            className="bg-black/40 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-primary transition-colors"
                        />
                        <input
                            type="text"
                            placeholder="Ícone (Emoji ou URL)"
                            value={newCategoryIcon}
                            onChange={(e) => setNewCategoryIcon(e.target.value)}
                            className="bg-black/40 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-primary transition-colors"
                        />
                    </div>
                    <button
                        onClick={handleCreateCategory}
                        disabled={isSaving || !newCategoryName}
                        className="w-full bg-primary text-black font-bold py-3 rounded-xl hover:brightness-110 transition-all disabled:opacity-50"
                    >
                        {isSaving ? "Salvando..." : "Adicionar Categoria"}
                    </button>
                </div>

                {/* List */}
                <div className="space-y-2">
                    {isLoading ? (
                        <p className="text-center text-gray-500">Carregando...</p>
                    ) : categories.length === 0 ? (
                        <p className="text-center text-gray-500">Nenhuma categoria criada.</p>
                    ) : (
                        categories.map((cat) => (
                            <div key={cat.id} className="bg-[#1e1e1e] p-4 rounded-xl border border-white/5 flex items-center justify-between group">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 bg-white/5 rounded-lg flex items-center justify-center text-2xl">
                                        {cat.icon || "📦"}
                                    </div>
                                    <span className="font-bold">{cat.name}</span>
                                </div>
                                <button
                                    onClick={() => handleDeleteCategory(cat.id)}
                                    className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                >
                                    <Trash2 className="w-5 h-5" />
                                </button>
                            </div>
                        ))
                    )}
                </div>

            </main>
        </div>
    );
}
