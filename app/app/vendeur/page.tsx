"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "../../lib/supabase";

type Product = {
  id: string;
  title: string;
  price_cents: number;
  image_url: string;
  stock: number;
};

export default function VendeurPage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [shopName, setShopName] = useState<string>("");
  const [profileIncomplete, setProfileIncomplete] = useState(false);

  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("1");
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const showNotice = (text: string, type: "success" | "error" = "success") => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 3500);
  };

  useEffect(() => {
    const checkVendeurAccess = async () => {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push("/connexion");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (!profile || profile.role !== "vendeur") {
        router.push("/connexion");
        return;
      }

      setUserId(user.id);
      setShopName(profile.shop_name || "Ma Boutique");

      if (!profile.phone || !profile.birth_date || !profile.address || !profile.postal_code || !profile.city) {
        setProfileIncomplete(true);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("boutique_products")
        .select("*")
        .eq("seller_id", user.id)
        .order("created_at", { ascending: false });

      if (!error && data) setProducts(data);
      setLoading(false);
    };

    checkVendeurAccess();
  }, [router]);

  const refreshStock = async (uid: string) => {
    const { data, error } = await supabase
      .from("boutique_products")
      .select("*")
      .eq("seller_id", uid)
      .order("created_at", { ascending: false });

    if (!error && data) setProducts(data);
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;
    const numericPrice = parseFloat(price);

    if (!title || isNaN(numericPrice) || numericPrice <= 0) {
      showNotice("Veuillez entrer un nom valide et un prix supérieur à 0 €.", "error");
      return;
    }

    let imageUrl = "";

    if (file) {
      const fileExt = file.name.split(".").pop();
      const fileName = `boutique-${userId}-${Date.now()}.${fileExt}`;
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
        seller_id: userId,
        shop_name: shopName,
      },
    ]);

    if (!error) {
      showNotice("Article publié dans votre boutique !");
      setTitle("");
      setPrice("");
      setFile(null);
      setStock("1");
      refreshStock(userId);
    } else {
      showNotice("Erreur : " + error.message, "error");
    }
  };

  const handleDelete = async (id: string) => {
    if (!userId) return;
    const { error } = await supabase
      .from("boutique_products")
      .delete()
      .eq("id", id)
      .eq("seller_id", userId);

    if (!error) {
      showNotice("Article retiré de votre stock.");
      refreshStock(userId);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center text-stone-500">
        Vérification de votre accès vendeur...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900">
      <header className="bg-white border-b border-stone-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="text-xl font-extrabold tracking-tight text-stone-900">
            CRÉA-LIVE <span className="text-amber-600">MARKET</span>
          </Link>
          <nav className="flex items-center gap-5 text-sm font-medium">
            <Link href="/" className="text-stone-600 hover:text-stone-900">
              Accueil
            </Link>
            <Link href="/boutique" className="text-stone-600 hover:text-stone-900">
              Boutique
            </Link>
            <Link href="/profil" className="text-stone-600 hover:text-stone-900">
              Mon Profil
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
          <span className="inline-block bg-amber-100 text-amber-800 text-xs font-bold px-3 py-1 rounded-full mb-2">
            Boutique : {shopName}
          </span>
          <h1 className="text-3xl font-extrabold text-stone-900">Espace Vendeur</h1>
          <p className="text-stone-600 mt-1">
            Gérez uniquement votre stock personnel et vos publications.
          </p>
        </div>

        {profileIncomplete ? (
          <div className="bg-amber-50 border-2 border-amber-400 p-8 rounded-2xl max-w-xl">
            <h2 className="text-xl font-bold text-amber-950 mb-2">
              Fiche légale et coordonnées incomplètes
            </h2>
            <p className="text-sm text-amber-900 mb-6">
              Avant de pouvoir mettre des articles en vente sur CRÉA-LIVE MARKET, vous devez obligatoirement renseigner votre téléphone, votre date de naissance et votre adresse postale complète dans votre fiche profil.
            </p>
            <Link
              href="/profil"
              className="inline-block bg-amber-600 text-white font-semibold px-6 py-3 rounded-xl hover:bg-amber-700 transition text-sm"
            >
              Compléter ma fiche profil maintenant →
            </Link>
          </div>
        ) : (
          <>
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
                <h2 className="text-lg font-bold mb-4">Ajouter un article à mon stock</h2>
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
                    + Publier dans ma boutique
                  </button>
                </form>
              </div>

              <div className="lg:col-span-2">
                <h2 className="text-lg font-bold mb-4">Mon stock personnel ({products.length})</h2>
                {products.length === 0 ? (
                  <div className="bg-white p-10 rounded-2xl border border-stone-200 text-center text-stone-500">
                    Vous n&apos;avez pas encore publié d&apos;article. Utilisez le formulaire à gauche pour ajouter votre première création.
                  </div>
                ) : (
                  <div className="grid sm:grid-cols-2 gap-6">
                                        {products.map((p) => (
                      <div
                        key={p.id}
                        className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-sm"
                      >
                        {p.image_url ? (
                          <img src={p.image_url} alt={p.title} className="w-full h-40 object-cover" />
                        ) : (
                          <div className="w-full h-40 bg-stone-100 flex items-center justify-center text-stone-400 text-sm">
                            Pas de photo
                          </div>
                        )}
                        <div className="p-4">
                          <h3 className="font-bold text-stone-900">{p.title}</h3>
                          <p className="text-amber-600 font-extrabold">
                            {(p.price_cents / 100).toFixed(2)} €
                          </p>
                          <p className="text-xs text-stone-500 mt-1">En stock : {p.stock}</p>
                          <button
                            onClick={() => handleDelete(p.id)}
                            className="mt-3 text-xs bg-red-50 text-red-600 px-3 py-1.5 rounded-lg hover:bg-red-100 font-medium"
                          >
                            Retirer de mon stock
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
