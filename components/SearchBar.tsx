import { Search } from "lucide-react";

interface SearchBarProps {
    value: string;
    onChange: (val: string) => void;
}

export function SearchBar({ value, onChange }: SearchBarProps) {
    return (
        <div className="px-6 py-2">
            <div className="relative group">
                <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                    <Search className="w-5 h-5 text-gray-400 group-focus-within:text-primary transition-colors" />
                </div>
                <input
                    type="text"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    className="block w-full rounded-2xl bg-white border border-gray-200 py-4 pl-12 pr-4 text-sm text-foreground placeholder-gray-400 focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-all shadow-sm"
                    placeholder="Procure aqui..."
                />
            </div>
        </div>
    );
}
