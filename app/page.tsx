"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from "../lib/supabase";

type Product = {
  id: string;
  title: string;
  price_cents: number;
  image_url: string | null;
  shop_name: string | null;
};

const euro = (cents: number) => (cents / 100).toFixed(2).replace(".", ",") + " €";

const blob = (radius: string) => ({ borderRadius: radius });

export default function AccueilPage() {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from("boutique_products")
        .select("id,title,price_cents,image_url,shop_name")
        .order("created_at", { ascending: false })
        .limit(4);
      if (data) setProducts(data as Product[]);
    };
    load();
  }, []);

  const perks = [
    { title: "Livraison", text: "Belgique, France, Luxembourg, Pays-Bas" },
    { title: "Paiement sécurisé", text: "Carte bancaire et Bancontact" },
    { title: "Créateurs indépendants", text: "Soutenez les talents" },
    { title: "Lives shopping", text: "Achetez en direct, bientôt" },
    { title: "15 articles gratuits", text: "Lancez-vous sans budget" },
  ];

  return (
    <div className="min-h-screen text-stone-900">
      <header className="sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/">
            Avenue des <span>Créateurs</span>
          </Link>
          <nav className="flex items-center gap-5 text-sm font-semibold">
            <Link href="/boutique">Boutique</Link>
            <Link href="/vendeur" className="hidden sm:inline">
              Espace Vendeur
            </Link>
            <Link href="/live" className="hidden sm:inline">
              Lives
            </Link>
            <Link href="/connexion" className="bg-stone-900 px-5 py-2 rounded-full">
              Connexion
            </Link>
          </nav>
        </div>
      </header>

      <section className="hero-wall relative overflow-hidden">
        <div className="absolute -top-16 -left-16 w-72 h-72 opacity-70" style={{ background: "#ff2e88", ...blob("62% 38% 55% 45% / 48% 58% 42% 52%") }} />
        <div className="absolute top-10 right-[-60px] w-64 h-64 opacity-70" style={{ background: "#00b8f0", ...blob("45% 55% 40% 60% / 55% 45% 58% 42%") }} />
        <div className="absolute bottom-[-80px] left-1/3 w-80 h-80 opacity-60" style={{ background: "#ffc800", ...blob("55% 45% 62% 38% / 42% 58% 44% 56%") }} />
        <div className="absolute bottom-10 right-1/4 w-28 h-28 opacity-80" style={{ background: "#ff6a00", ...blob("50% 50% 45% 55% / 55% 45% 55% 45%") }} />

        <div className="relative max-w-6xl mx-auto px-6 py-16 md:py-24 grid md:grid-cols-5 gap-8 items-center">
          <div className="md:col-span-3">
            <h1 className="title-brush text-6xl sm:text-7xl md:text-8xl" style={{ transform: "rotate(-3deg)" }}>
              Avenue
              <span className="block text-5xl sm:text-6xl md:text-7xl" style={{ color: "#ffc800" }}>
                des
              </span>
              Créateurs
            </h1>
            <div className="mt-8">
              <span className="strip text-lg sm:text-xl">CRÉER · VENDRE · PARTAGER · EN DIRECT</span>
            </div>
            <p className="mt-6 text-white text-sm sm:text-base font-semibold tracking-wide uppercase">
              La plateforme qui met les créateurs en lumière.
            </p>
            <div className="mt-7 flex flex-wrap gap-4">
              <Link href="/boutique" className="btn-graffiti btn-yellow">
                Découvrir la boutique →
              </Link>
              <Link href="/live" className="btn-graffiti btn-ghost">
                Voir les lives ▶
              </Link>
            </div>
          </div>

          <div className="md:col-span-2 flex flex-col items-center gap-6">
            <div className="sticker text-xl sm:text-2xl w-64" style={{ transform: "rotate(5deg)" }}>
              Les talents d’aujourd’hui, le monde de demain
            </div>
            <div className="sticker text-lg sm:text-xl w-60" style={{ transform: "rotate(-4deg)", background: "#ff2e88", color: "#ffffff" }}>
              Ici, les idées deviennent réalité
            </div>
            <div className="sticker text-base w-48" style={{ transform: "rotate(3deg)", background: "#00b8f0" }}>
              More creators, less limits
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white border-b-4 border-stone-900">
        <div className="max-w-6xl mx-auto px-6 py-5 grid grid-cols-2 md:grid-cols-5 gap-4">
          {perks.map((perk) => (
            <div key={perk.title}>
              <p className="font-extrabold text-sm uppercase">{perk.title}</p>
              <p className="text-xs text-stone-600">{perk.text}</p>
            </div>
          ))}
        </div>
      </section>

      <main className="max-w-6xl mx-auto px-6 py-14 flex flex-col gap-16">
        <section className="grid md:grid-cols-3 gap-8 items-stretch">
          <div className="flex flex-col justify-center">
            <h2 className="font-graffiti text-5xl leading-none" style={{ transform: "rotate(-2deg)" }}>
              Les lives en direct
            </h2>
            <p className="mt-4 text-stone-700">
              Découvrez les créateurs, posez vos questions et réservez vos pièces pendant le live, avec le stock affiché en direct.
            </p>
            <Link href="/live" className="btn-graffiti bg-stone-900 mt-6 self-start" style={{ color: "#ffffff", background: "#111111" }}>
              Voir tous les lives →
            </Link>
          </div>
          <div className="md:col-span-2 rounded-2xl bg-white relative overflow-hidden min-h-[260px] flex items-end">
            <div className="absolute inset-0" style={{ background: "linear-gradient(135deg, #7a3cff 0%, #ff2e88 55%, #ff6a00 100%)" }} />
            <span className="absolute top-4 left-4 bg-red-600 text-white font-extrabold text-sm px-3 py-1 rounded-md border-2 border-white">LIVE</span>
            <div className="relative p-6 text-white">
              <p className="font-graffiti text-4xl sm:text-5xl leading-none" style={{ textShadow: "3px 3px 0 #111" }}>
                Les premiers lives arrivent bientôt
              </p>
              <p className="mt-2 text-sm font-semibold">Vous êtes créateur ? Préparez votre boutique dès maintenant.</p>
            </div>
          </div>
        </section>

        <section>
          <div className="flex items-end justify-between mb-6">
            <h2 className="font-graffiti text-5xl leading-none" style={{ transform: "rotate(-1.5deg)" }}>
              Nos créations
            </h2>
            <Link href="/boutique" className="font-extrabold text-sm text-amber-600">
              Voir tout →
            </Link>
          </div>
          {products.length === 0 ? (
            <div className="rounded-2xl bg-white p-10 text-center text-stone-600">
              Les premières créations arrivent. Revenez très vite !
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
              {products.map((p) => (
                <Link key={p.id} href="/boutique" className="rounded-2xl bg-white overflow-hidden flex flex-col">
                  {p.image_url ? (
                    <img src={p.image_url} alt={p.title} className="w-full h-44 object-cover" />
                  ) : (
                    <div className="w-full h-44 bg-stone-100 flex items-center justify-center text-stone-400 text-sm">Pas de photo</div>
                  )}
                  <div className="p-4">
                    {p.shop_name && <span className="text-[11px] font-bold uppercase tracking-wide text-stone-500">{p.shop_name}</span>}
                    <h3 className="font-extrabold break-words">{p.title}</h3>
                    <p className="font-extrabold text-amber-600">{euro(p.price_cents)}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-2xl bg-white p-8 md:p-10 grid md:grid-cols-3 gap-6 items-center">
          <div className="md:col-span-2">
            <h2 className="font-graffiti text-4xl sm:text-5xl leading-none">Tu crées ? Ouvre ta boutique</h2>
            <p className="mt-3 text-stone-700">
              15 articles gratuits, des fiches produit avec tailles et stock, des commandes suivies et, bientôt, tes propres lives.
            </p>
          </div>
          <div className="md:text-right">
            <Link href="/connexion" className="btn-graffiti btn-yellow">
              Commencer gratuitement →
            </Link>
          </div>
        </section>
      </main>

      <footer className="bg-stone-900 text-white" style={{ background: "#111111", borderTop: "4px solid #ffc800" }}>
        <div className="max-w-6xl mx-auto px-6 py-8 text-center text-sm">
          <p className="font-graffiti text-3xl">Avenue des Créateurs</p>
          <p className="mt-1 text-stone-400">© 2026 Avenue des Créateurs. Tous droits réservés.</p>
        </div>
      </footer>
    </div>
  );
}
