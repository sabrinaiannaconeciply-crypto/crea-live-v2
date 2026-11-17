"use client";
import React, { useState, useEffect } from "react";

interface Produit {
  id: number;
  nom: string;
  createur: string;
  prix: number;
  stock: number;
  categorie: string;
  image?: string;
}

interface ArticlePanier {
  idReservation: number;
  produitId: number;
  nom: string;
  createur: string;
  prix: number;
  taille: string;
}

export default function Home() {
  const [produits, setProduits] = useState<Produit[]>([]);
  const [panierFerme, setPanierFerme] = useState<ArticlePanier[]>([]);
  const [nom, setNom] = useState("");
  const [createur, setCreateur] = useState("");
  const [prix, setPrix] = useState("");
  const [stock, setStock] = useState("3");
  const [categorie, setCategorie] = useState("Mode");
  const [imagePreview, setImagePreview] = useState("");
  const [enLive, setEnLive] = useState(true);
  const [modeVendeuse, setModeVendeuse] = useState(true);
  const [produitEnDirect, setProduitEnDirect] = useState<number | null>(null);
  const [tailleChoisie, setTailleChoisie] = useState("M");

  useEffect(() => {
    const prodSauves = localStorage.getItem("crea_live_produits_v2");
    const panierSauve = localStorage.getItem("crea_live_panier_v2");
    if (prodSauves) {
      const liste: Produit[] = JSON.parse(prodSauves);
      setProduits(liste);
      const premier = liste.at(0);
      if (premier) setProduitEnDirect(premier.id);
    } else {
      const demo: Produit[] = [
        { id: 1, nom: "Sac Cabas Lin & Cuir", createur: "Atelier Claire", prix: 45, stock: 2, categorie: "Mode" },
        { id: 2, nom: "Bougie Soja Fleur d'Oranger", createur: "Lueur Douce", prix: 18, stock: 5, categorie: "Maison" },
      ];
      setProduits(demo);
      setProduitEnDirect(1);
    }
    if (panierSauve) {
      setPanierFerme(JSON.parse(panierSauve));
    }
  }, []);

  const sauvegarderProduits = (liste: Produit[]) => {
    setProduits(liste);
    localStorage.setItem("crea_live_produits_v2", JSON.stringify(liste));
  };

  const gererPhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fichier = e.target.files?.item(0);
    if (fichier) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setImagePreview(String(ev.target?.result || ""));
      };
      reader.readAsDataURL(fichier);
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
      stock: Math.max(1, Number(stock) || 1),
      categorie,
      image: imagePreview,
    };
    const nouvelleListe = [nouveau, ...produits];
    sauvegarderProduits(nouvelleListe);
    setProduitEnDirect(nouveau.id);
    setEnLive(true);
    setNom("");
    setPrix("");
    setStock("3");
    setImagePreview("");
  };

  const reserverEnDirect = (article: Produit) => {
    if (article.stock === 0) return;

    const listeMaj = produits.map((p) =>
      p.id === article.id ? { ...p, stock: p.stock - 1 } : p
    );
    sauvegarderProduits(listeMaj);

    const reservation: ArticlePanier = {
      idReservation: Date.now(),
      produitId: article.id,
      nom: article.nom,
      createur: article.createur,
      prix: article.prix,
      taille: tailleChoisie,
    };
    const nouveauPanier = [reservation, ...panierFerme];
    setPanierFerme(nouveauPanier);
    localStorage.setItem("crea_live_panier_v2", JSON.stringify(nouveauPanier));
  };

  const supprimerProduit = (id: number) => {
    const nouvelleListe = produits.filter((p) => p.id !== id);
    sauvegarderProduits(nouvelleListe);
  };

  const reglerPanierFerme = () => {
    const total = panierFerme.reduce((acc, item) => acc + item.prix, 0);
    const commission = (total * 0.05).toFixed(2);
    alert(
      `Paiement obligatoire validé !\n\nNombre d'articles réservés : ${panierFerme.length}\nTotal encaissé : ${total} €\nVotre commission plateforme (5%) : ${commission} €`
    );
    setPanierFerme([]);
    localStorage.removeItem("crea_live_panier_v2");
  };

  const articleLive = produits.find((p) => p.id === produitEnDirect) || produits.at(0);
  const totalPanier = panierFerme.reduce((acc, item) => acc + item.prix, 0);

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans">
      <header className="bg-black text-white px-6 py-4 flex flex-wrap justify-between items-center gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">CRÉA-LIVE MARKET</h1>
          <p className="text-xs text-gray-400">Live Shopping &amp; Réservation Ferme</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setModeVendeuse(!modeVendeuse)}
            className={`text-xs font-bold px-3 py-2 rounded-lg border ${
              modeVendeuse ? "bg-amber-400 text-black border-amber-400" : "border-zinc-700 text-zinc-300"
            }`}
          >
            {modeVendeuse ? "🎬 Régie Vendeuse : ON" : "👁 Vue Acheteur"}
          </button>
          <button
            onClick={() => setEnLive(!enLive)}
            className="bg-red-600 text-white text-xs font-bold px-4 py-2 rounded-lg"
          >
            {enLive ? "Fermer le Live" : "Lancer le Live"}
          </button>
        </div>
      </header>

      {enLive && articleLive && (
        <section className="bg-zinc-900 text-white p-6 border-b border-zinc-800">
          <div className="max-w-6xl mx-auto space-y-6">
            <div className="grid md:grid-cols-2 gap-6 items-center">
              <div className="relative bg-zinc-800 rounded-xl overflow-hidden aspect-video flex items-center justify-center border border-zinc-700">
                {articleLive.image ? (
                  <img src={articleLive.image} alt={articleLive.nom} className="w-full h-full object-cover" />
                ) : (
                  <p className="text-zinc-400 text-sm">Caméra du créateur en direct</p>
                )}
                <span className="absolute top-3 left-3 bg-red-600 text-xs font-bold px-2.5 py-0.5 rounded">
                  ● EN DIRECT
                </span>
                <span className="absolute bottom-3 left-3 bg-black/75 text-xs px-2.5 py-1 rounded">
                  Stock restant : <strong>{articleLive.stock}</strong> pièce(s)
                </span>
              </div>

              <div className="space-y-4">
                <span className="text-xs text-amber-400 font-bold uppercase tracking-wider">
                  Modèle présenté en direct
                </span>
                <h2 className="text-2xl font-bold">{articleLive.nom}</h2>
                <p className="text-sm text-zinc-400">
                  Création par <strong className="text-white">{articleLive.createur}</strong>
                </p>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-zinc-400">Taille :</span>
                  {["XS", "S", "M", "L", "Unique"].map((t) => (
                    <button
                      key={t}
                      onClick={() => setTailleChoisie(t)}
                      className={`px-2.5 py-1 text-xs rounded border ${
                        tailleChoisie === t ? "bg-white text-black font-bold" : "border-zinc-700 text-zinc-300"
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>

                <div className="pt-3 flex flex-wrap justify-between items-center gap-4 border-t border-zinc-800">
                  <div>
                    <p className="text-xs text-zinc-400">Prix Direct Live</p>
                    <p className="text-3xl font-extrabold text-emerald-400">{articleLive.prix} €</p>
                  </div>

                  {articleLive.stock === 0 ? (
                    <span className="bg-zinc-700 text-zinc-300 font-bold px-5 py-3 rounded-lg text-sm">
                      ÉPUISÉ EN DIRECT
                    </span>
                  ) : (
                    <button
                      onClick={() => reserverEnDirect(articleLive)}
                      className="bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold px-5 py-3 rounded-lg text-sm transition"
                    >
                      ⚡ Réserver maintenant ({articleLive.prix}€)
                    </button>
                  )}
                </div>
                <p className="text-[11px] text-amber-300/90">
                  ⚠️ Engagement ferme : tout article réservé en direct est bloqué pour vous et devra être réglé en fin de live.
                </p>
              </div>
            </div>

            {modeVendeuse && (
              <div className="bg-zinc-800/90 border border-amber-400/40 rounded-xl p-4">
                <div className="flex justify-between items-center mb-3">
                  <p className="text-xs font-bold uppercase tracking-wider text-amber-400">
                    🎬 Régie Vendeuse : cliquez sur le modèle que vous montrez à la caméra
                  </p>
                  <span className="text-[11px] text-zinc-400">Changement instantané pour tous les acheteurs</span>
                </div>
                <div className="flex gap-3 overflow-x-auto pb-1">
                  {produits.map((p) => {
                    const estActif = articleLive.id === p.id;
                    return (
                      <button
                        key={p.id}
                        onClick={() => setProduitEnDirect(p.id)}
                        className={`shrink-0 text-left px-3 py-2 rounded-lg border text-xs transition ${
                          estActif
                            ? "bg-amber-400 text-black border-amber-400 font-bold"
                            : "bg-zinc-900 text-white border-zinc-700 hover:border-zinc-500"
                          }`}
                        >
                          <div className="font-bold">{estActif ? "▶ EN DIRECT : " : ""}{p.nom}</div>
                          <div className={estActif ? "text-black/80" : "text-zinc-400"}>
                            {p.prix}€ • Stock : {p.stock}
                          </div>
                        </button>
    
    );
  })}
</div>
</div>
)}
</div>
</section>
)}

{panierFerme.length > 0 && (
<section className="bg-amber-50 border-b border-amber-200 px-6 py-4">
<div className="max-w-6xl mx-auto flex flex-wrap justify-between items-center gap-4">
<div>
<span className="text-xs font-extrabold uppercase tracking-wider text-amber-800">
🔒 Votre Panier Ferme ({panierFerme.length} article(s) réservé(s) — annulation impossible)
</span>
<div className="flex flex-wrap gap-2 mt-1.5">
{panierFerme.map((item) => (
  <span
    key={item.idReservation}
    className="text-xs bg-white border border-amber-300 px-2.5 py-1 rounded-full font-medium"
  >
    {item.nom} ({item.taille}) — <strong>{item.prix}€</strong>
  </span>
))}
</div>
</div>
<button
onClick={reglerPanierFerme}
className="bg-black hover:bg-zinc-800 text-white font-extrabold px-5 py-3 rounded-lg text-sm"
>
💳 Régler ma commande obligatoire ({totalPanier} €)
</button>
</div>
</section>
)}

<main className="max-w-6xl mx-auto p-6 grid md:grid-cols-3 gap-8">
<div className="bg-white p-6 rounded-xl shadow-sm border h-fit">
<h2 className="text-lg font-bold mb-4">Ajouter un modèle au stock</h2>
<form onSubmit={ajouterProduit} className="space-y-3">
<div>
<label className="block text-xs font-semibold mb-1">Photo du produit</label>
<input type="file" accept="image/*" onChange={gererPhoto} className="w-full text-xs border rounded p-1.5" />
{imagePreview && <img src={imagePreview} alt="Aperçu" className="mt-2 h-24 w-full object-cover rounded" />}
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
<div className="grid grid-cols-3 gap-2">
<input
type="number"
placeholder="Prix (€)"
value={prix}
onChange={(e) => setPrix(e.target.value)}
className="w-full border rounded p-2 text-sm"
required
/>
<input
type="number"
min="1"
placeholder="Stock"
value={stock}
onChange={(e) => setStock(e.target.value)}
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
<button type="submit" className="w-full bg-black text-white font-semibold py-2.5 rounded-lg text-sm">
+ Ajouter au catalogue &amp; au Live
</button>
</form>
</div>

<div className="md:col-span-2 grid sm:grid-cols-2 gap-4">
{produits.map((item) => (
<div key={item.id} className="bg-white rounded-xl border shadow-sm overflow-hidden flex flex-col justify-between">
<div>
{item.image && <img src={item.image} alt={item.nom} className="w-full h-44 object-cover" />}
<div className="p-4">
  <div className="flex justify-between items-center">
    <span className="text-xs bg-gray-100 px-2 py-0.5 rounded font-semibold">{item.categorie}</span>
    <div className="flex items-center gap-2">
      <span className="text-xs font-bold text-zinc-600">Stock : {item.stock}</span>
      <button
        onClick={() => supprimerProduit(item.id)}
        className="text-xs text-gray-400 hover:text-red-600"
      >
        ✕
      </button>
    </div>
  </div>
  <h3 className="font-bold text-lg mt-2">{item.nom}</h3>
  <p className="text-xs text-gray-500">Par {item.createur}</p>
</div>
</div>
<div className="p-4 border-t flex justify-between items-center">
<span className="text-lg font-extrabold">{item.prix} €</span>
<div className="flex gap-2">
  <button
    onClick={() => {
      setProduitEnDirect(item.id);
      setEnLive(true);
    }}
    className="bg-amber-400 text-black text-xs font-bold px-3 py-2 rounded-lg"
  >
    ▶ Présenter
  </button>
  <button
    disabled={item.stock === 0}
    onClick={() => reserverEnDirect(item)}
    className="bg-emerald-600 disabled:bg-gray-300 text-white text-xs font-bold px-3 py-2 rounded-lg"
  >
    {item.stock === 0 ? "Épuisé" : "Réserver"}
  </button>
</div>
</div>
</div>
))}
</div>
</main>
</div>
);
}
