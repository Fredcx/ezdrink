"use client";

import { getImageUrl } from '@/app/utils/imageHelper';
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface Product {
    id: number;
    name: string;
    description: string;
    price: number;
    category_id: number;
    image: string; // Backend likely returns 'image' or 'image_url'
    image_url?: string;
    is_popular: boolean;
}

const CATEGORIES = [
    { id: 1, name: "Cervejerias" },
    { id: 2, name: "Drinks e Coquetéis" },
    { id: 3, name: "Combos" },
    { id: 4, name: "Destilados e Doses" },
    { id: 5, name: "Vinhos e Espumantes" },
    { id: 6, name: "Sem Álcool" },
]; // Mapping based on typical ID structure, adjust if needed

export default function AdminProductsPage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        name: "",
        description: "",
        price: "",
        category_id: "1",
        image: null as File | null
    });
    const [previewImage, setPreviewImage] = useState<string | null>(null);

    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        try {
            const res = await fetch(`${(process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "")}/api/products`);
            const data = await res.json();
            setProducts(data);
        } catch (error) {
            console.error("Failed to fetch products", error);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (product?: Product) => {
        if (product) {
            setEditingProduct(product);
            setFormData({
                name: product.name,
                description: product.description || "",
                price: product.price.toString(),
                category_id: product.category_id.toString(),
                image: null
            });
            setPreviewImage(getImageUrl(product.image));
        } else {
            setEditingProduct(null);
            setFormData({
                name: "",
                description: "",
                price: "",
                category_id: "1",
                image: null
            });
            setPreviewImage(null);
        }
        setIsModalOpen(true);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setFormData({ ...formData, image: file });
            setPreviewImage(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const data = new FormData();
            data.append('name', formData.name);
            data.append('description', formData.description);
            data.append('price', formData.price);
            data.append('category_id', formData.category_id);
            if (formData.image) {
                data.append('image', formData.image);
            }

            const url = editingProduct
                ? `${(process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "")}/api/products/${editingProduct.id}`
                : `${(process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "")}/api/products`;

            const method = editingProduct ? 'PUT' : 'POST';

            // IMPORTANT: Do NOT set Content-Type header manually for FormData, fetch does it with boundary
            const res = await fetch(url, {
                method: method,
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('ezdrink_token') || ''}`
                },
                body: data
            });

            if (!res.ok) {
                const errorData = await res.json().catch(() => ({ error: res.statusText }));
                throw new Error(errorData.error || "Falha ao salvar produto");
            }

            await fetchProducts();
            setIsModalOpen(false);
        } catch (error: any) {
            console.error(error);
            alert(`Erro ao salvar: ${error.message}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm("Tem certeza que deseja excluir este produto?")) return;

        try {
            const res = await fetch(`${(process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "")}/api/products/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('ezdrink_token') || ''}`
                },
            });
            if (res.ok) fetchProducts();
        } catch (error) {
            alert("Erro ao excluir");
        }
    };

    const filteredProducts = products.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="max-w-7xl mx-auto">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
                <div>
                    <h1 className="text-3xl font-black text-gray-900">Cardápio</h1>
                    <p className="text-gray-500 font-medium">Gerencie suas bebidas e combos.</p>
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    className="bg-primary text-white font-bold px-6 py-3 rounded-xl flex items-center gap-2 hover:brightness-110 transition-all shadow-lg shadow-primary/20"
                >
                    <Plus className="w-5 h-5" />
                    Novo Produto
                </button>
            </header>

            {/* Search Bar */}
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 mb-8 flex items-center gap-3">
                <Search className="w-5 h-5 text-gray-400" />
                <input
                    type="text"
                    placeholder="Buscar produto..."
                    className="flex-1 font-medium outline-none text-gray-700 placeholder:text-gray-400"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            {/* Products List */}
            {loading ? (
                <div className="text-center py-20 text-gray-400 animate-pulse">Carregando cardápio...</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredProducts.map((product) => (
                        <motion.div
                            key={product.id}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="bg-white p-4 rounded-3xl shadow-sm border border-gray-100 flex gap-4 group"
                        >
                            {/* Image */}
                            <div className="w-24 h-24 bg-gray-100 rounded-2xl flex-shrink-0 overflow-hidden relative border border-gray-100">
                                {getImageUrl(product.image_url || null) ? (
                                    <img src={getImageUrl(product.image_url || null)!} alt={product.name} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-gray-300">
                                        <ImageIcon className="w-8 h-8" />
                                    </div>
                                )}
                            </div>

                            {/* Info */}
                            <div className="flex-1 flex flex-col justify-between py-1">
                                <div>
                                    <h3 className="font-bold text-gray-900 line-clamp-1">{product.name}</h3>
                                    <p className="text-xs text-gray-400 mb-1 line-clamp-1">{product.description || "Sem descrição"}</p>
                                    <p className="text-sm font-bold text-primary">R$ {product.price?.toFixed(2).replace('.', ',')}</p>
                                </div>
                                <div className="flex gap-2 mt-2">
                                    <button
                                        onClick={() => handleOpenModal(product)}
                                        className="flex-1 bg-gray-50 hover:bg-gray-100 text-gray-700 py-2 rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1"
                                    >
                                        <Edit2 className="w-3 h-3" /> Editar
                                    </button>
                                    <button
                                        onClick={() => handleDelete(product.id)}
                                        className="w-8 bg-red-50 hover:bg-red-100 text-red-500 rounded-lg flex items-center justify-center transition-colors"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                    {filteredProducts.length === 0 && (
                        <div className="col-span-full py-10 text-center text-gray-400">
                            Nenhum produto encontrado.
                        </div>
                    )}
                </div>
            )}

            {/* Edit/Create Modal */}
            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-white rounded-3xl p-6 w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto [&::-webkit-scrollbar]:hidden"
                            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                        >
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-2xl font-bold">{editingProduct ? 'Editar Produto' : 'Novo Produto'}</h2>
                                <button onClick={() => setIsModalOpen(false)} className="bg-gray-100 p-2 rounded-full hover:bg-gray-200">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                {/* Image Upload */}
                                <div className="flex justify-center mb-6">
                                    <div className="relative group cursor-pointer w-full">
                                        <input
                                            type="file"
                                            onChange={handleFileChange}
                                            accept="image/*"
                                            className="absolute inset-0 opacity-0 z-10 cursor-pointer"
                                        />
                                        <div className={`w-full h-40 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center transition-colors ${previewImage ? 'border-primary/50' : 'border-gray-200 hover:border-primary'}`}>
                                            {previewImage ? (
                                                <img src={previewImage} alt="Preview" className="w-full h-full object-cover rounded-2xl" />
                                            ) : (
                                                <div className="text-center text-gray-400">
                                                    <UploadCloud className="w-8 h-8 mx-auto mb-2" />
                                                    <p className="text-xs font-bold">Clique para enviar imagem</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label className="text-xs font-bold text-gray-400 ml-1 mb-1 block">NOME DO PRODUTO</label>
                                    <input
                                        required
                                        type="text"
                                        className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 font-bold outline-none focus:border-primary"
                                        placeholder="Ex: Gin Tônica"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs font-bold text-gray-400 ml-1 mb-1 block">PREÇO (R$)</label>
                                        <input
                                            required
                                            type="number"
                                            step="0.01"
                                            className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 font-bold outline-none focus:border-primary"
                                            placeholder="0,00"
                                            value={formData.price}
                                            onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-gray-400 ml-1 mb-1 block">CATEGORIA</label>
                                        <select
                                            className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 font-bold outline-none focus:border-primary appearance-none cursor-pointer"
                                            value={formData.category_id}
                                            onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                                        >
                                            {CATEGORIES.map(cat => (
                                                <option key={cat.id} value={cat.id}>{cat.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="text-xs font-bold text-gray-400 ml-1 mb-1 block">DESCRIÇÃO</label>
                                    <textarea
                                        className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 font-medium outline-none focus:border-primary h-24 resize-none"
                                        placeholder="Ingredientes e detalhes..."
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="w-full bg-primary text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 hover:brightness-110 transition-all shadow-lg shadow-primary/20 disabled:opacity-50"
                                >
                                    {isSubmitting && <Loader2 className="w-5 h-5 animate-spin" />}
                                    {editingProduct ? 'Salvar Alterações' : 'Criar Produto'}
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
