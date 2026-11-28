"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from "../../lib/supabase";

export default function VideoBoutiquePage() {
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
      <header className="bg-stone-900 border-b border-stone-800 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="text-xl font-extrabold tracking-tight text-white">
            AVENUE DES <span className="text-amber-600">CRÉATEURS</span>
          </Link>
          <nav className="flex items-center gap-6 text-sm font-medium">
            <Link href="/" className="text-stone-300 hover:text-white">Accueil</Link>
            <Link href="/boutique" className="text-stone-300 hover:text-white">La Boutique</Link>
            <Link href="/video" className="bg-amber-600 text-white px-4 py-2 rounded-full font-bold">
              Voir les vidéos
            </Link>
          </nav>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold">La Vitrine Vidéo</h1>
          <p className="text-stone-400 text-sm mt-2">Découvrez les créations présentées en vidéo par nos vendeurs.</p>
        </div>

        {loading ? (
          <p className="text-stone-400">Chargement des vidéos...</p>
        ) : products.length === 0 ? (
          <div className="bg-stone-900 p-10 rounded-2xl border border-stone-800 text-center text-stone-400">
            Aucune vidéo publiée pour le moment.
          </div>
        ) : (
          <div className="space-y-12">
            {products.map((p) => (
              <div key={p.id} className="bg-stone-900 rounded-2xl border border-stone-800 overflow-hidden">
                {/* Zone Vidéo */}
                {p.video_url && (
                  <div className="bg-black aspect-video flex items-center justify-center">
                    <video src={p.video_url} controls className="w-full h-full object-contain" />
                  </div>
                )}
                
                {/* Zone Produits (sous la vidéo) */}
                <div className="p-6">
                  <h2 className="text-2xl font-bold mb-4">Produits présentés dans cette vidéo</h2>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {/* Note: Ici, on affiche le produit principal pour l'instant, 
                        mais plus tard on pourra filtrer par vidéo_id */}
                    <div className="bg-stone-800 rounded-xl p-3 border border-stone-700">
                      {p.image_url ? (
                        <img src={p.image_url} alt={p.title} className="w-full h-32 object-cover rounded-lg mb-2" />
                      ) : (
                        <div className="w-full h-32 bg-stone-700 rounded-lg mb-2 flex items-center justify-center text-xs text-stone-500">Sans photo</div>
                      )}
                      <h3 className="font-bold text-sm truncate">{p.title}</h3>
                      <p className="text-amber-400 font-bold">{(p.price_cents / 100).toFixed(2)} €</p>
                      {p.categorie && <p className="text-xs text-stone-400">{p.categorie}</p>}
                      <p className="text-xs text-stone-500 mb-2">Stock: {p.stock}</p>
                      
                      {p.variantes && p.variantes.length > 0 && (
                        <div className="mb-2">
                          <p className="text-[10px] text-stone-400 mb-1">Options :</p>
                          <div className="flex flex-wrap gap-1">
                            {p.variantes.map((v: string) => (
                              <button key={v} onClick={() => alert(`Ajouté : ${p.title} - ${v}`)} className="px-2 py-0.5 bg-stone-700 text-xs rounded hover:bg-amber-600 transition">
                                {v}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {(!p.variantes || p.variantes.length === 0) && (
                        <button onClick={() => alert(`Ajouté : ${p.title}`)} className="w-full bg-white text-stone-900 text-xs font-bold py-1.5 rounded mt-2 hover:bg-stone-200">
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
    </div>
  );
}
