"use client";

import { getImageUrl } from '@/app/utils/imageHelper';
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Search, ShoppingBag, X, CreditCard, Banknote, Smartphone, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { CategoryMenu, Category } from "@/components/CategoryMenu";
import { supabase } from "@/lib/supabase";

export default function WaiterPOSPage() {
    const router = useRouter();
    const [products, setProducts] = useState<any[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
    const [cart, setCart] = useState<{ [key: string]: number }>({});
    const [loading, setLoading] = useState(true);
    const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [success, setSuccess] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        fetchProducts();
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        const { data } = await supabase
            .from('categories')
            .select('*')
            .order('order_index', { ascending: true });
        if (data) setCategories(data);
    };

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

    const addToCart = (product: any) => {
        setCart(prev => ({
            ...prev,
            [product.id]: (prev[product.id] || 0) + 1
        }));
        // Haptic feedback
        if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(50);
    };

    const removeFromCart = (product: any) => {
        setCart(prev => {
            const newCount = (prev[product.id] || 0) - 1;
            if (newCount <= 0) {
                const { [product.id]: _, ...rest } = prev;
                return rest;
            }
            return { ...prev, [product.id]: newCount };
        });
    };

    const cartTotal = products.reduce((acc, product) => {
        return acc + (product.price * (cart[product.id] || 0));
    }, 0);

    const cartCount = Object.values(cart).reduce((a, b) => a + b, 0);

    const handleQuickSale = async (method: 'cash' | 'card' | 'pix_machine') => {
        setProcessing(true);
        try {
            const items = Object.entries(cart).map(([id, qty]) => {
                const product = products.find(p => p.id == id);
                return {
                    id: product.id,
                    name: product.name,
                    price: product.price,
                    quantity: qty
                };
            });

            const res = await fetch(`${(process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "")}/api/orders/create-cash`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('ezdrink_token')}`
                },
                body: JSON.stringify({
                    cart: items,
                    payment_method: method
                })
            });

            if (res.ok) {
                setSuccess(true);
                // Auto-close after 2s
                setTimeout(() => {
                    setCart({});
                    setSuccess(false);
                    setIsCheckoutOpen(false);
                }, 2000);
            } else {
                alert("Erro ao processar venda");
            }

        } catch (error) {
            alert("Erro de conexão");
        } finally {
            setProcessing(false);
        }
    };

    const filteredProducts = products.filter(p => {
        const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = selectedCategoryId ? p.category_id === selectedCategoryId : true;
        return matchesSearch && matchesCategory;
    });

    const menuCategories = [
        { id: 0, name: "Todos", icon: "📦" },
        ...categories
    ];

    return (
        <div className="min-h-screen bg-[#f4f4f5] pb-32">
            {/* Header */}
            <header className="bg-white p-4 sticky top-0 z-10 shadow-sm flex flex-col gap-4">
                <div className="flex items-center justify-between">
                    <Link href="/waiter" className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100">
                        <ArrowLeft className="w-6 h-6 text-gray-700" />
                    </Link>
                    <div className="flex-1 mx-4 bg-gray-100 rounded-full flex items-center px-4 h-10">
                        <Search className="w-4 h-4 text-gray-400 mr-2" />
                        <input
                            className="bg-transparent w-full text-sm outline-none font-medium"
                            placeholder="Buscar produto..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                {/* Categories */}
                <div className="-mx-4">
                    <CategoryMenu
                        categories={menuCategories}
                        selectedId={selectedCategoryId}
                        onSelect={setSelectedCategoryId}
                    />
                </div>
            </header>

            {/* Product Grid */}
            <div className="p-4 grid grid-cols-2 gap-4">
                {loading ? (
                    <div className="col-span-2 text-center py-10 text-gray-400">Carregando catálogo...</div>
                ) : (
                    filteredProducts.map(product => {
                        const qty = cart[product.id] || 0;
                        return (
                            <motion.button
                                whileTap={{ scale: 0.95 }}
                                key={product.id}
                                onClick={() => addToCart(product)}
                                className={`bg-white rounded-3xl p-3 shadow-sm border-2 text-left relative overflow-hidden transition-all ${qty > 0 ? 'border-primary ring-2 ring-primary/20' : 'border-transparent'}`}
                            >
                                <div className="aspect-square bg-gray-100 rounded-2xl mb-3 overflow-hidden relative">
                                    <img
                                        src={getImageUrl(product.image_url)}
                                        className="w-full h-full object-cover"
                                        alt={product.name}
                                    />
                                    {qty > 0 && (
                                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center backdrop-blur-[2px]">
                                            <span className="text-3xl font-black text-white">{qty}</span>
                                        </div>
                                    )}
                                </div>
                                <h3 className="font-bold text-gray-900 leading-tight text-sm mb-1 line-clamp-2 min-h-[2.5em]">{product.name}</h3>
                                <div className="flex justify-between items-center">
                                    <span className="font-bold text-green-600">R$ {product.price.toFixed(2)}</span>
                                </div>
                            </motion.button>
                        );
                    })
                )}
            </div>

            {/* Floating Cart Bar */}
            <AnimatePresence>
                {cartCount > 0 && !isCheckoutOpen && (
                    <motion.div
                        initial={{ y: 100 }} animate={{ y: 0 }} exit={{ y: 100 }}
                        className="fixed bottom-6 left-6 right-6 z-20"
                    >
                        <button
                            onClick={() => setIsCheckoutOpen(true)}
                            className="w-full bg-black text-white p-4 rounded-3xl shadow-2xl shadow-black/30 flex items-center justify-between active:scale-95 transition-transform"
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center font-bold">
                                    {cartCount}
                                </div>
                                <div className="flex flex-col items-start">
                                    <span className="text-xs text-zinc-400 font-bold uppercase tracking-wider">Total</span>
                                    <span className="font-bold text-lg">R$ {cartTotal.toFixed(2)}</span>
                                </div>
                            </div>
                            <span className="font-bold text-primary flex items-center gap-2 pr-2">
                                Cobrar <ShoppingBag className="w-5 h-5" />
                            </span>
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Checkout Overlay */}
            <AnimatePresence>
                {isCheckoutOpen && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-6"
                    >
                        {success ? (
                            <motion.div
                                initial={{ scale: 0.8 }} animate={{ scale: 1 }}
                                className="bg-white w-full max-w-sm rounded-[40px] p-10 flex flex-col items-center text-center m-6"
                            >
                                <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mb-6 text-green-600">
                                    <CheckCircle2 className="w-12 h-12" />
                                </div>
                                <h2 className="text-2xl font-black text-gray-900 mb-2">Venda Realizada!</h2>
                                <p className="text-gray-500 font-medium">O sistema já registrou a saída.</p>
                            </motion.div>
                        ) : (
                            <motion.div
                                initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
                                className="bg-[#f4f4f5] w-full max-w-sm h-[85vh] rounded-t-[40px] sm:rounded-[40px] overflow-hidden flex flex-col shadow-2xl relative"
                            >
                                {/* Header */}
                                <div className="p-6 bg-white shrink-0 flex items-center justify-between border-b border-gray-100">
                                    <h2 className="text-xl font-bold">Pagamento</h2>
                                    <button onClick={() => setIsCheckoutOpen(false)} className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                                        <X className="w-5 h-5 text-gray-500" />
                                    </button>
                                </div>

                                {/* Items List */}
                                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                                    {Object.entries(cart).map(([id, qty]) => {
                                        const product = products.find(p => p.id == id);
                                        return (
                                            <div key={id} className="flex items-center justify-between bg-white p-3 rounded-2xl shadow-sm">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-12 h-12 bg-gray-100 rounded-xl overflow-hidden">
                                                        <img src={getImageUrl(product.image_url)} className="w-full h-full object-cover" />
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-gray-900 leading-tight">{product.name}</p>
                                                        <p className="text-xs text-gray-500">R$ {product.price.toFixed(2)} x {qty}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <button onClick={() => removeFromCart(product)} className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center font-bold text-gray-400">-</button>
                                                    <span className="font-bold text-lg w-4 text-center">{qty}</span>
                                                    <button onClick={() => addToCart(product)} className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center font-bold">+</button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Payment Options */}
                                <div className="p-6 bg-white border-t border-gray-100 space-y-3">
                                    <div className="flex justify-between items-center mb-4">
                                        <span className="text-gray-500 font-bold">Total a receber</span>
                                        <span className="text-3xl font-black text-gray-900">R$ {cartTotal.toFixed(2)}</span>
                                    </div>

                                    <div className="grid grid-cols-3 gap-3">
                                        <button
                                            onClick={() => handleQuickSale('cash')}
                                            disabled={processing}
                                            className="flex flex-col items-center justify-center gap-2 p-4 bg-green-50 rounded-2xl border-2 border-green-100 active:bg-green-100 transition-colors"
                                        >
                                            <Banknote className="w-8 h-8 text-green-600" />
                                            <span className="font-bold text-xs text-green-800">Dinheiro</span>
                                        </button>

                                        <button
                                            onClick={() => handleQuickSale('card')}
                                            disabled={processing}
                                            className="flex flex-col items-center justify-center gap-2 p-4 bg-gray-50 rounded-2xl border-2 border-gray-100 active:bg-gray-100 transition-colors"
                                        >
                                            <CreditCard className="w-8 h-8 text-gray-600" />
                                            <span className="font-bold text-xs text-gray-800">Cartão</span>
                                        </button>

                                        <button
                                            onClick={() => handleQuickSale('pix_machine')}
                                            disabled={processing}
                                            className="flex flex-col items-center justify-center gap-2 p-4 bg-gray-50 rounded-2xl border-2 border-gray-100 active:bg-gray-100 transition-colors"
                                        >
                                            <Smartphone className="w-8 h-8 text-blue-600" />
                                            <span className="font-bold text-xs text-blue-800">Pix</span>
                                        </button>
                                    </div>
                                    <div className="text-center text-xs text-gray-400 mt-2 font-medium">
                                        Ao confirmar, o pedido será marcado como pago e entregue.
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
