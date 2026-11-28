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
  const [categorie, setCategorie] = useState("");
  const [options, setOptions] = useState("");
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

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !price) return alert("Veuillez remplir le nom et le prix.");
    
    setIsUploading(true);
    let imageUrl = "";
    let uploadedVideoUrl = "";

    // 1. Upload de la photo
    if (file) {
      const fileExt = file.name.split(".").pop();
      const fileName = `img-${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from("products").upload(fileName, file);
      if (!uploadError) {
        const { data } = supabase.storage.from("products").getPublicUrl(fileName);
        imageUrl = data.publicUrl;
      }
    }

    // 2. Upload de la vidéo
    if (videoFile) {
      const fileExt = videoFile.name.split(".").pop();
      const fileName = `video-${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from("products").upload(fileName, videoFile);
      if (!uploadError) {
        const { data } = supabase.storage.from("products").getPublicUrl(fileName);
        uploadedVideoUrl = data.publicUrl;
      }
    }

    // 3. Insertion
    const { error } = await supabase.from("live_stock").insert([{
      title: title,
      price_cents: Math.round(parseFloat(price) * 100),
      image_url: imageUrl,
      stock: parseInt(stock),
      video_url: uploadedVideoUrl || null,
      categorie: categorie,
      options: options,
      seller_id: "vendeur-video",
      status: "actif",
    }]);

    setIsUploading(false);

    if (!error) {
      alert("Produit et vidéo ajoutés !");
      setTitle(""); setPrice(""); setFile(null); setVideoFile(null); setStock("1"); setCategorie(""); setOptions("");
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
            CRÉA-LIVE <span className="text-amber-500">MARKET</span>
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
              
              {/* Champs pour les catégories et options */}
              <input type="text" placeholder="Catégorie (ex: Vêtement, Bougie, Parfum)" value={categorie} onChange={(e) => setCategorie(e.target.value)} className="p-2.5 bg-stone-800 border border-stone-700 rounded-lg text-sm text-white" />
              <input type="text" placeholder="Options (ex: S, M, L ou 50ml, 100ml)" value={options} onChange={(e) => setOptions(e.target.value)} className="p-2.5 bg-stone-800 border border-stone-700 rounded-lg text-sm text-white" />

              <button type="submit" disabled={isUploading} className="mt-2 bg-red-600 text-white font-semibold py-2.5 rounded-lg hover:bg-red-700 transition disabled:opacity-50">
                {isUploading ? "Upload en cours..." : "+ Publier la vidéo et le produit"}
              </button>
            </form>
          </div>

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
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {products.map((p) => (
                <div key={p.id} className="bg-stone-900 rounded-xl border border-stone-800 p-3 flex flex-col justify-between">
                  {p.image_url ? (
                    <img src={p.image_url} alt={p.title} className="w-full h-32 object-cover rounded-lg mb-2" />
                  ) : (
                    <div className="w-full h-32 bg-stone-800 rounded-lg mb-2 flex items-center justify-center text-xs text-stone-500">Sans photo</div>
                  )}
                  <h3 className="font-bold text-sm truncate">{p.title}</h3>
                  <p className="text-amber-400 font-bold">{(p.price_cents / 100).toFixed(2)} €</p>
                  
                  {/* Affichage de la catégorie et des options */}
                  {p.categorie && <p className="text-xs text-stone-400">Catégorie : {p.categorie}</p>}
                  {p.options && <p className="text-xs text-stone-400">Options : {p.options}</p>}
                  
                  <p className="text-xs text-stone-500 mb-2">Stock: {p.stock}</p>
                  <button 
                    onClick={() => alert(`Ajouté au panier : ${p.title}`)}
                    className="w-full bg-white text-stone-900 text-xs font-bold py-1.5 rounded hover:bg-stone-200"
                  >
                    Ajouter au panier
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
