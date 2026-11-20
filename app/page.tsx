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
          <nav className="flex items-center gap-4 text-sm font-medium">
            <Link href="/boutique" className="text-stone-700 hover:text-amber-600 transition">
              Boutique
            </Link>
            <Link href="/vendeur" className="text-stone-700 hover:text-amber-600 transition">
              Espace Vendeur
            </Link>
            <Link href="/live" className="text-stone-700 hover:text-amber-600 transition">
              Live
            </Link>
            <Link
              href="/connexion"
              className="bg-amber-600 text-white px-4 py-2 rounded-full font-semibold hover:bg-amber-700 transition"
            >
              Inscription / Connexion
            </Link>
            <Link
              href="/profil"
              className="border border-stone-300 text-stone-800 px-4 py-2 rounded-full font-semibold hover:bg-stone-100 transition"
            >
              Mon Profil
            </Link>
          </nav>
        </div>
      </header>

      {/* Section principale */}
      <main className="flex-1 max-w-6xl mx-auto px-6 py-16 flex flex-col justify-center">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <span className="inline-block bg-amber-100 text-amber-800 text-xs font-semibold px-3 py-1 rounded-full mb-4">
            Artisanat • Création • Vente en direct
          </span>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-stone-900 mb-6">
            La plateforme des créateurs et de leurs clients.
          </h1>
          <p className="text-lg text-stone-600 mb-8">
            Inscrivez-vous en tant que <strong>Vendeur</strong> pour ouvrir votre boutique et lancer vos lives, ou en tant que <strong>Client</strong> pour commander.
          </p>

          {/* Deux gros boutons d'inscription immédiats */}
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/connexion"
              className="bg-stone-900 text-white font-bold py-4 px-8 rounded-2xl hover:bg-stone-800 transition shadow-sm"
            >
              🏪 Ouvrir un compte Vendeur
            </Link>
            <Link
              href="/connexion"
              className="bg-amber-600 text-white font-bold py-4 px-8 rounded-2xl hover:bg-amber-700 transition shadow-sm"
            >
              🛍️ Créer un compte Client
            </Link>
          </div>
        </div>

        {/* Trois espaces bien distincts */}
        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-white p-8 rounded-2xl border border-stone-200 shadow-sm flex flex-col justify-between">
            <div>
              <h2 className="text-xl font-bold mb-2">1. La Boutique</h2>
              <p className="text-stone-600 text-sm mb-6">
                Explorez les créations disponibles et ajoutez-les à votre panier.
              </p>
            </div>
            <Link
              href="/boutique"
              className="w-full text-center bg-stone-100 text-stone-900 font-semibold py-3 rounded-xl hover:bg-stone-200 transition text-sm"
            >
              Voir la Boutique
            </Link>
          </div>

          <div className="bg-white p-8 rounded-2xl border border-stone-200 shadow-sm flex flex-col justify-between">
            <div>
              <h2 className="text-xl font-bold mb-2">2. Espace Vendeur</h2>
              <p className="text-stone-600 text-sm mb-6">
                Réservé aux vendeurs inscrits : gérez vos coordonnées, votre stock et vos ventes.
              </p>
            </div>
            <Link
              href="/vendeur"
              className="w-full text-center bg-stone-100 text-stone-900 font-semibold py-3 rounded-xl hover:bg-stone-200 transition text-sm"
            >
              Accéder à mon Espace Vendeur
            </Link>
          </div>

          <div className="bg-stone-900 text-white p-8 rounded-2xl shadow-sm flex flex-col justify-between">
            <div>
              <h2 className="text-xl font-bold mb-2">3. Les Ventes en Live</h2>
              <p className="text-stone-300 text-sm mb-6">
                Regardez les créateurs en direct et réservez leurs pièces avant épuisement.
              </p>
            </div>
            <Link
              href="/live"
              className="w-full text-center bg-white text-stone-900 font-semibold py-3 rounded-xl hover:bg-stone-100 transition text-sm"
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
