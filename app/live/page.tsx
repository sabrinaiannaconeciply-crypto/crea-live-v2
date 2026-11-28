"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from "../../lib/supabase";

export default function VideoPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [file, setFile] = useState<File | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("1");
  const [categorie, setCategorie] = useState("Vêtement");
  
  // NOUVEAU : Gestion des variantes sous forme de liste
  const [variantes, setVariantes] = useState<string[]>([""]); 
  
  const [isUploading, setIsUploading] = useState(false);

  const fetchProducts = async () => {
    const { data, error } = await supabase
      .from("live_stock")
      .select("*")
      .eq("status", "actif")
      .order("created_at", { ascending: false });

    if (!error && data) setProducts(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // Fonction pour ajouter une case vide
  const ajouterVariante = () => {
    setVariantes([...variantes, ""]);
  };

  // Fonction pour mettre à jour une case spécifique
  const modifierVariante = (index: number, valeur: string) => {
    const nouvellesVariantes = [...variantes];
    nouvellesVariantes[index] = valeur;
    setVariantes(nouvellesVariantes);
  };

  // Fonction pour supprimer une case
  const supprimerVariante = (index: number) => {
    const nouvellesVariantes = variantes.filter((_, i) => i !== index);
    setVariantes(nouvellesVariantes.length > 0 ? nouvellesVariantes : [""]);
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !price) return alert("Veuillez remplir le nom et le prix.");
    
    setIsUploading(true);
    let imageUrl = "";
    let uploadedVideoUrl = "";

    if (file) {
      const fileExt = file.name.split(".").pop();
      const fileName = `img-${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from("products").upload(fileName, file);
      if (!uploadError) {
        const { data } = supabase.storage.from("products").getPublicUrl(fileName);
        imageUrl = data.publicUrl;
      }
    }

    if (videoFile) {
      const fileExt = videoFile.name.split(".").pop();
      const fileName = `video-${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from("products").upload(fileName, videoFile);
      if (!uploadError) {
        const { data } = supabase.storage.from("products").getPublicUrl(fileName);
        uploadedVideoUrl = data.publicUrl;
      }
    }

    // On nettoie les variantes (on enlève les cases vides)
    const variantesPropres = variantes.map(v => v.trim()).filter(v => v !== "");

    const { error } = await supabase.from("live_stock").insert([{
      title: title,
      price_cents: Math.round(parseFloat(price) * 100),
      image_url: imageUrl,
      stock: parseInt(stock),
      video_url: uploadedVideoUrl || null,
      categorie: categorie,
      variantes: variantesPropres.length > 0 ? variantesPropres : null,
      seller_id: "00000000-0000-0000-0000-000000000000",
      status: "actif",
    }]);

    setIsUploading(false);

    if (!error) {
      alert("Produit et vidéo ajoutés !");
      setTitle(""); setPrice(""); setFile(null); setVideoFile(null); setStock("1"); setVariantes([""]);
      fetchProducts();
    } else {
      alert("Erreur : " + error.message);
    }
  };

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
            <Link href="/live" className="bg-red-600 text-white px-4 py-2 rounded-full font-bold flex items-center gap-2">
              Espace Vidéo
            </Link>
          </nav>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold">Créer une vidéo</h1>
          <p className="text-stone-400 text-sm mt-2">Importez votre vidéo et ajoutez les produits associés.</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8 items-start">
          <div className="bg-stone-900 p-6 rounded-2xl border border-stone-800">
            <h2 className="text-lg font-bold mb-4">Ajouter un produit</h2>
            <form onSubmit={handleAddProduct} className="flex flex-col gap-3">
              {/* ... (Photo et Vidéo inchangés) ... */}
              <div>
                <label className="block text-xs text-stone-400 mb-1">Photo (facultatif)</label>
                <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] || null)} className="text-sm text-stone-300" />
              </div>
              <div>
                <label className="block text-xs text-stone-400 mb-1">Vidéo (MP4, MOV)</label>
                <input type="file" accept="video/mp4,video/quicktime" onChange={(e) => setVideoFile(e.target.files?.[0] || null)} className="text-sm text-stone-300" />
              </div>
              <input type="text" placeholder="Nom du produit" value={title} onChange={(e) => setTitle(e.target.value)} required className="p-2.5 bg-stone-800 border border-stone-700 rounded-lg text-sm text-white" />
              <input type="number" step="0.01" min="0.50" placeholder="Prix (€)" value={price} onChange={(e) => setPrice(e.target.value)} required className="p-2.5 bg-stone-800 border border-stone-700 rounded-lg text-sm text-white" />
              <input type="number" min="1" placeholder="Stock" value={stock} onChange={(e) => setStock(e.target.value)} className="p-2.5 bg-stone-800 border border-stone-700 rounded-lg text-sm text-white" />
              
              <select value={categorie} onChange={(e) => setCategorie(e.target.value)} className="p-2.5 bg-stone-800 border border-stone-700 rounded-lg text-sm text-white">
                <option value="Vêtement">Vêtement</option>
                <option value="Bougie">Bougie</option>
                <option value="Parfum">Parfum</option>
                <option value="Décoration">Décoration</option>
                <option value="Autre">Autre</option>
              </select>

              {/* NOUVEAU : Gestion dynamique des variantes */}
              <div className="mt-2">
                <label className="block text-xs text-stone-400 mb-2">Variantes (Tailles, Couleurs, etc.)</label>
                {variantes.map((v, index) => (
                  <div key={index} className="flex gap-2 mb-2">
                    <input 
                      type="text" 
                      placeholder={`Ex: ${index === 0 ? 'S' : index === 1 ? 'M' : 'L'}`} 
                      value={v} 
                      onChange={(e) => modifierVariante(index, e.target.value)} 
                      className="flex-1 p-2 bg-stone-800 border border-stone-700 rounded-lg text-sm text-white" 
                    />
                    <button 
                      type="button" 
                      onClick={() => supprimerVariante(index)}
                      className="px-3 bg-red-900/50 text-red-400 rounded-lg hover:bg-red-900"
                    >
                      X
                    </button>
                  </div>
                ))}
                <button 
                  type="button" 
                  onClick={ajouterVariante}
                  className="text-sm text-amber-500 hover:text-amber-400 font-semibold flex items-center gap-1 mt-1"
                >
                  + Ajouter une option
                </button>
              </div>

              <button type="submit" disabled={isUploading} className="mt-4 bg-red-600 text-white font-semibold py-2.5 rounded-lg hover:bg-red-700 transition disabled:opacity-50">
                {isUploading ? "Upload en cours..." : "+ Publier la vidéo et le produit"}
              </button>
            </form>
          </div>

          {/* ... (Lecteur vidéo inchangé) ... */}
          <div className="lg:col-span-2">
            {products.length > 0 && products[0].video_url ? (
              <div className="bg-black rounded-2xl overflow-hidden aspect-video flex items-center justify-center border border-stone-800">
                <video src={products[0].video_url} controls className="w-full h-full object-contain" />
              </div>
            ) : (
              <div className="bg-stone-900 rounded-2xl border border-stone-800 p-10 text-center text-stone-400">
                La vidéo s&apos;affichera ici une fois publiée.
              </div>
            )}
          </div>
        </div>

        <div className="mt-12">
          <h2 className="text-2xl font-bold mb-6">Produits présentés dans la vidéo</h2>
          {loading ? <p>Chargement...</p> : products.length === 0 ? (
            <div className="bg-stone-900 p-10 rounded-2xl text-center text-stone-400">Aucun produit ajouté pour le moment.</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {products.map((p) => (
                <div key={p.id} className="bg-stone-900 rounded-xl border border-stone-800 p-4 flex flex-col justify-between">
                  <div>
                    {p.image_url ? (
                      <img src={p.image_url} alt={p.title} className="w-full h-40 object-cover rounded-lg mb-3" />
                    ) : (
                      <div className="w-full h-40 bg-stone-800 rounded-lg mb-3 flex items-center justify-center text-xs text-stone-500">Sans photo</div>
                    )}
                    <h3 className="font-bold text-lg">{p.title}</h3>
                    <p className="text-amber-400 font-bold text-xl mt-1">{(p.price_cents / 100).toFixed(2)} €</p>
                    
                    {p.categorie && <p className="text-xs text-stone-400 mt-1">Catégorie : {p.categorie}</p>}
                    <p className="text-xs text-stone-500 mb-3">Stock: {p.stock}</p>
                  </div>

                  {/* Affichage des variantes pour l'acheteur */}
                  {p.variantes && p.variantes.length > 0 && (
                    <div className="mb-3">
                      <p className="text-xs text-stone-400 mb-2">Choisir une option :</p>
                      <div className="flex flex-wrap gap-2">
                        {p.variantes.map((v: string) => (
                          <button
                            key={v}
                            onClick={() => alert(`Ajouté au panier : ${p.title} - ${v}`)}
                            className="px-3 py-1 bg-stone-800 text-stone-200 text-sm rounded-full hover:bg-amber-600 hover:text-white transition"
                          >
                            {v}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Si pas de variante, bouton simple */}
                  {(!p.variantes || p.variantes.length === 0) && (
                    <button
                      onClick={() => alert(`Ajouté au panier : ${p.title}`)}
                      className="w-full bg-white text-stone-900 font-bold py-2 rounded-lg hover:bg-stone-200 transition text-sm"
                    >
                      Ajouter au panier
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
