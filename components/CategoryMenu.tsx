import { Beer, Sandwich, Wine, Package, Pizza, Coffee, IceCream, Utensils, GlassWater, LayoutGrid } from "lucide-react";



export interface Category {
    id: number;
    name: string;
    icon: string;
}

interface CategoryMenuProps {
    categories?: Category[]; // Make optional
    selectedId: number | null;
    onSelect: (id: number | null) => void;
}

const ICON_MAP: Record<string, any> = {
    "Beer": Beer,
    "Wine": Wine,
    "Sandwich": Sandwich,
    "Package": Package,
    "Pizza": Pizza,
    "Coffee": Coffee,
    "IceCream": IceCream,
    "Utensils": Utensils,
    "GlassWater": GlassWater,
    "LayoutGrid": LayoutGrid,
    "Cerveja": Beer, // Pt-br alias
    "Vinho": Wine,
    "Lanche": Sandwich
};

export function CategoryMenu({ categories = [], selectedId, onSelect }: CategoryMenuProps) {
    return (
        <div className="py-4">
            <h2 className="text-xl font-bold mb-4 px-6 text-foreground tracking-tight">Menu</h2>

            <div className="flex gap-4 overflow-x-auto px-6 pb-6 pt-2 scrollbar-hide">
                {(categories || []).map((cat) => {
                    const isActive = (cat.id === 0 && !selectedId) || (cat.id === selectedId);
                    const isUrl = cat.icon?.startsWith("http");

                    // Resolve Icon Component
                    // If cat.icon matches a key in ICON_MAP, use it.
                    // Otherwise check for known keywords or custom.
                    // If cat.icon is just an emoji or text, render as text.
                    // But user specifically wants the OLD look, which was Lucide icons.
                    // We can try to dynamically match or default to Package if it looks like a component name.
                    let IconComponent = ICON_MAP[cat.icon] || Package;

                    // If it's short (emoji) or url, we don't use IconComponent
                    const isEmoji = !isUrl && cat.icon && cat.icon.length <= 4 && !ICON_MAP[cat.icon];

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
                            ) : isEmoji ? (
                                <span className="text-2xl mb-2 leading-none">{cat.icon}</span>
                            ) : (
                                // Render Lucide Icon
                                <IconComponent className={`w-7 h-7 mb-2 ${isActive ? "stroke-[2.5px]" : "stroke-[2px]"}`} />
                            )}
                            <span className="text-xs font-semibold tracking-wide truncate w-full px-1">{cat.name}</span>
                        </button>
                    )
                })}
            </div>
        </div>
    );
}
