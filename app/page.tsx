"use client";

import { Header } from "@/components/Header";
import { CategoryMenu } from "@/components/CategoryMenu";
import { SearchBar } from "@/components/SearchBar";
import { ProductCard } from "@/components/ProductCard";
import { BottomNav } from "@/components/BottomNav";
import { CartShortcut } from "@/components/CartShortcut";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  is_popular: boolean;
  image_url: string | null;
  category_id: number;
}

// Map category IDs to names for display headers
const CATEGORY_NAMES: Record<number, string> = {
  1: "Cervejerias",
  2: "Drinks",
  3: "Combos",
  4: "Destilados",
  5: "Vinhos",
  6: "Sem Álcool",
};

export default function Home() {
  const { total, count } = useCart();
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  // State for products and filtering
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    // Fetch products
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/products`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setProducts(data);
      })
      .catch(err => console.error("Erro ao carregar produtos:", err));
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

  return (
    <div className="min-h-screen bg-primary text-foreground font-sans">
      <Header />

      <main className="bg-[#f4f4f5] rounded-t-[40px] px-0 pb-32 shadow-[-10px_0_20px_rgba(0,0,0,0.1)] min-h-[calc(100vh-80px)]">

        <div className="pt-6">
          <CategoryMenu
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
                    // Grouped View
                    Object.entries(CATEGORY_NAMES).map(([catIdStr, catName]) => {
                      const catId = Number(catIdStr);
                      const catProducts = products.filter(p => p.category_id === catId);

                      if (catProducts.length === 0) return null;

                      return (
                        <div key={catId} className="mb-8 last:mb-0">
                          <h3 className="text-lg font-bold mb-3 text-gray-800 flex items-center gap-2">
                            {catName}
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
