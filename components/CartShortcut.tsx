import { ShoppingBag } from "lucide-react";

interface CartShortcutProps {
    itemCount: number;
    total: number;
    onClick: () => void;
}

export function CartShortcut({ itemCount, total, onClick }: CartShortcutProps) {
    if (itemCount === 0) return null;

    return (
        <div className="fixed bottom-[88px] left-6 right-6 z-40 animate-in slide-in-from-bottom-4 fade-in duration-300">
            <button
                onClick={onClick}
                className="w-full bg-primary text-primary-foreground p-4 rounded-2xl shadow-lg flex items-center justify-between"
            >
                <div className="flex items-center gap-3">
                    <div className="bg-black/10 flex items-center justify-center w-8 h-8 rounded-full">
                        <span className="text-sm font-bold">{itemCount}</span>
                    </div>
                    <span className="text-sm font-medium">Ver cesta</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="font-bold text-sm">R$ {total.toFixed(2)}</span>
                    <ShoppingBag className="w-5 h-5" />
                </div>
            </button>
        </div>
    );
}
