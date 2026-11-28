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
    <div className="min-h-screen bg-[#F9F7F3] text-[#1A1A1A] font-sans">
      {/* Barre de navigation */}
      <header className="bg-white border-b border-stone-200 sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-6 py-5 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold tracking-widest text-stone-900 uppercase">
            Avenue des <span className="text-amber-600">Créateurs</span>
          </Link>
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium tracking-wide">
            <Link href="/boutique" className="text-stone-600 hover:text-black transition">Boutique</Link>
            <Link href="/vendeur" className="text-stone-600 hover:text-black transition">Espace Vendeur</Link>
            <Link href="/live" className="text-stone-600 hover:text-black transition">Espace Vidéo</Link>
            <Link href="/connexion" className="border border-stone-900 text-stone-900 px-5 py-2 rounded-full hover:bg-stone-900 hover:text-white transition">
              Connexion
            </Link>
          </nav>
        </div>
      </header>

      {/* BANNIÈRE AVEC VOTRE IMAGE */}
      <section className="relative w-full h-[400px] md:h-[500px] overflow-hidden">
        {/* Remplacez le lien ci-dessous par celui de votre image générée par IA */}
        <img 
          src="VOTRE_LIEN_IMAGE_ICI" 
          alt="Avenue des Créateurs" 
          className="w-full h-full object-cover object-center"
        />
        {/* Un voile sombre pour que le texte soit lisible si besoin */}
        <div className="absolute inset-0 bg-black/30"></div>
        
        {/* Texte par-dessus l'image */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6">
          <h1 className="text-4xl md:text-6xl font-serif text-white mb-4 drop-shadow-lg">
            Avenue des Créateurs
          </h1>
          <p className="text-lg md:text-xl text-white font-medium mb-8 drop-shadow-md">
            La plateforme qui met les créateurs en lumière.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/boutique" className="bg-white text-stone-900 font-medium py-3 px-8 rounded-full hover:bg-stone-100 transition shadow-lg">
              Découvrir la boutique
            </Link>
            <Link href="/live" className="border-2 border-white text-white font-medium py-3 px-8 rounded-full hover:bg-white/10 transition">
              Voir les vidéos
            </Link>
          </div>
        </div>
      </section>

      {/* Section principale (design épuré) */}
      <main className="max-w-6xl mx-auto px-6 py-16">
        {/* Les trois piliers */}
        <div className="grid md:grid-cols-3 gap-6 mb-20">
          <div className="bg-white p-8 rounded-2xl border border-stone-100 shadow-sm flex flex-col justify-between">
            <div>
              <h2 className="text-lg font-semibold mb-2">1. La Boutique</h2>
              <p className="text-stone-500 text-sm mb-6">Explorez les créations disponibles et ajoutez-les à votre panier.</p>
            </div>
            <Link href="/boutique" className="text-sm font-semibold text-stone-900 hover:text-amber-600 transition">
              Voir la Boutique →
            </Link>
          </div>

          <div className="bg-white p-8 rounded-2xl border border-stone-100 shadow-sm flex flex-col justify-between">
            <div>
              <h2 className="text-lg font-semibold mb-2">2. Espace Vendeur</h2>
              <p className="text-stone-500 text-sm mb-6">Gérez vos coordonnées, votre stock et vos ventes en toute simplicité.</p>
            </div>
            <Link href="/vendeur" className="text-sm font-semibold text-stone-900 hover:text-amber-600 transition">
              Accéder à mon Espace →
            </Link>
          </div>

          <div className="bg-stone-900 text-white p-8 rounded-2xl shadow-sm flex flex-col justify-between">
            <div>
              <h2 className="text-lg font-semibold mb-2">3. Les Vidéos</h2>
              <p className="text-stone-400 text-sm mb-6">Regardez les créateurs présenter leurs produits en vidéo et réservez leurs pièces.</p>
            </div>
            <Link href="/live" className="text-sm font-semibold text-white hover:text-amber-400 transition">
              Découvrir les vidéos →
            </Link>
          </div>
        </div>

        {/* Section Vitrine Vidéo */}
        <div className="border-t border-stone-200 pt-16">
          <div className="flex justify-between items-end mb-10">
            <div>
              <h2 className="text-3xl font-serif text-stone-900">Dernières présentations</h2>
              <p className="text-stone-500 mt-2">Découvrez les créations de nos vendeurs en vidéo.</p>
            </div>
          </div>
          
          {loading ? (
            <p className="text-stone-400 text-center py-10">Chargement des vidéos...</p>
          ) : products.length === 0 ? (
            <div className="bg-white p-16 rounded-3xl border border-stone-100 text-center">
              <p className="text-stone-500 text-lg">Aucune vidéo publiée pour le moment.</p>
              <p className="text-stone-400 text-sm mt-2">Les créations de nos vendeurs apparaîtront ici très bientôt.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              {products.map((p) => (
                <div key={p.id} className="bg-white rounded-3xl overflow-hidden border border-stone-100 shadow-sm flex flex-col">
                  {p.video_url && (
                    <div className="bg-stone-900 aspect-video">
                      <video src={p.video_url} controls className="w-full h-full object-contain" />
                    </div>
                  )}
                  
                  <div className="p-8 flex-grow">
                    <div className="flex gap-6 items-start">
                      {p.image_url ? (
                        <img src={p.image_url} alt={p.title} className="w-24 h-24 object-cover rounded-xl" />
                      ) : (
                        <div className="w-24 h-24 bg-stone-100 rounded-xl flex items-center justify-center text-xs text-stone-400">Sans photo</div>
                      )}
                      <div>
                        <h3 className="font-semibold text-xl text-stone-900">{p.title}</h3>
                        <p className="text-amber-700 font-bold text-lg mt-1">{(p.price_cents / 100).toFixed(2)} €</p>
                        {p.categorie && <p className="text-xs text-stone-400 mt-1 uppercase tracking-wider">{p.categorie}</p>}
                        <p className="text-sm text-stone-500 mt-1">Stock : {p.stock}</p>
                      </div>
                    </div>

                    {p.variantes && p.variantes.length > 0 && (
                      <div className="mt-6">
                        <p className="text-sm text-stone-500 mb-3">Choisir une option :</p>
                        <div className="flex flex-wrap gap-2">
                          {p.variantes.map((v: string) => (
                            <button key={v} onClick={() => alert(`Ajouté : ${p.title} - ${v}`)} className="px-4 py-2 border border-stone-200 text-stone-800 text-sm rounded-lg hover:border-stone-900 hover:bg-stone-900 hover:text-white transition">
                              {v}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {(!p.variantes || p.variantes.length === 0) && (
                      <button onClick={() => alert(`Ajouté : ${p.title}`)} className="w-full mt-6 bg-stone-900 text-white font-medium py-3 rounded-lg hover:bg-stone-800 transition">
                        Ajouter au panier
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      <footer className="border-t border-stone-200 py-8 text-center text-sm text-stone-400">
        © {new Date().getFullYear()} Avenue des Créateurs — Tous droits réservés
      </footer>
    </div>
  );
}
