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
    <div className="min-h-screen bg-zinc-950 text-white font-sans">
      {/* Barre de navigation */}
      <header className="bg-black border-b border-zinc-800 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="text-2xl font-black tracking-tighter text-white uppercase italic">
            Avenue des <span className="text-yellow-400">Créateurs</span>
          </Link>
          <nav className="hidden md:flex items-center gap-8 text-sm font-bold uppercase tracking-wider">
            <Link href="/boutique" className="text-zinc-300 hover:text-yellow-400 transition">Boutique</Link>
            <Link href="/vendeur" className="text-zinc-300 hover:text-yellow-400 transition">Espace Vendeur</Link>
            <Link href="/live" className="text-zinc-300 hover:text-yellow-400 transition">Espace Vidéo</Link>
            <Link href="/connexion" className="bg-yellow-400 text-black px-6 py-2 rounded-full font-black hover:bg-white transition shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] hover:shadow-none hover:translate-x-1 hover:translate-y-1">
              Connexion
            </Link>
          </nav>
        </div>
      </header>

      {/* HERO SECTION - Style Street Art */}
      <section className="relative bg-zinc-900 border-b border-zinc-800 overflow-hidden">
        <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
        
        {/* Taches de peinture (décoratives) */}
        <div className="absolute top-10 left-10 w-64 h-64 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse"></div>
        <div className="absolute bottom-10 right-10 w-72 h-72 bg-yellow-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>

        <div className="relative max-w-7xl mx-auto px-6 py-24 flex flex-col items-center text-center z-10">
          <h1 className="text-5xl md:text-7xl font-black uppercase italic tracking-tighter leading-none mb-6">
            La plateforme des <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-pink-500">créateurs</span>
          </h1>
          <p className="text-lg md:text-xl text-zinc-300 max-w-2xl mb-10 font-medium">
            Vendez vos créations, présentez-les en vidéo et touchez votre public. 
            Pas de limites, que du talent.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/connexion" className="bg-yellow-400 text-black font-black uppercase tracking-wide py-4 px-8 rounded-full shadow-[4px_4px_0px_0px_rgba(236,72,153,1)] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition">
              Découvrir la boutique
            </Link>
            <Link href="/live" className="bg-white text-black font-black uppercase tracking-wide py-4 px-8 rounded-full shadow-[4px_4px_0px_0px_rgba(250,204,21,1)] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition flex items-center gap-2">
              Voir les vidéos <span className="text-xl">▶</span>
            </Link>
          </div>
        </div>
      </section>

      {/* BANDEAU DE VALEURS */}
      <div className="bg-yellow-400 text-black py-4 border-b-4 border-black">
        <div className="max-w-7xl mx-auto px-6 flex flex-wrap justify-between items-center text-sm font-black uppercase tracking-wider">
          <span className="flex items-center gap-2">🚚 Livraison rapide</span>
          <span className="flex items-center gap-2">🔒 Paiement sécurisé</span>
          <span className="flex items-center gap-2">🎨 Créateurs indépendants</span>
          <span className="flex items-center gap-2">📹 Vidéos shopping</span>
          <span className="flex items-center gap-2">♻️ Mode responsable</span>
        </div>
      </div>

      {/* SECTION VIDÉO ET PRODUITS */}
      <main className="max-w-7xl mx-auto px-6 py-20">
        <div className="flex items-center gap-4 mb-12">
          <div className="bg-red-600 text-white p-2 rounded-full animate-pulse">
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
          </div>
          <h2 className="text-4xl font-black uppercase italic tracking-tight">Les vidéos en direct</h2>
        </div>

        {loading ? (
          <p className="text-zinc-500 font-bold uppercase tracking-widest text-center py-10">Chargement des vidéos...</p>
        ) : products.length === 0 ? (
          <div className="bg-zinc-900 border-2 border-zinc-800 border-dashed p-16 rounded-3xl text-center">
            <p className="text-zinc-500 font-bold text-xl">Aucune vidéo pour le moment.</p>
            <p className="text-zinc-600 mt-2">Les créations des vendeurs apparaîtront ici.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            {products.map((p) => (
              <div key={p.id} className="bg-white text-black rounded-3xl overflow-hidden border-4 border-black shadow-[8px_8px_0px_0px_rgba(236,72,153,1)] flex flex-col">
                {/* Vidéo */}
                <div className="bg-black aspect-video relative">
                  {p.video_url ? (
                    <video src={p.video_url} controls className="w-full h-full object-contain" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-zinc-600 font-bold uppercase">Vidéo bientôt disponible</div>
                  )}
                  <div className="absolute top-4 left-4 bg-red-600 text-white text-xs font-black px-3 py-1 rounded-full uppercase tracking-wider">En direct</div>
                </div>
                
                {/* Produits en dessous */}
                <div className="p-6 bg-zinc-50 flex-grow">
                  <div className="flex gap-6 items-start">
                    {p.image_url ? (
                      <img src={p.image_url} alt={p.title} className="w-32 h-32 object-cover rounded-2xl border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]" />
                    ) : (
                      <div className="w-32 h-32 bg-zinc-200 rounded-2xl border-2 border-black flex items-center justify-center text-xs font-bold">Sans photo</div>
                    )}
                    <div>
                      <h3 className="font-black text-2xl uppercase leading-tight mb-1">{p.title}</h3>
                      <p className="text-pink-600 font-black text-xl mb-2">{(p.price_cents / 100).toFixed(2)} €</p>
                      {p.categorie && <span className="inline-block bg-black text-white text-xs font-bold px-2 py-1 rounded mb-2 uppercase">{p.categorie}</span>}
                      <p className="text-sm font-bold text-zinc-500 uppercase">Stock : {p.stock}</p>
                    </div>
                  </div>

                  {/* Variantes */}
                  {p.variantes && p.variantes.length > 0 && (
                    <div className="mt-6">
                      <p className="text-xs font-black uppercase tracking-wider text-zinc-500 mb-2">Choisir une option :</p>
                      <div className="flex flex-wrap gap-2">
                        {p.variantes.map((v: string) => (
                          <button key={v} onClick={() => alert(`Ajouté au panier : ${p.title} - Taille ${v}`)} className="px-4 py-2 bg-white border-2 border-black text-black font-black text-sm rounded-full hover:bg-pink-500 hover:text-white transition shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-y-1">
                            {v}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {(!p.variantes || p.variantes.length === 0) && (
                    <button onClick={() => alert(`Ajouté au panier : ${p.title}`)} className="w-full mt-6 bg-black text-white font-black uppercase tracking-wider py-3 rounded-full hover:bg-pink-600 transition">
                      Ajouter au panier
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <footer className="bg-black py-12 text-center border-t border-zinc-800">
        <p className="text-zinc-500 font-bold uppercase tracking-widest text-sm">
          © {new Date().getFullYear()} Avenue des Créateurs — Tous droits réservés
        </p>
      </footer>
    </div>
  );
}
