"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from "../../lib/supabase";

export default function BoutiquePage() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("1");
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const showNotice = (text: string, type: "success" | "error" = "success") => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 3500);
  };

  const fetchBoutiqueProducts = async () => {
    const { data, error } = await supabase
      .from("boutique_products")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data) setProducts(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchBoutiqueProducts();
  }, []);

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    const numericPrice = parseFloat(price);

    if (!title || isNaN(numericPrice) || numericPrice <= 0) {
      showNotice("Veuillez entrer un nom valide et un prix supérieur à 0 €.", "error");
      return;
    }

    let imageUrl = "";

    if (file) {
      const fileExt = file.name.split(".").pop();
      const fileName = `boutique-${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from("products")
        .upload(fileName, file);

      if (!uploadError) {
        const { data } = supabase.storage
          .from("products")
          .getPublicUrl(fileName);
        imageUrl = data.publicUrl;
      } else {
        showNotice("Photo non envoyée : " + uploadError.message, "error");
      }
    }

    const { error } = await supabase.from("boutique_products").insert([
      {
        title,
        price_cents: Math.round(numericPrice * 100),
        image_url: imageUrl,
        stock: Math.max(1, parseInt(stock) || 1),
      },
    ]);

    if (!error) {
      showNotice("Article ajouté à la boutique !");
      setTitle("");
      setPrice("");
      setFile(null);
      setStock("1");
      fetchBoutiqueProducts();
    } else {
      showNotice("Erreur : " + error.message, "error");
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("boutique_products").delete().eq("id", id);
    if (!error) {
      showNotice("Article supprimé.");
      fetchBoutiqueProducts();
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900">
      <header className="bg-white border-b border-stone-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="text-xl font-extrabold tracking-tight text-stone-900">
            CRÉA-LIVE <span className="text-amber-600">MARKET</span>
          </Link>
          <nav className="flex items-center gap-6 text-sm font-medium">
            <Link href="/" className="text-stone-600 hover:text-stone-900">
              Accueil
            </Link>
            <Link href="/boutique" className="text-amber-600 font-bold">
              La Boutique
            </Link>
            <Link
              href="/live"
              className="bg-stone-900 text-white px-4 py-2 rounded-full hover:bg-stone-800 transition"
            >
              Espace Live
            </Link>
          </nav>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-stone-900">La Boutique</h1>
          <p className="text-stone-600 mt-1">
            Catalogue permanent des créateurs — Disponible à l&apos;achat hors direct.
          </p>
        </div>

        {message && (
          <div
            className={`mb-6 p-4 rounded-xl text-sm font-medium ${
              message.type === "success"
                ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                : "bg-red-50 text-red-800 border border-red-200"
            }`}
          >
            {message.text}
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-8 items-start">
          <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm">
            <h2 className="text-lg font-bold mb-4">Ajouter un article en boutique</h2>
            <form onSubmit={handleAddProduct} className="flex flex-col gap-3">
              <div>
                <label className="block text-xs font-medium text-stone-600 mb-1">Photo</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setFile(e.target.files ? e.target.files.item(0) : null)}
                  className="text-sm text-stone-600"
                />
              </div>
              <input
                type="text"
                placeholder="Nom de la création"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="p-2.5 border border-stone-300 rounded-lg text-sm"
              />
              <input
                type="number"
                step="0.01"
                min="0.50"
                placeholder="Prix (€)"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                required
                className="p-2.5 border border-stone-300 rounded-lg text-sm"
              />
              <input
                type="number"
                min="1"
                placeholder="Quantité en stock"
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                className="p-2.5 border border-stone-300 rounded-lg text-sm"
              />
              <button
                type="submit"
                className="mt-2 bg-amber-600 text-white font-semibold py-2.5 rounded-lg hover:bg-amber-700 transition"
              >
                + Ajouter à la boutique
              </button>
            </form>
          </div>

          <div className="lg:col-span-2">
            {loading ? (
              <p className="text-stone-500">Chargement du catalogue...</p>
            ) : products.length === 0 ? (
              <div className="bg-white p-10 rounded-2xl border border-stone-200 text-center text-stone-500">
                Aucun article en boutique pour le moment. Ajoutez votre première création à gauche !
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 gap-6">
                {products.map((p) => (
                  <div
                    key={p.id}
                    className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-sm flex flex-col justify-between"
                  >
                    <div>
                      {p.image_url ? (
                        <img
                          src={p.image_url}
                          alt={p.title}
                          className="w-full h-48 object-cover"
                        />
                      ) : (
                        <div className="w-full h-48 bg-stone-100 flex items-center justify-center text-stone-400 text-sm">
                          Pas de photo
                        </div>
                      )}
                      <div className="p-5">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-bold text-lg text-stone-900">{p.title}</h3>
                          <button
                            onClick={() => handleDelete(p.id)}
                            className="text-xs text-stone-400 hover:text-red-600"
                            title="Supprimer cet article"
                          >
                            Supprimer
                          </button>
                        </div>
                        <p className="text-amber-600 font-extrabold text-xl mt-1">
                          {(p.price_cents / 100).toFixed(2)} €
                        </p>
                        <p className="text-xs text-stone-500 mt-1">
                          Stock disponible : {p.stock}
                        </p>
                      </div>
                    </div>
                    <div className="px-5 pb-5">
                      <button
                        onClick={() => showNotice(`"${p.title}" ajouté au panier !`)}
                        className="w-full bg-stone-900 text-white font-medium py-2.5 rounded-xl hover:bg-stone-800 transition text-sm"
                      >
                        Commander cet article
                      </button>
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
