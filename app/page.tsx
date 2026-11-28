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
    <div className="min-h-screen bg-stone-50 text-stone-900 flex flex-col">
      {/* Barre de navigation */}
      <header className="bg-white border-b border-stone-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="text-xl font-extrabold tracking-tight text-stone-900">
            AVENUE DES <span className="text-amber-600">CRÉATEURS</span>
          </Link>
          <nav className="flex items-center gap-4 text-sm font-medium">
            <Link href="/boutique" className="text-stone-700 hover:text-amber-600 transition">Boutique</Link>
            <Link href="/vendeur" className="text-stone-700 hover:text-amber-600 transition">Espace Vendeur</Link>
            <Link href="/live" className="text-stone-700 hover:text-amber-600 transition">Espace Vidéo</Link>
            <Link href="/connexion" className="bg-amber-600 text-white px-4 py-2 rounded-full font-semibold hover:bg-amber-700 transition">
              Inscription / Connexion
            </Link>
          </nav>
        </div>
      </header>

      {/* Section principale (Hero) */}
      <main className="flex-1 max-w-6xl mx-auto px-6 py-16 flex flex-col justify-center">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <span className="inline-block bg-amber-100 text-amber-800 text-xs font-semibold px-3 py-1 rounded-full mb-4">
            Artisanat • Création • Vente en vidéo
          </span>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-stone-900 mb-6">
            La plateforme des créateurs et de leurs clients.
          </h1>
          <p className="text-lg text-stone-600 mb-8">
            Inscrivez-vous en tant que <strong>Vendeur</strong> pour ouvrir votre boutique et présenter vos créations en vidéo, ou en tant que <strong>Client</strong> pour commander.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/connexion" className="bg-stone-900 text-white font-bold py-4 px-8 rounded-2xl hover:bg-stone-800 transition shadow-sm">
              🏪 Ouvrir un compte Vendeur
            </Link>
            <Link href="/connexion" className="bg-amber-600 text-white font-bold py-4 px-8 rounded-2xl hover:bg-amber-700 transition shadow-sm">
              🛍️ Créer un compte Client
            </Link>
          </div>
        </div>

        {/* Les trois blocs */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <div className="bg-white p-8 rounded-2xl border border-stone-200 shadow-sm flex flex-col justify-between">
            <div>
              <h2 className="text-xl font-bold mb-2">1. La Boutique</h2>
              <p className="text-stone-600 text-sm mb-6">Explorez les créations disponibles et ajoutez-les à votre panier.</p>
            </div>
            <Link href="/boutique" className="w-full text-center bg-stone-100 text-stone-900 font-semibold py-3 rounded-xl hover:bg-stone-200 transition text-sm">
              Voir la Boutique
            </Link>
          </div>

          <div className="bg-white p-8 rounded-2xl border border-stone-200 shadow-sm flex flex-col justify-between">
            <div>
              <h2 className="text-xl font-bold mb-2">2. Espace Vendeur</h2>
              <p className="text-stone-600 text-sm mb-6">Réservé aux vendeurs inscrits : gérez vos coordonnées, votre stock et vos ventes.</p>
            </div>
            <Link href="/vendeur" className="w-full text-center bg-stone-100 text-stone-900 font-semibold py-3 rounded-xl hover:bg-stone-200 transition text-sm">
              Accéder à mon Espace Vendeur
            </Link>
          </div>

          <div className="bg-stone-900 text-white p-8 rounded-2xl shadow-sm flex flex-col justify-between">
            <div>
              <h2 className="text-xl font-bold mb-2">3. Les Vidéos</h2>
              <p className="text-stone-300 text-sm mb-6">Regardez les créateurs présenter leurs produits en vidéo et réservez leurs pièces avant épuisement.</p>
            </div>
            <Link href="/live" className="w-full text-center bg-white text-stone-900 font-semibold py-3 rounded-xl hover:bg-stone-100 transition text-sm">
              Créer ou voir une vidéo
            </Link>
          </div>
        </div>

        {/* NOUVELLE SECTION : La Vitrine Vidéo directement sur l'accueil */}
        <div className="border-t border-stone-200 pt-12">
          <h2 className="text-3xl font-extrabold text-center mb-8">Dernières présentations vidéo</h2>
          
          {loading ? (
            <p className="text-center text-stone-500">Chargement des vidéos...</p>
          ) : products.length === 0 ? (
            <div className="bg-white p-10 rounded-2xl border border-stone-200 text-center text-stone-500">
              Aucune vidéo publiée pour le moment. Les créations des vendeurs apparaîtront ici.
            </div>
          ) : (
            <div className="space-y-12">
              {products.map((p) => (
                <div key={p.id} className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden flex flex-col md:flex-row">
                  {/* Vidéo à gauche (ou en haut sur mobile) */}
                  {p.video_url && (
                    <div className="md:w-1/2 bg-black aspect-video md:aspect-auto flex items-center justify-center">
                      <video src={p.video_url} controls className="w-full h-full object-contain" />
                    </div>
                  )}
                  
                  {/* Produits à droite (ou en bas) */}
                  <div className={`p-6 md:p-8 flex flex-col justify-center ${p.video_url ? 'md:w-1/2' : 'w-full'}`}>
                    <h3 className="text-xl font-bold mb-4">Découvrez cette création</h3>
                    <div className="bg-stone-50 p-4 rounded-xl border border-stone-200">
                      <div className="flex gap-4">
                        {p.image_url ? (
                          <img src={p.image_url} alt={p.title} className="w-24 h-24 object-cover rounded-lg" />
                        ) : (
                          <div className="w-24 h-24 bg-stone-200 rounded-lg flex items-center justify-center text-xs text-stone-500">Sans photo</div>
                        )}
                        <div>
                          <h4 className="font-bold text-lg">{p.title}</h4>
                          <p className="text-amber-600 font-extrabold text-xl">{(p.price_cents / 100).toFixed(2)} €</p>
                          {p.categorie && <p className="text-xs text-stone-500 mt-1">Catégorie : {p.categorie}</p>}
                          <p className="text-xs text-stone-500">Stock : {p.stock}</p>
                        </div>
                      </div>

                      {/* Variantes */}
                      {p.variantes && p.variantes.length > 0 && (
                        <div className="mt-4">
                          <p className="text-sm text-stone-600 mb-2">Choisir une option :</p>
                          <div className="flex flex-wrap gap-2">
                            {p.variantes.map((v: string) => (
                              <button key={v} onClick={() => alert(`Ajouté : ${p.title} - ${v}`)} className="px-4 py-2 bg-white border border-stone-300 text-stone-800 text-sm font-semibold rounded-lg hover:bg-amber-600 hover:text-white transition">
                                {v}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {(!p.variantes || p.variantes.length === 0) && (
                        <button onClick={() => alert(`Ajouté : ${p.title}`)} className="w-full mt-4 bg-stone-900 text-white font-bold py-2 rounded-lg hover:bg-stone-800 transition">
                          Ajouter au panier
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      <footer className="border-t border-stone-200 py-6 text-center text-sm text-stone-500 mt-10">
        © {new Date().getFullYear()} CRÉA-LIVE MARKET — Tous droits réservés
      </footer>
    </div>
  );
}
