import { Home, ClipboardList, User } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function BottomNav() {
    const pathname = usePathname();

    const isActive = (path: string) => pathname === path;

    return (
        <nav className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-lg border-t border-gray-200 px-6 py-4 pb-6 z-50">
            <div className="flex justify-around items-center">
                <Link
                    href="/"
                    className={`flex flex-col items-center gap-1 transition-colors ${isActive('/') ? 'text-primary' : 'text-gray-400 hover:text-black'}`}
                >
                    <Home className="w-6 h-6" />
                    <span className="text-xs font-medium">Cardápio</span>
                </Link>

                <Link
                    href="/orders"
                    className={`flex flex-col items-center gap-1 transition-colors ${isActive('/orders') ? 'text-primary' : 'text-gray-400 hover:text-black'}`}
                >
                    <ClipboardList className="w-6 h-6" />
                    <span className="text-xs font-medium">Pedidos</span>
                </Link>

                <Link
                    href="/profile"
                    className={`flex flex-col items-center gap-1 transition-colors ${isActive('/profile') ? 'text-primary' : 'text-gray-400 hover:text-black'}`}
                >
                    <User className="w-6 h-6" />
                    <span className="text-xs font-medium">Perfil</span>
                </Link>
            </div>
        </nav>
    );
}
