"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from "../../lib/supabase"; // On garde l'import original

export default function LivePage() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("1");
  const [videoUrl, setVideoUrl] = useState("");
  const [currentVideo, setCurrentVideo] = useState("");

  const fetchLiveProducts = async () => {
    const { data, error } = await supabase
      .from("live_stock")
      .select("*")
      .eq("status", "actif")
      .order("created_at", { ascending: false });

    if (!error && data) setProducts(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchLiveProducts();
  }, []);

  const getEmbedUrl = (url: string) => {
    if (!url) return "";
    let videoId = "";
    if (url.includes("youtu.be/")) videoId = url.split("youtu.be/")[1].split("?")[0];
    else if (url.includes("youtube.com/watch")) videoId = new URL(url).searchParams.get("v") || "";
    return videoId ? `https://www.youtube.com/embed/${videoId}` : url;
  };

  const handleAddLiveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    const numericPrice = parseFloat(price);

    if (!title || isNaN(numericPrice) || numericPrice <= 0) {
      alert("Veuillez entrer un nom et un prix valide supérieur à 0 €.");
      return;
    }

    let imageUrl = "";

    if (file) {
      const fileExt = file.name.split(".").pop();
      const fileName = `live-${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from("products")
        .upload(fileName, file);

      if (!uploadError) {
        const { data } = supabase.storage.from("products").getPublicUrl(fileName);
        imageUrl = data.publicUrl;
      }
    }

    const { error } = await supabase.from("live_stock").insert([
      {
        title,
        price_cents: Math.round(numericPrice * 100),
        image_url: imageUrl,
        stock: Math.max(1, parseInt(stock) || 1),
        video_url: videoUrl,
        seller_id: "vendeur-live",
        status: "actif",
      },
    ]);

    if (!error) {
      alert("Article ajouté au Live !");
      setTitle(""); setPrice(""); setFile(null); setStock("1"); setVideoUrl("");
      fetchLiveProducts();
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
              <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
              Espace Live
            </Link>
          </nav>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-10">
        <div className="mb-8 flex items-center gap-3">
          <span className="bg-red-600 text-white text-xs font-bold px-3 py-1 rounded-full uppercase">En direct</span>
          <h1 className="text-3xl font-extrabold">Espace Ventes en Live</h1>
        </div>

        <div className="grid lg:grid-cols-3 gap-8 items-start">
          <div className="flex flex-col gap-6">
            <div className="bg-black rounded-2xl overflow-hidden aspect-video flex items-center justify-center border border-stone-800">
              {currentVideo ? (
                <iframe src={getEmbedUrl(currentVideo)} className="w-full h-full" allowFullScreen />
              ) : (
                <p className="text-stone-500 text-sm">Sélectionnez une vidéo dans les produits</p>
              )}
            </div>

            <div className="bg-stone-900 p-6 rounded-2xl border border-stone-800">
              <h2 className="text-lg font-bold mb-4">Présenter un article au Live</h2>
              <form onSubmit={handleAddLiveProduct} className="flex flex-col gap-3">
                <div>
                  <label className="block text-xs text-stone-400 mb-1">Photo</label>
                  <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] || null)} className="text-sm text-stone-300" />
                </div>
                <input type="text" placeholder="Nom du produit en direct" value={title} onChange={(e) => setTitle(e.target.value)} required className="p-2.5 bg-stone-800 border border-stone-700 rounded-lg text-sm text-white" />
                <input type="number" step="0.01" min="0.50" placeholder="Prix Live (€)" value={price} onChange={(e) => setPrice(e.target.value)} required className="p-2.5 bg-stone-800 border border-stone-700 rounded-lg text-sm text-white" />
                <input type="number" min="1" placeholder="Quantité disponible" value={stock} onChange={(e) => setStock(e.target.value)} className="p-2.5 bg-stone-800 border border-stone-700 rounded-lg text-sm text-white" />
                <input type="text" placeholder="Lien de la vidéo (YouTube)" value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} className="p-2.5 bg-stone-800 border border-stone-700 rounded-lg text-sm text-white" />
                <button type="submit" className="mt-2 bg-red-600 text-white font-semibold py-2.5 rounded-lg hover:bg-red-700 transition">+ Mettre en vente dans le Live</button>
              </form>
            </div>
          </div>

          <div className="lg:col-span-2">
            {loading ? (
              <p className="text-stone-400">Chargement du direct...</p>
            ) : products.length === 0 ? (
              <div className="bg-stone-900 p-10 rounded-2xl border border-stone-800 text-center text-stone-400">Aucun article présenté en direct pour le moment.</div>
            ) : (
              <div className="grid sm:grid-cols-2 gap-6">
                {products.map((p) => (
                  <div key={p.id} className={`bg-stone-900 rounded-2xl border-2 overflow-hidden flex flex-col justify-between cursor-pointer ${currentVideo === p.video_url ? 'border-red-500' : 'border-stone-800 hover:border-stone-600'}`} onClick={() => setCurrentVideo(p.video_url)}>
                    <div>
                      {p.image_url ? (
                        <img src={p.image_url} alt={p.title} className="w-full h-48 object-cover" />
                      ) : (
                        <div className="w-full h-48 bg-stone-800 flex items-center justify-center text-stone-500 text-sm">Aperçu en direct</div>
                      )}
                      <div className="p-5">
                        <h3 className="font-bold text-lg text-white">{p.title}</h3>
                        <p className="text-amber-400 font-extrabold text-xl mt-1">{(p.price_cents / 100).toFixed(2)} €</p>
                        <p className="text-xs text-stone-400 mt-1">Pièces restantes en direct : {p.stock}</p>
                        {p.video_url && <p className="text-xs text-blue-400 mt-2">▶ Cliquer pour voir la vidéo</p>}
                      </div>
                    </div>
                    <div className="px-5 pb-5">
                      <button onClick={(e) => { e.stopPropagation(); alert(`Réservation live enregistrée pour "${p.title}" !`); }} className="w-full bg-white text-stone-900 font-bold py-2.5 rounded-xl hover:bg-stone-200 transition text-sm">Réserver en direct</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
