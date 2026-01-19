import { Plus } from "lucide-react";
import { getImageUrl } from '@/app/utils/imageHelper';
import { useCart } from "@/context/CartContext";

interface ProductCardProps {
    id: string; // Added ID for cart logic
    name: string;
    description: string;
    price: number;
    image?: string | null;
}

export function ProductCard({ id, name, description, price, image }: ProductCardProps) {
    const { addItem } = useCart();

    return (
        <div className="group relative flex items-center bg-white rounded-[20px] p-4 transition-all duration-300 hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-gray-50 hover:border-gray-100">

            {/* Image Container with Gradient Placeholder */}
            {/* Image Container */}
            <div className="relative w-24 h-24 shrink-0 mr-5">
                {image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                        src={getImageUrl(image)!}
                        alt={name}
                        className="w-full h-full object-cover transition-transform duration-500 hover:scale-105 rounded-2xl shadow-sm"
                    />
                ) : (
                    <div className="w-full h-full bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl flex items-center justify-center text-xs text-gray-300 shadow-inner">
                        Img
                    </div>
                )}
            </div>

            <div className="flex-1 pr-8">
                <h3 className="text-foreground font-bold text-lg leading-tight group-hover:text-black transition-colors">{name}</h3>
                <p className="text-gray-400 text-xs mt-1.5 mb-3 line-clamp-2 font-medium leading-relaxed">
                    {description}
                </p>
                <span className="text-primary font-bold text-base tracking-tight">R$ {price.toFixed(2)}</span>
            </div>

            {/* Floating Action Button */}
            <button
                onClick={() => addItem({ id, name, price })}
                className="absolute bottom-4 right-4 w-10 h-10 rounded-xl bg-primary/10 group-hover:bg-primary flex items-center justify-center transition-all duration-300 text-primary group-hover:text-black cursor-pointer active:scale-90">
                <Plus className="w-5 h-5 font-bold stroke-[3px]" />
            </button>
        </div>
    );
}
