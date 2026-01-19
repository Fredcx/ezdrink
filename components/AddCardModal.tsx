"use client";

import { motion } from "framer-motion";
import { X, CreditCard, Calendar, Lock } from "lucide-react";
import { useState } from "react";

interface AddCardModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (card: { id?: string; last4: string; brand: string; raw?: any }) => void;
}

export function AddCardModal({ isOpen, onClose, onSave }: AddCardModalProps) {
    const [cardNumber, setCardNumber] = useState("");
    const [name, setName] = useState("");
    const [expiry, setExpiry] = useState("");
    const [cvv, setCvv] = useState("");

    // Production fields
    const [cpf, setCpf] = useState("");
    const [zipCode, setZipCode] = useState("");
    const [street, setStreet] = useState("");
    const [number, setNumber] = useState("");

    const [isForeigner, setIsForeigner] = useState(false); // Toggle for foreigners
    const [saveCard, setSaveCard] = useState(true);

    // Helper to reset
    const resetForm = () => {
        setCardNumber("");
        setName("");
        setExpiry("");
        setCvv("");
        setCpf("");
        setZipCode("");
        setStreet("");
        setNumber("");
        setIsForeigner(false);
        setSaveCard(true);
    };

    // Helper for brand (basic)
    const getBrand = (num: string) => {
        if (num.startsWith('4')) return 'visa';
        if (num.startsWith('5')) return 'mastercard';
        return 'credit_card';
    };

    const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let value = e.target.value.replace(/\D/g, "");
        if (value.length > 16) value = value.slice(0, 16);
        const formatted = value.replace(/(\d{4})(?=\d)/g, "$1 ");
        setCardNumber(formatted);
    };

    const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let value = e.target.value.replace(/\D/g, "");
        if (value.length > 4) value = value.slice(0, 4);
        if (value.length >= 2) {
            value = `${value.slice(0, 2)}/${value.slice(2)}`;
        }
        setExpiry(value);
    };

    const handleCvvChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let value = e.target.value.replace(/\D/g, "");
        if (value.length > 4) value = value.slice(0, 4);
        setCvv(value);
    };

    // Validate CPF (Basic check)
    const isValidCPF = (str: string) => {
        if (isForeigner) return str.length >= 5; // Passport/Doc check
        const clean = str.replace(/\D/g, "");
        return clean.length === 11;
    };

    const handleSave = async () => {
        const cleanNumber = cardNumber.replace(/\D/g, "");

        // Validation Logic
        const isCardValid = cleanNumber.length >= 13 && name.length > 3 && expiry.length === 5 && cvv.length >= 3;
        const isDocValid = isValidCPF(cpf);
        const isAddressValid = isForeigner ? true : (zipCode.length >= 8 && street.length > 3 && number.length > 0);

        if (isCardValid && isDocValid && isAddressValid) {
            const billingData = isForeigner ? {
                // Default fallback for foreigner (since we don't ask address yet to simplify)
                zip_code: "00000000",
                street: "Foreign Customer",
                number: "0",
                neighborhood: "N/A",
                city: "N/A",
                state: "XX",
                country: "US"
            } : {
                zip_code: zipCode.replace(/\D/g, ""),
                street: street,
                number: number,
                neighborhood: "Centro", // Simplification
                city: "São Paulo", // Simplification - ideally fetch from ZIP
                state: "SP",
                country: "BR"
            };

            const payloadRaw = {
                number: cleanNumber,
                name: name,
                expiry: expiry,
                cvv: cvv,
                cpf: cpf.replace(/\D/g, ""),
                billing: billingData,
                is_foreigner: isForeigner
            };

            if (saveCard) {
                // Send to backend
                try {
                    const token = localStorage.getItem('ezdrink_token');
                    const res = await fetch(`${(process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "")}/api/cards`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        },
                        body: JSON.stringify(payloadRaw)
                    });
                    const data = await res.json();

                    if (data.success) {
                        onSave({
                            id: data.card.id,
                            last4: data.card.last4,
                            brand: data.card.brand
                        });
                        onClose();
                        resetForm();
                    } else {
                        alert("Erro ao salvar cartão: " + data.error);
                    }
                } catch (err) {
                    console.error(err);
                    alert("Erro de conexão ao salvar cartão");
                }
            } else {
                // "ONE-TIME PAYMENT" Flow
                onSave({
                    id: 'temp_' + Date.now(),
                    last4: cleanNumber.slice(-4),
                    brand: getBrand(cleanNumber),
                    // @ts-ignore
                    raw: payloadRaw
                });
                onClose();
                resetForm();
            }
        } else {
            alert("Preencha todos os dados corretamente.");
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-end justify-center">
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
                className="relative w-full bg-white rounded-t-[40px] p-8 shadow-2xl overflow-hidden flex flex-col"
            >
                <div className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto mb-8 shrink-0" />

                <div className="flex items-center justify-between mb-8">
                    <h2 className="text-2xl font-bold text-black">Adicionar Cartão</h2>
                    <button onClick={onClose} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200">
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                <div className="space-y-4 mb-8">
                    {/* Number */}
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Número do Cartão</label>
                        <div className="relative">
                            <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                            <input
                                type="text"
                                placeholder="0000 0000 0000 0000"
                                value={cardNumber}
                                onChange={handleCardNumberChange}
                                maxLength={19}
                                className="w-full bg-gray-50 border-gray-200 border rounded-xl py-4 pl-12 pr-4 font-bold text-gray-900 focus:ring-2 focus:ring-primary/50 focus:border-primary focus:bg-white transition-all outline-none"
                            />
                        </div>
                    </div>

                    {/* Name */}
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Nome do Titular</label>
                        <input
                            type="text"
                            placeholder="Como está no cartão"
                            value={name}
                            onChange={(e) => setName(e.target.value.toUpperCase())}
                            className="w-full bg-gray-50 border-gray-200 border rounded-xl py-4 px-4 font-bold text-gray-900 focus:ring-2 focus:ring-primary/50 focus:border-primary focus:bg-white transition-all outline-none"
                        />
                    </div>

                    <div className="flex gap-4">
                        {/* Expiry */}
                        <div className="flex-1">
                            <label className="block text-sm font-bold text-gray-700 mb-2">Validade</label>
                            <div className="relative">
                                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                                <input
                                    type="text"
                                    placeholder="MM/AA"
                                    value={expiry}
                                    onChange={handleExpiryChange}
                                    maxLength={5}
                                    className="w-full bg-gray-50 border-gray-200 border rounded-xl py-4 pl-12 pr-4 font-bold text-gray-900 focus:ring-2 focus:ring-primary/50 focus:border-primary focus:bg-white transition-all outline-none"
                                />
                            </div>
                        </div>

                        {/* CVV */}
                        <div className="w-1/3">
                            <label className="block text-sm font-bold text-gray-700 mb-2">CVV</label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                                <input
                                    type="text"
                                    placeholder="123"
                                    value={cvv}
                                    onChange={handleCvvChange}
                                    maxLength={4}
                                    className="w-full bg-gray-50 border-gray-200 border rounded-xl py-4 pl-12 pr-4 font-bold text-gray-900 focus:ring-2 focus:ring-primary/50 focus:border-primary focus:bg-white transition-all outline-none"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2 mb-4">
                    <input
                        type="checkbox"
                        id="saveCard"
                        checked={saveCard}
                        onChange={(e) => setSaveCard(e.target.checked)}
                        className="w-5 h-5 accent-primary rounded cursor-pointer"
                    />
                    <label htmlFor="saveCard" className="text-sm font-bold text-gray-700 cursor-pointer">
                        Salvar cartão para futuras compras
                    </label>
                </div>

                <button
                    onClick={handleSave}
                    className="w-full bg-primary text-primary-foreground font-bold text-xl py-4 rounded-2xl hover:brightness-110 transition-all shadow-md mt-auto"
                >
                    {saveCard ? "Salvar Cartão" : "Usar Cartão"}
                </button>

            </motion.div>
        </div>
    );
}
