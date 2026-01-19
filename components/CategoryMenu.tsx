import { Beer, Sandwich, Wine, Package } from "lucide-react";

const categories = [
    { id: 0, name: "Todos", icon: Package }, // 0 or null for "All"
    { id: 1, name: "Cervejerias", icon: Beer },
    { id: 2, name: "Drinks", icon: Wine },
    { id: 3, name: "Combos", icon: Package },
    { id: 4, name: "Destilados", icon: Wine },
    { id: 5, name: "Vinhos", icon: Wine },
    { id: 6, name: "Sem Álcool", icon: Sandwich },
];

interface CategoryMenuProps {
    selectedId: number | null;
    onSelect: (id: number | null) => void;
}

export function CategoryMenu({ selectedId, onSelect }: CategoryMenuProps) {
    return (
        <div className="py-4">
            <h2 className="text-xl font-bold mb-4 px-6 text-foreground tracking-tight">Menu</h2>

            {/* 
                Updated Scroll Container:
                - Added px-6 directly to scroll container so padding is part of the scroll area (content starts offset).
                - Added py-4 to give vertical room for shadows.
                - Using -ml-6 w-[calc(100%+48px)] hack isn't needed if we just let it flow. 
                - But for full bleed scroll with padding: 
                  We want the items to be 24px from edge, but scroll all the way to edge.
                  Common utility: px-6 on container.
            */}
            <div className="flex gap-4 overflow-x-auto px-6 pb-6 pt-2 scrollbar-hide">
                {categories.map((cat) => {
                    // "Todos" is selected if selectedId is null or 0
                    const isActive = (cat.id === 0 && !selectedId) || (cat.id === selectedId);

                    return (
                        <button
                            key={cat.id}
                            onClick={() => onSelect(cat.id === 0 ? null : cat.id)}
                            className={`flex flex-col items-center justify-center min-w-[80px] h-[80px] rounded-3xl transition-all duration-300 shrink-0 ${isActive
                                ? "bg-primary text-primary-foreground shadow-[0_10px_20px_-10px_rgba(71,241,90,0.5)] transform scale-105"
                                : "bg-white text-gray-400 hover:text-primary hover:bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-lg border border-transparent hover:border-primary/10"
                                }`}
                        >
                            <cat.icon className={`w-7 h-7 mb-2 ${isActive ? "stroke-[2.5px]" : "stroke-[2px]"}`} />
                            <span className="text-[11px] font-semibold tracking-wide">{cat.name}</span>
                        </button>
                    )
                })}
            </div>
        </div>
    );
}
