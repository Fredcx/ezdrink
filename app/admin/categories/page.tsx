"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, Trash2, Save, Loader2, Package, Search, Beer, Wine, Sandwich, Pizza, Coffee, IceCream, Utensils, GlassWater } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
// import { createClient } from '@supabase/supabase-js'; // Not used client-side anymore

// Icon Map for preview
const ICON_MAP: Record<string, any> = {
    "Beer": Beer,
    "Wine": Wine,
    "Sandwich": Sandwich,
    "Package": Package,
    "Pizza": Pizza,
    "Coffee": Coffee,
    "IceCream": IceCream,
    "Utensils": Utensils,
    "GlassWater": GlassWater,
    "Cocktail": GlassWater,
};

interface Category {
    id: number;
    name: string;
    icon: string;
    order_index: number;
}

export default function AdminCategoriesPage() {
    const router = useRouter();
    const { isAuthenticated, isLoading: isAuthLoading } = useAuth(); // Use global auth context

    const [categories, setCategories] = useState<Category[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");

    // New Category State
    const [newCategoryName, setNewCategoryName] = useState("");
    const [newCategoryIcon, setNewCategoryIcon] = useState("");

    useEffect(() => {
        // Protect Route
        if (!isAuthLoading && !isAuthenticated) {
            router.push('/login');
        } else if (isAuthenticated) {
            fetchCategories();
        }
    }, [isAuthLoading, isAuthenticated, router]); // Dependency on auth state

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
            // alert("Erro ao carregar categorias."); 
        } finally {
            setIsLoading(false);
        }
    };

    // Helper to get authenticated client
    const getAuthenticatedClient = () => {
        const token = localStorage.getItem('ezdrink_token');
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
        const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-key";

        return createClient(supabaseUrl, supabaseKey, {
            global: { headers: { Authorization: `Bearer ${token}` } }
        });
    };

    const handleCreateCategory = async () => {
        if (!newCategoryName.trim()) return;
        setIsSaving(true);
        try {
            // Use API Route instead of direct Supabase due to Token Mismatch
            const res = await fetch('/api/categories', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('ezdrink_token')}`
                },
                body: JSON.stringify({
                    name: newCategoryName,
                    icon: newCategoryIcon,
                    order_index: categories.length
                })
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || "Failed to create");
            }

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
        if (!confirm("Tem certeza? Produtos nesta categoria podem ficar ocultos.")) return;
        try {
            const res = await fetch(`/api/categories?id=${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('ezdrink_token')}`
                }
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || "Failed to delete");
            }
            fetchCategories();
        } catch (error: any) {
            console.error("Delete error:", error);
            alert("Erro ao remover: " + error.message);
        }
    };

    // Filter categories locally
    const filteredCategories = categories.filter(c =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Render Loading State while Auth checks
    if (isAuthLoading || (!isAuthenticated && isLoading)) { // Wait for auth or initial load
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
        );
    }

    // If not authenticated (and done loading), the useEffect redirects, but we return null to avoid flash
    if (!isAuthenticated) return null;


    return (
        <div className="max-w-4xl mx-auto min-h-screen bg-gray-50 p-6 md:p-10 font-sans text-slate-900">
            {/* Header */}
            <header className="flex items-center gap-4 mb-10">
                <button
                    onClick={() => router.push('/admin/products')}
                    className="w-10 h-10 bg-white border border-gray-200 rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors shadow-sm"
                >
                    <ArrowLeft className="w-5 h-5 text-gray-600" />
                </button>
                <div>
                    <h1 className="text-3xl font-black text-gray-900">Categorias</h1>
                    <p className="text-gray-500 font-medium">Organize o cardápio.</p>
                </div>
            </header>

            {/* Create New Block */}
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 mb-8">
                <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <Package className="w-5 h-5 text-primary" />
                    Nova Categoria
                </h2>
                <div className="flex flex-col md:flex-row gap-6">
                    <div className="flex-1 space-y-4">
                        <div>
                            <label className="text-xs font-bold text-gray-400 ml-1 mb-1 block">NOME DA CATEGORIA</label>
                            <input
                                type="text"
                                placeholder="Ex: Drinks Especiais"
                                value={newCategoryName}
                                onChange={(e) => setNewCategoryName(e.target.value)}
                                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 font-bold focus:outline-none focus:border-primary transition-colors"
                            />
                        </div>

                        <div>
                            <label className="text-xs font-bold text-gray-400 ml-1 mb-2 block">ÍCONE</label>
                            <div className="grid grid-cols-6 gap-2">
                                {Object.keys(ICON_MAP).map((iconName) => {
                                    if (["Cerveja", "Vinho", "Lanche"].includes(iconName)) return null; // Skip aliases
                                    const Icon = ICON_MAP[iconName];
                                    return (
                                        <button
                                            key={iconName}
                                            onClick={() => setNewCategoryIcon(iconName)}
                                            className={`h-12 rounded-xl flex items-center justify-center border transition-all ${newCategoryIcon === iconName
                                                ? "bg-gray-100 text-primary border-primary shadow-sm ring-1 ring-primary"
                                                : "bg-white text-gray-400 border-gray-100 hover:border-primary/30 hover:bg-gray-50"
                                                }`}
                                            title={iconName}
                                        >
                                            <Icon className="w-6 h-6" strokeWidth={newCategoryIcon === iconName ? 2.5 : 2} />
                                        </button>
                                    )
                                })}
                            </div>
                            <div className="mt-2">
                                <label className="text-[10px] font-bold text-gray-400 uppercase">Ou emoji/url</label>
                                <input
                                    type="text"
                                    placeholder="Copie um emoji 🍔 ou cole URL"
                                    value={newCategoryIcon}
                                    onChange={(e) => setNewCategoryIcon(e.target.value)}
                                    className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-xs font-medium focus:outline-none focus:border-primary transition-colors mt-1"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex items-end">
                        <button
                            onClick={handleCreateCategory}
                            disabled={isSaving || !newCategoryName}
                            className="bg-primary text-white font-bold px-8 py-4 rounded-xl hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary/20 flex items-center gap-2 h-fit mb-1"
                        >
                            {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                            Salvar Categoria
                        </button>
                    </div>
                </div>
            </div>

            {/* Search */}
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 mb-6 flex items-center gap-3">
                <Search className="w-5 h-5 text-gray-400" />
                <input
                    type="text"
                    placeholder="Buscar categoria..."
                    className="flex-1 font-medium outline-none text-gray-700 placeholder:text-gray-400 bg-transparent"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            {/* List */}
            <div className="space-y-3">
                {isLoading ? (
                    <div className="text-center py-10 text-gray-400 animate-pulse flex flex-col items-center gap-2">
                        <Loader2 className="w-6 h-6 animate-spin" />
                        Carregando categorias...
                    </div>
                ) : filteredCategories.length === 0 ? (
                    <div className="text-center py-10 text-gray-400 bg-white rounded-3xl border border-gray-100 border-dashed">
                        Nenhuma categoria encontrada.
                    </div>
                ) : (
                    filteredCategories.map((cat) => (
                        <div key={cat.id} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between group hover:border-gray-200 transition-colors">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center text-2xl border border-gray-100">
                                    {/* Handle Icon rendering: URL vs Emoji vs IconMap */}
                                    {cat.icon && cat.icon.startsWith('http') ? (
                                        <img src={cat.icon} className="w-8 h-8 object-contain" alt="" />
                                    ) : ICON_MAP[cat.icon] ? (
                                        (() => {
                                            const Icon = ICON_MAP[cat.icon];
                                            return <Icon className="w-6 h-6 text-gray-700" />;
                                        })()
                                    ) : (
                                        <span>{cat.icon || "📦"}</span>
                                    )}
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-900">{cat.name}</h3>
                                    <p className="text-xs text-gray-400">ID: {cat.id}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => handleDeleteCategory(cat.id)}
                                    className="w-10 h-10 bg-red-50 text-red-500 rounded-xl flex items-center justify-center hover:bg-red-100 transition-colors"
                                    title="Excluir"
                                >
                                    <Trash2 className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
