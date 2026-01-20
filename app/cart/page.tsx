"use client";

import { motion } from "framer-motion";
import { ArrowLeft, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCart } from "@/context/CartContext";
import { CartItemElement } from "@/components/CartItemElement";

export default function CartPage() {
    const router = useRouter();
    const { items, total } = useCart();
    const isEmpty = items.length === 0;

    return (
        // Outer container: Green Background, no scroll at body level
        <div className="fixed inset-0 bg-primary font-sans flex flex-col justify-end">

            {/* 
        This motion div is the "Sheet". 
        It starts off-screen (y: 100%) and animates to y: 0.
        BUT, the container is justified-end, so y:0 means it sits at the bottom.
        We set height to [calc(100%-24px)] to leave a 24px gap at the top.
      */}
            <motion.div
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className="bg-[#f4f4f5] w-full h-[calc(100vh-24px)] rounded-t-[40px] shadow-2xl overflow-hidden flex flex-col"
            >
                <header className="px-6 py-6 flex items-center justify-between sticky top-0 z-10 bg-[#f4f4f5]/90 backdrop-blur-md">
                    <button
                        onClick={() => router.back()}
                        className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-black/5 transition-colors">
                        <ArrowLeft className="w-6 h-6" />
                    </button>
                    <h1 className="text-xl font-bold">Meu carrinho</h1>
                    <div className="w-10" /> {/* Spacer */}
                </header>

                <main className="flex-1 px-6 pb-32 overflow-y-auto scrollbar-hide">
                    <div className="w-full h-px bg-gray-200 mb-8 mx-auto max-w-[200px]" />

                    {isEmpty ? (
                        <div className="flex flex-col items-center justify-center h-[50vh] gap-8">
                            <h2 className="text-xl font-bold text-center">Seu carrinho esta vazio.</h2>

                            <button
                                onClick={() => router.back()}
                                className="w-24 h-24 border-2 border-black rounded-2xl flex items-center justify-center hover:bg-black/5 transition-colors">
                                <Plus className="w-10 h-10 font-thin stroke-[1px]" />
                            </button>

                            <p className="text-lg font-bold">Deseja adicionar algo?</p>
                        </div>
                    ) : (
                        <>
                            <div className="mb-6 text-center">
                                <p className="font-bold text-lg">Voce tem {items.length} itens no seu carrinho!</p>
                            </div>

                            <div className="space-y-4">
                                {items.map(item => (
                                    <CartItemElement key={item.id} {...item} />
                                ))}
                            </div>

                            <div className="mt-8 border-t border-black/10 pt-6 space-y-3">
                                <div className="flex justify-between items-center font-bold text-lg">
                                    <span>Subtotal</span>
                                    <span>R${total.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between items-center font-bold text-sm text-gray-500">
                                    <span>Taxa</span>
                                    <span>R${(total * 0.05).toFixed(2).replace('.', ',')}</span>
                                </div>
                                <div className="border-t border-dashed border-black/20 my-2" />
                                <div className="flex justify-between items-center font-bold text-xl">
                                    <span>Total</span>
                                    <span>R${(total * 1.05).toFixed(2).replace('.', ',')}</span>
                                </div>
                            </div>
                        </>
                    )}
                </main>

                {!isEmpty && (
                    <div className="p-6 bg-white border-t border-gray-100 shadow-lg grid grid-cols-2 gap-4">
                        <button
                            onClick={() => router.push('/split/create')}
                            className="w-full bg-white text-primary border-2 border-primary font-bold text-lg py-4 rounded-xl hover:bg-gray-50 transition-all shadow-sm"
                        >
                            Dividir
                        </button>
                        <button
                            onClick={() => router.push('/checkout')}
                            className="w-full bg-primary text-primary-foreground font-bold text-lg py-4 rounded-xl hover:brightness-110 transition-all shadow-md"
                        >
                            Pagar
                        </button>
                    </div>
                )}
            </motion.div>
        </div>
    );
}
