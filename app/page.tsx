"use client";

import { Header } from "@/components/Header";
import { CategoryMenu, Category } from "@/components/CategoryMenu";
import { SearchBar } from "@/components/SearchBar";
import { ProductCard } from "@/components/ProductCard";
import { BottomNav } from "@/components/BottomNav";
import { CartShortcut } from "@/components/CartShortcut";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  is_popular: boolean;
  image_url: string | null;
  category_id: number;
}

export default function Home() {
  const { total, count } = useCart();
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  // State for products and filtering
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    // Fetch products
    fetch(`${(process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "")}/api/products`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setProducts(data);
      })
      .catch(err => console.error("Erro ao carregar produtos:", err));

    // Fetch categories from new API
    const fetchCategories = async () => {
      try {
        const res = await fetch('/api/menu-categories');
        const data = await res.json();
        if (Array.isArray(data)) {
          setCategories(data);
        }
      } catch (error) {
        console.error("Erro ao carregar categorias:", error);
      }
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-primary flex items-center justify-center">
        <div className="text-white font-bold text-xl animate-pulse">CarregandoEz...</div>
      </div>
    );
  }

  // Prepend "Todos" for the menu
  const menuCategories = [
    { id: 0, name: "Todos", icon: "LayoutGrid" },
    ...categories
  ];

  return (
    <div className="min-h-screen bg-primary text-foreground font-sans">
      <Header />

      <main className="bg-[#f4f4f5] rounded-t-[40px] px-0 pb-32 shadow-[-10px_0_20px_rgba(0,0,0,0.1)] min-h-[calc(100vh-80px)]">

        <div className="pt-6">
          <CategoryMenu
            categories={menuCategories}
            selectedId={selectedCategoryId}
            onSelect={setSelectedCategoryId}
          />
          <SearchBar
            value={searchTerm}
            onChange={setSearchTerm}
          />

          <div className="px-6 mt-6">
            {!selectedCategoryId && !searchTerm && (
              <h2 className="text-xl font-bold mb-4 text-foreground">Cardápio</h2>
            )}

            {/* Dynamic Product List */}
            <div className="grid grid-cols-1 gap-6">
              {products.length === 0 ? (
                <div className="text-center text-gray-400 py-10">
                  <p>Carregando produtos...</p>
                </div>
              ) : (
                <>
                  {/* Logic: 
                      1. If Search Term -> Show filtered list flat
                      2. If Category Selected -> Show filtered list by category flat
                      3. If Neither -> Show Grouped by Category
                  */}
                  {(searchTerm || selectedCategoryId) ? (
                    // Filtered View
                    products
                      .filter(p => {
                        const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          p.description?.toLowerCase().includes(searchTerm.toLowerCase());
                        const matchesCategory = selectedCategoryId ? p.category_id === selectedCategoryId : true;
                        return matchesSearch && matchesCategory;
                      })
                      .map((product) => (
                        <ProductCard
                          key={product.id}
                          id={String(product.id)}
                          name={product.name}
                          description={product.description || "Sem descrição"}
                          price={Number(product.price)}
                          image={product.image_url}
                        />
                      ))
                  ) : (
                    // Grouped View using Dynamic Categories
                    categories.map((cat) => {
                      const catProducts = products.filter(p => p.category_id === cat.id);

                      if (catProducts.length === 0) return null;

                      return (
                        <div key={cat.id} className="mb-8 last:mb-0">
                          <h3 className="text-lg font-bold mb-3 text-gray-800 flex items-center gap-2">
                            {/* Icon Rendering Logic */}
                            {cat.icon.startsWith('http') ? (
                              <img src={cat.icon} className="w-5 h-5 object-contain" alt="" />
                            ) : (
                              // If it's a Lucide Icon Key (e.g. "Beer"), render the component or nothing if too lazy, but let's render it.
                              // We need to import the icons first. I'll rely on the existing imports (lines 3-14 don't import icons yet). 
                              // Actually, page.tsx doesn't import Lucide icons.
                              // To be safe and simple: If the icon text is > 2 chars and not http, it's likely a key. 
                              // The user wants to avoid "Beer Beer". 
                              // If I can't easily import the icon map, I will just render a generic icon or nothing if it looks like a key.
                              // But better: let's just render it if it's short (emoji).
                              cat.icon && cat.icon.length <= 4 ? <span>{cat.icon}</span> : <span className="w-5 h-5 block bg-primary/20 rounded-full" />
                            )}
                            {cat.name}
                            <span className="text-xs font-normal text-gray-400 bg-gray-100 px-2 py-1 rounded-full">
                              {catProducts.length}
                            </span>
                          </h3>
                          <div className="grid grid-cols-1 gap-4">
                            {catProducts.map((product) => (
                              <ProductCard
                                key={product.id}
                                id={String(product.id)}
                                name={product.name}
                                description={product.description || "Sem descrição"}
                                price={Number(product.price)}
                                image={product.image_url}
                              />
                            ))}
                          </div>
                        </div>
                      );
                    })
                  )}

                  {/* Empty State for Search/Filter */}
                  {(searchTerm || selectedCategoryId) && products.filter(p => {
                    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      p.description?.toLowerCase().includes(searchTerm.toLowerCase());
                    const matchesCategory = selectedCategoryId ? p.category_id === selectedCategoryId : true;
                    return matchesSearch && matchesCategory;
                  }).length === 0 && (
                      <div className="text-center text-gray-400 py-10">
                        <p>Nenhum produto encontrado.</p>
                      </div>
                    )}
                </>
              )}
            </div>
          </div>
        </div>
      </main>

      <CartShortcut
        itemCount={count}
        total={total}
        onClick={() => router.push("/cart")}
      />
      <BottomNav />
    </div>
  );
}
