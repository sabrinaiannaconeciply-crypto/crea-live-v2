"use client";

import Link from "next/link";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 flex flex-col">
      {/* Barre de navigation */}
      <header className="bg-white border-b border-stone-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="text-xl font-extrabold tracking-tight text-stone-900">
            CRÉA-LIVE <span className="text-amber-600">MARKET</span>
          </Link>
          <nav className="flex items-center gap-6 text-sm font-medium">
            <Link href="/boutique" className="text-stone-700 hover:text-amber-600 transition">
              Boutique (Clients)
            </Link>
            <Link href="/vendeur" className="text-stone-700 hover:text-amber-600 transition">
              Espace Vendeur
            </Link>
            <Link
              href="/live"
              className="bg-stone-900 text-white px-4 py-2 rounded-full hover:bg-stone-800 transition flex items-center gap-2"
            >
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              Espace Live
            </Link>
          </nav>
        </div>
      </header>

      {/* Section principale (Vitrine) */}
      <main className="flex-1 max-w-6xl mx-auto px-6 py-16 flex flex-col justify-center">
        <div className="text-center max-w-3xl mx-auto mb-14">
          <span className="inline-block bg-amber-100 text-amber-800 text-xs font-semibold px-3 py-1 rounded-full mb-4">
            Artisanat • Création • Vente en direct
          </span>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-stone-900 mb-6">
            Découvrez des créations uniques, en boutique ou en direct.
          </h1>
          <p className="text-lg text-stone-600">
            Choisissez votre espace ci-dessous selon que vous souhaitez acheter des créations ou gérer votre boutique vendeur.
          </p>
        </div>

        {/* Trois espaces bien distincts */}
        <div className="grid md:grid-cols-3 gap-8">
          {/* Carte 1 : Espace Client (Boutique) */}
          <div className="bg-white p-8 rounded-2xl border border-stone-200 shadow-sm flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 bg-amber-100 text-amber-700 rounded-xl flex items-center justify-center text-2xl mb-6">
                🛍️
              </div>
              <h2 className="text-2xl font-bold mb-3">Espace Client</h2>
              <p className="text-stone-600 mb-6">
                Parcourez le catalogue de la boutique, ajoutez vos coups de cœur à votre panier et commandez en toute simplicité.
              </p>
            </div>
            <Link
              href="/boutique"
              className="w-full text-center bg-amber-600 text-white font-semibold py-3.5 px-6 rounded-xl hover:bg-amber-700 transition"
            >
              Accéder à la Boutique
            </Link>
          </div>

          {/* Carte 2 : Espace Vendeur */}
          <div className="bg-white p-8 rounded-2xl border border-stone-200 shadow-sm flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 bg-stone-100 text-stone-800 rounded-xl flex items-center justify-center text-2xl mb-6">
                🏪
              </div>
              <h2 className="text-2xl font-bold mb-3">Espace Vendeur</h2>
              <p className="text-stone-600 mb-6">
                Publiez vos créations avec photos et tarifs, gérez votre stock et supprimez vos articles à tout moment.
              </p>
            </div>
            <Link
              href="/vendeur"
              className="w-full text-center bg-stone-800 text-white font-semibold py-3.5 px-6 rounded-xl hover:bg-stone-900 transition"
            >
              Gérer ma Boutique
            </Link>
          </div>

          {/* Carte 3 : Live */}
          <div className="bg-stone-900 text-white p-8 rounded-2xl shadow-sm flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 bg-stone-800 text-red-400 rounded-xl flex items-center justify-center text-2xl mb-6">
                🎥
              </div>
              <h2 className="text-2xl font-bold mb-3">Les Ventes en Live</h2>
              <p className="text-stone-300 mb-6">
                Assistez aux présentations en direct des créateurs et réservez les pièces présentées devant la caméra.
              </p>
            </div>
            <Link
              href="/live"
              className="w-full text-center bg-white text-stone-900 font-semibold py-3.5 px-6 rounded-xl hover:bg-stone-100 transition"
            >
              Rejoindre l&apos;Espace Live
            </Link>
          </div>
        </div>
      </main>

      <footer className="border-t border-stone-200 py-6 text-center text-sm text-stone-500">
        © {new Date().getFullYear()} CRÉA-LIVE MARKET — Tous droits réservés
      </footer>
    </div>
  );
}
