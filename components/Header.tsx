import { useAuth } from "@/context/AuthContext";
import { Plus } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

const PHRASES = [
    "Vamos para a festa!",
    "Hora de beber!",
    "Hoje é dia de curtir!",
    "Sua noite começa aqui!",
    "Bora aproveitar!",
    "O que vamos beber hoje?"
];

export function Header() {
    const { user } = useAuth();
    const [balance, setBalance] = useState<number | null>(null);
    const [phrase, setPhrase] = useState("bom de ver por aqui.");

    useEffect(() => {
        setPhrase(PHRASES[Math.floor(Math.random() * PHRASES.length)]);
    }, []);

    useEffect(() => {
        const fetchBalance = async () => {
            const token = localStorage.getItem('ezdrink_token');
            if (token) {
                try {
                    const res = await fetch('http://localhost:3001/api/balance', {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    const data = await res.json();
                    if (data.balance !== undefined) {
                        setBalance(data.balance);
                    }
                } catch (e) {
                    console.error("Failed to fetch balance in header", e);
                }
            }
        };
        fetchBalance();
    }, []);

    // Get first name
    const firstName = (user?.name && typeof user.name === 'string') ? user.name.split(' ')[0] : "Visitante";

    return (
        <header className="flex items-center justify-between px-6 pt-12 pb-8 bg-primary">
            <div>
                <h1 className="text-2xl font-bold tracking-tight text-primary-foreground capitalize">
                    Fala {firstName}!
                </h1>
                <p className="text-primary-foreground/70 text-sm font-medium">
                    {phrase}
                </p>
            </div>

            {/* Balance Component - Prime Style */}
            <Link href="/wallet/deposit">
                <div className="group flex items-center gap-3 bg-black/5 hover:bg-black/10 backdrop-blur-sm px-4 py-2 rounded-2xl border border-black/5 transition-all duration-300">
                    <div className="flex flex-col items-end">
                        <span className="text-[10px] uppercase font-bold text-primary-foreground/60 tracking-wider">
                            Saldo EzDrink
                        </span>
                        <span className="text-sm font-bold text-primary-foreground">
                            {balance !== null ? `R$ ${balance.toFixed(2).replace('.', ',')}` : "..."}
                        </span>
                    </div>
                    <div className="w-8 h-8 flex items-center justify-center bg-white rounded-full shadow-sm group-hover:scale-110 transition-all text-primary">
                        <Plus className="w-5 h-5 stroke-[3px]" />
                    </div>
                </div>
            </Link>
        </header>
    );
}
