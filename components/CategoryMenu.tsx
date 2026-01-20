import { Beer, Sandwich, Wine, Package } from "lucide-react";



export interface Category {
    id: number;
    name: string;
    icon: string;
}

interface CategoryMenuProps {
    categories: Category[];
    selectedId: number | null;
    onSelect: (id: number | null) => void;
}

export function CategoryMenu({ categories, selectedId, onSelect }: CategoryMenuProps) {
    return (
        <div className="py-4">
            <h2 className="text-xl font-bold mb-4 px-6 text-foreground tracking-tight">Menu</h2>

            <div className="flex gap-4 overflow-x-auto px-6 pb-6 pt-2 scrollbar-hide">
                {categories.map((cat) => {
                    const isActive = (cat.id === 0 && !selectedId) || (cat.id === selectedId);
                    const isUrl = cat.icon.startsWith("http");

                    return (
                        <button
                            key={cat.id}
                            onClick={() => onSelect(cat.id === 0 ? null : cat.id)}
                            className={`flex flex-col items-center justify-center min-w-[80px] h-[80px] rounded-3xl transition-all duration-300 shrink-0 ${isActive
                                ? "bg-primary text-primary-foreground shadow-[0_10px_20px_-10px_rgba(71,241,90,0.5)] transform scale-105"
                                : "bg-white text-gray-400 hover:text-primary hover:bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-lg border border-transparent hover:border-primary/10"
                                }`}
                        >
                            {isUrl ? (
                                <img src={cat.icon} alt="" className="w-7 h-7 mb-2 object-contain" />
                            ) : (
                                <span className="text-2xl mb-2 leading-none">{cat.icon || "📦"}</span>
                            )}
                            <span className="text-[11px] font-semibold tracking-wide">{cat.name}</span>
                        </button>
                    )
                })}
            </div>
        </div>
    );
}
