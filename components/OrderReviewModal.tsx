"use client";

import { motion } from "framer-motion";
import { CreditCard, MapPin, Clock, X } from "lucide-react";
import { useEffect, useState } from "react";

interface CartItem {
    id: number | string;
    name: string;
    price: number;
    quantity: number;
}

interface OrderReviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    total: number;
    paymentMethodName: string;
    items: CartItem[];
}

export function OrderReviewModal({ isOpen, onClose, onConfirm, total, paymentMethodName, items }: OrderReviewModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
            {/* Backdrop */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />

            {/* Sheet */}
            <motion.div
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                className="relative w-full bg-white rounded-t-[40px] p-8 shadow-2xl overflow-hidden max-h-[85vh] flex flex-col"
            >
                {/* Handle Bar */}
                <div className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto mb-8 shrink-0" />

                <h2 className="text-2xl font-bold text-center mb-10 text-black">
                    Revise o seu pedido
                </h2>

                <div className="space-y-8 mb-10 pl-2 overflow-y-auto scrollbar-hide">
                    {/* Payment Info */}
                    <div className="flex items-start gap-4">
                        <div className="w-12 h-8 border-2 border-black rounded flex items-center justify-center shrink-0 mt-1">
                            <div className="w-1 h-1 bg-black rounded-full mx-0.5" />
                            <div className="w-2 h-2 bg-black rounded-full mx-0.5" />
                        </div>
                        <div>
                            <h3 className="font-bold text-black text-lg">Forma de pagamento</h3>
                            <p className="text-gray-500 font-medium">{paymentMethodName} - <span className="text-primary font-bold">R${total.toFixed(2).replace('.', ',')}</span></p>
                        </div>
                    </div>

                    {/* Items Info */}
                    <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center shrink-0 text-black font-bold border border-gray-200">
                            {items.length}x
                        </div>
                        <div className="w-full">
                            <h3 className="font-bold text-black text-lg mb-2">Itens do pedido</h3>
                            <div className="space-y-3">
                                {items.map((item) => (
                                    <div key={item.id} className="flex justify-between items-center text-sm border-b border-gray-100 pb-2 last:border-0">
                                        <span className="text-gray-600 font-medium">
                                            <span className="text-black font-bold mr-2">{item.quantity}x</span>
                                            {item.name}
                                        </span>
                                        <span className="font-bold text-gray-900">R$ {(item.price * item.quantity).toFixed(2).replace('.', ',')}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="space-y-3 mt-auto">
                    <button
                        onClick={onConfirm}
                        className="w-full bg-primary text-primary-foreground font-bold text-xl py-4 rounded-2xl hover:brightness-110 transition-all shadow-md"
                    >
                        Fazer pedido
                    </button>

                    <button
                        onClick={onClose}
                        className="w-full text-gray-500 font-bold text-lg py-3 hover:text-black transition-colors"
                    >
                        Alterar pedido
                    </button>
                </div>
            </motion.div>
        </div>
    );
}
