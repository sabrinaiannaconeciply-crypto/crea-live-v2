"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from "../lib/supabase";

export default function HomePage() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      const { data, error } = await supabase
        .from("live_stock")
        .select("*")
        .eq("status", "actif")
        .order("created_at", { ascending: false });

      if (!error && data) setProducts(data);
      setLoading(false);
    };
    fetchProducts();
  }, []);

  return (
    <div className="min-h-screen bg-stone-950 text-white">
      {/* Barre de navigation */}
      <header className="bg-stone-900 border-b border-stone-800 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="text-xl font-extrabold tracking-tight text-white">
            CRÉA-LIVE <span className="text-amber-500">MARKET</span>
          </Link>
          <nav className="flex items-center gap-6 text-sm font-medium">
            <Link href="/boutique" className="text-stone-300 hover:text-white">La Boutique</Link>
            <Link href="/vendeur" className="text-stone-300 hover:text-white">Espace Vendeur</Link>
            <Link href="/live" className="bg-red-600 text-white px-4 py-2 rounded-full font-bold">
              Créer une vidéo
            </Link>
          </nav>
        </div>
      </header>

      {/* Contenu principal */}
      <main className="max-w-6xl mx-auto px-6 py-10">
        <div className="mb-10 text-center">
          <h1 className="text-4xl font-extrabold mb-4">La Vitrine Vidéo</h1>
          <p className="text-stone-400 text-lg">
            Découvrez les créations de nos vendeurs, présentées en vidéo.
          </p>
        </div>

        {loading ? (
          <p className="text-stone-400 text-center py-10">Chargement des vidéos...</p>
        ) : products.length === 0 ? (
          <div className="bg-stone-900 p-10 rounded-2xl border border-stone-800 text-center text-stone-400">
            Aucune vidéo publiée pour le moment.
          </div>
        ) : (
          <div className="space-y-16">
            {products.map((p) => (
              <div key={p.id} className="bg-stone-900 rounded-2xl border border-stone-800 overflow-hidden shadow-lg">
                {/* Zone Vidéo */}
                {p.video_url && (
                  <div className="bg-black aspect-video flex items-center justify-center">
                    <video src={p.video_url} controls className="w-full h-full object-contain" />
                  </div>
                )}
                
                {/* Zone Produits (sous la vidéo) */}
                <div className="p-6 md:p-8">
                  <h2 className="text-2xl font-bold mb-6 text-amber-500">Produits présentés dans cette vidéo</h2>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {/* Produit principal de la vidéo */}
                    <div className="bg-stone-800 rounded-xl p-3 border border-stone-700 flex flex-col">
                      {p.image_url ? (
                        <img src={p.image_url} alt={p.title} className="w-full h-32 object-cover rounded-lg mb-3" />
                      ) : (
                        <div className="w-full h-32 bg-stone-700 rounded-lg mb-3 flex items-center justify-center text-xs text-stone-500">Sans photo</div>
                      )}
                      
                      <h3 className="font-bold text-sm truncate">{p.title}</h3>
                      <p className="text-amber-400 font-bold text-lg mt-1">{(p.price_cents / 100).toFixed(2)} €</p>
                      
                      {p.categorie && <p className="text-xs text-stone-400 mt-1">Catégorie : {p.categorie}</p>}
                      <p className="text-xs text-stone-500 mb-3">Stock : {p.stock}</p>
                      
                      {/* Variantes (tailles) */}
                      {p.variantes && p.variantes.length > 0 && (
                        <div className="mt-auto">
                          <p className="text-[10px] text-stone-400 mb-2">Choisir une option :</p>
                          <div className="flex flex-wrap gap-1">
                            {p.variantes.map((v: string) => (
                              <button 
                                key={v} 
                                onClick={() => alert(`Ajouté au panier : ${p.title} - Taille ${v}`)} 
                                className="px-3 py-1 bg-stone-700 text-xs rounded-full hover:bg-amber-600 transition"
                              >
                                {v}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {/* Bouton simple si pas de variante */}
                      {(!p.variantes || p.variantes.length === 0) && (
                        <button 
                          onClick={() => alert(`Ajouté au panier : ${p.title}`)} 
                          className="w-full bg-white text-stone-900 text-xs font-bold py-2 rounded mt-2 hover:bg-stone-200 transition"
                        >
                          Ajouter au panier
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <footer className="border-t border-stone-800 py-6 text-center text-sm text-stone-500 mt-10">
        © {new Date().getFullYear()} CRÉA-LIVE MARKET — Tous droits réservés
      </footer>
    </div>
  );
}
