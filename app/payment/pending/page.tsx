"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { QRCodeSVG } from "qrcode.react";
import { ArrowLeft, Clock, CheckCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { useCart } from "@/context/CartContext";

export default function PendingPaymentPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const ticket = searchParams.get('ticket');
    const total = searchParams.get('total');
    const isSuccess = searchParams.get('success') === 'true';
    const type = searchParams.get('type'); // 'deposit' or 'order'
    // 'ready' maps to 'Active' tab in /orders
    const [status, setStatus] = useState(isSuccess ? 'ready' : 'aguardando_pagamento');
    const { clearCart } = useCart();

    useEffect(() => {
        if (isSuccess) {
            if (type !== 'deposit') {
                clearCart();
            }
            const timer = setTimeout(() => {
                if (type === 'deposit') {
                    router.push('/checkout'); // Back to checkout after deposit
                } else {
                    router.push('/orders');
                }
            }, 6000);
            return () => clearTimeout(timer);
        }

        const interval = setInterval(async () => {
            // Poll for status update
        }, 5000);
        return () => clearInterval(interval);
    }, [isSuccess, router]);

    return (
        <div className="min-h-screen bg-primary flex flex-col items-center justify-center p-6 text-center">
            <div className="bg-white p-8 rounded-[40px] shadow-2xl w-full max-w-sm flex flex-col items-center">
                {isSuccess ? (
                    <>
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-6">
                            <CheckCircle className="w-8 h-8 text-green-600" />
                        </div>
                        <h1 className="text-2xl font-black text-gray-900 mb-2">
                            {type === 'deposit' ? 'Recarga Confirmada!' : 'Pagamento Confirmado!'}
                        </h1>
                        <p className="text-gray-500 mb-8 text-sm">
                            {type === 'deposit'
                                ? 'Seu saldo já está disponível para uso.'
                                : 'Seu pedido foi recebido! Mostre este código no balcão para retirar.'}
                        </p>

                        {type !== 'deposit' && (
                            <div className="bg-white p-4 rounded-3xl border-2 border-dashed border-green-200 mb-6 relative">
                                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-green-100 text-green-700 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                                    TICKET DE RETIRADA
                                </div>
                                {ticket && <QRCodeSVG value={`https://ezdrink.app/waiter/order/${ticket}`} size={200} />}
                            </div>
                        )}
                    </>
                ) : (
                    <>
                        <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mb-6 animate-pulse">
                            <Clock className="w-8 h-8 text-yellow-600" />
                        </div>

                        <h1 className="text-2xl font-black text-gray-900 mb-2">Pagar no Balcão</h1>
                        <p className="text-gray-500 mb-8 text-sm">
                            Mostre este QR Code para o garçom ou vá ao caixa para pagar em dinheiro.
                        </p>

                        <div className="bg-white p-4 rounded-3xl border-2 border-dashed border-gray-300 mb-6">
                            {ticket && <QRCodeSVG value={`https://ezdrink.app/waiter/order/${ticket}`} size={200} />}
                        </div>
                    </>
                )}

                {type !== 'deposit' && (
                    <div className="bg-gray-50 rounded-2xl p-4 w-full mb-6">
                        <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mb-1">
                            {isSuccess ? 'NÚMERO DO PEDIDO' : 'CÓDIGO'}
                        </p>
                        <p className="text-3xl font-black text-gray-900 tracking-widest">{ticket?.replace('PAG-', '') || ticket}</p>
                    </div>
                )}

                <div className="flex justify-between w-full text-sm font-bold text-gray-400 border-t border-gray-100 pt-4">
                    <span>Total a pagar</span>
                    <span className="text-gray-900">R$ {parseFloat(total || '0').toFixed(2)}</span>
                </div>

                <button onClick={() => router.push('/')} className="mt-8 text-gray-400 font-bold text-sm">
                    Ir para o início
                </button>
            </div>
        </div>
    );
}
