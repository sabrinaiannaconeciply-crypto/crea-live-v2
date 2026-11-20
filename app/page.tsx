"use client";

import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase"; // Vérifiez que le chemin est correct

export default function LivePage() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("1");

  // Charger les articles du live au démarrage
  const fetchLiveProducts = async () => {
    const { data, error } = await supabase
      .from("live_stock")
      .select("*")
      .eq("status", "actif")
      .order("created_at", { ascending: false });
    
    if (data) setProducts(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchLiveProducts();
  }, []);

  // Ajouter un article UNIQUEMENT au Live
  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !price) return alert("Veuillez remplir le nom et le prix.");

    let imageUrl = "";

    // 1. Upload de l'image
    if (file) {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from('produits')
        .upload(fileName, file);

      if (!uploadError) {
        const { data } = supabase.storage.from('produits').getPublicUrl(fileName);
        imageUrl = data.publicUrl;
      }
    }

    // 2. Insertion dans la table live_stock
    const { error } = await supabase.from("live_stock").insert([
      {
        title: title,
        price_cents: Math.round(parseFloat(price) * 100),
        image_url: imageUrl,
        stock: parseInt(stock),
        seller_id: "vendeur-test",
      },
    ]);

    if (!error) {
      alert("Article ajouté au Live !");
      setTitle(""); setPrice(""); setFile(null); setStock("1");
      fetchLiveProducts();
    } else {
      alert("Erreur : " + error.message);
    }
  };

  return (
    <div className="p-8 bg-black min-h-screen text-white">
      <h1 className="text-2xl font-bold mb-4">CRÉA-LIVE MARKET - Espace Live</h1>
      
      <div className="flex gap-8">
        <div className="w-1/3 bg-gray-800 p-4 rounded">
          <h2 className="text-xl mb-4">Ajouter au Live</h2>
          <form onSubmit={handleAddProduct} className="flex flex-col gap-2">
            <input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} className="text-white" />
            <input type="text" placeholder="Nom du produit" value={title} onChange={(e) => setTitle(e.target.value)} required className="p-2 rounded text-black" />
            <input type="number" placeholder="Prix (€)" value={price} onChange={(e) => setPrice(e.target.value)} required className="p-2 rounded text-black" />
            <input type="number" placeholder="Stock" value={stock} onChange={(e) => setStock(e.target.value)} required className="p-2 rounded text-black" />
            <button type="submit" className="bg-green-600 text-white p-2 rounded mt-2">Ajouter au Live</button>
          </form>
        </div>

        <div className="w-2/3">
          <h2 className="text-xl mb-4">Articles en direct</h2>
          {loading ? <p>Chargement...</p> : (
            <div className="grid grid-cols-2 gap-4">
              {products.map((p) => (
                <div key={p.id} className="bg-white text-black p-4 rounded shadow">
                  {p.image_url && <img src={p.image_url} alt={p.title} className="w-full h-40 object-cover rounded mb-2" />}
                  <h3 className="font-bold">{p.title}</h3>
                  <p className="text-green-600 font-bold">{(p.price_cents / 100).toFixed(2)} €</p>
                  <p>Stock : {p.stock}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
