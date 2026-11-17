'use client';
import React, { useState } from 'react';

interface Produit {
  id: number;
  nom: string;
  createur: string;
  prix: number;
  categorie: string;
  image?: string;
}

export default function Home() {
  const [produits, setProduits] = useState<Produit[]>([
    {
      id: 1,
      nom: 'Sac Cabas Lin & Cuir',
      createur: 'Atelier Claire',
      prix: 45,
      categorie: 'Mode',
    },
    {
      id: 2,
      nom: "Bougie Soja Fleur d'Oranger",
      createur: 'Lueur Douce',
      prix: 18,
      categorie: 'Maison',
    },
  ]);
  const [nom, setNom] = useState('');
  const [createur, setCreateur] = useState('');
  const [prix, setPrix] = useState('');
  const [categorie, setCategorie] = useState('Mode');
  const [imagePreview, setImagePreview] = useState('');
  const [enLive, setEnLive] = useState(true);
  const [produitEnDirect, setProduitEnDirect] = useState(1);

  const gererPhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fichier = e.target.files?.[0];
    if (fichier) {
      setImagePreview(URL.createObjectURL(fichier));
    }
  };

  const ajouterProduit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nom || !createur || !prix) return;
    const nouveau: Produit = {
      id: Date.now(),
      nom,
      createur,
      prix: Number(prix),
      categorie,
      image: imagePreview,
    };
    setProduits([nouveau, ...produits]);
    setProduitEnDirect(nouveau.id);
    setEnLive(true);
    setNom('');
    setPrix('');
    setImagePreview('');
  };

  const articleLive =
    produits.find((p) => p.id === produitEnDirect) || produits[0];

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans">
      <header className="bg-black text-white px-6 py-4 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-extrabold">CRÉA-LIVE MARKET</h1>
          <p className="text-xs text-gray-400">
            Vente & Live Shopping des jeunes créateurs
          </p>
        </div>
        <button
          onClick={() => setEnLive(!enLive)}
          className="bg-red-600 text-white text-xs font-bold px-4 py-2 rounded-lg"
        >
          {enLive ? 'Fermer le Live' : 'Lancer le Live'}
        </button>
      </header>

      {enLive && articleLive && (
        <section className="bg-zinc-900 text-white p-6">
          <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-6 items-center">
            <div className="relative bg-zinc-800 rounded-xl overflow-hidden aspect-video flex items-center justify-center">
              {articleLive.image ? (
                <img
                  src={articleLive.image}
                  alt={articleLive.nom}
                  className="w-full h-full object-cover"
                />
              ) : (
                <p className="text-zinc-400 text-sm">
                  Caméra du créateur en direct
                </p>
              )}
              <span className="absolute top-3 left-3 bg-red-600 text-xs font-bold px-2 py-0.5 rounded">
                EN DIRECT
              </span>
            </div>
            <div className="space-y-4">
              <h2 className="text-2xl font-bold">{articleLive.nom}</h2>
              <p className="text-sm text-zinc-400">
                Par {articleLive.createur}
              </p>
              <p className="text-3xl font-extrabold text-emerald-400">
                {articleLive.prix} €
              </p>
              <button
                onClick={() =>
                  alert(
                    `Commande Live : ${articleLive.nom} - ${articleLive.prix}€`
                  )
                }
                className="bg-emerald-500 text-black font-extrabold px-5 py-3 rounded-lg text-sm"
              >
                Bloquer & Payer ({articleLive.prix}€)
              </button>
            </div>
          </div>
        </section>
      )}

      <main className="max-w-5xl mx-auto p-6 grid md:grid-cols-3 gap-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border h-fit">
          <h2 className="text-lg font-bold mb-4">Ajouter une création</h2>
          <form onSubmit={ajouterProduit} className="space-y-3">
            <div>
              <label className="block text-xs font-semibold mb-1">
                Photo du produit
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={gererPhoto}
                className="w-full text-xs border rounded p-1.5"
              />
              {imagePreview && (
                <img
                  src={imagePreview}
                  alt="Aperçu"
                  className="mt-2 h-24 w-full object-cover rounded"
                />
              )}
            </div>
            <input
              type="text"
              placeholder="Votre marque / créateur"
              value={createur}
              onChange={(e) => setCreateur(e.target.value)}
              className="w-full border rounded p-2 text-sm"
              required
            />
            <input
              type="text"
              placeholder="Nom du produit"
              value={nom}
              onChange={(e) => setNom(e.target.value)}
              className="w-full border rounded p-2 text-sm"
              required
            />
            <div className="grid grid-cols-2 gap-2">
              <input
                type="number"
                placeholder="Prix (€)"
                value={prix}
                onChange={(e) => setPrix(e.target.value)}
                className="w-full border rounded p-2 text-sm"
                required
              />
              <select
                value={categorie}
                onChange={(e) => setCategorie(e.target.value)}
                className="w-full border rounded p-2 text-sm"
              >
                <option>Mode</option>
                <option>Maison</option>
                <option>Bijoux</option>
              </select>
            </div>
            <button
              type="submit"
              className="w-full bg-black text-white font-semibold py-2.5 rounded-lg text-sm"
            >
              + Publier avec photo
            </button>
          </form>
        </div>

        <div className="md:col-span-2 grid sm:grid-cols-2 gap-4">
          {produits.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-xl border shadow-sm overflow-hidden flex flex-col justify-between"
            >
              <div>
                {item.image && (
                  <img
                    src={item.image}
                    alt={item.nom}
                    className="w-full h-44 object-cover"
                  />
                )}
                <div className="p-4">
                  <span className="text-xs bg-gray-100 px-2 py-0.5 rounded font-semibold">
                    {item.categorie}
                  </span>
                  <h3 className="font-bold text-lg mt-2">{item.nom}</h3>
                  <p className="text-xs text-gray-500">Par {item.createur}</p>
                </div>
              </div>
              <div className="p-4 border-t flex justify-between items-center">
                <span className="text-lg font-extrabold">{item.prix} €</span>
                <button
                  onClick={() => alert(`Achat : ${item.nom} (${item.prix}€)`)}
                  className="bg-emerald-600 text-white text-xs font-bold px-3 py-2 rounded-lg"
                >
                  Acheter
                </button>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
