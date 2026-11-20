"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from "../../lib/supabase";

type Product = {
  id: string;
  title: string;
  price_cents: number;
  image_url: string;
  stock: number;
};

type CartItem = {
  product: Product;
  quantity: number;
};

export default function BoutiquePage() {
  const [mode, setMode] = useState<"acheteur" | "vendeur">("acheteur");
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCart, setShowCart] = useState(false);

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

  const addToCart = (product: Product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) {
          showNotice("Stock maximum atteint pour cet article.", "error");
          return prev;
        }
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
    showNotice(`"${product.title}" ajouté à votre panier !`);
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
    showNotice("Article retiré du panier.");
  };

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const totalPriceCents = cart.reduce(
    (sum, item) => sum + item.product.price_cents * item.quantity,
    0
  );

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

  const handleDeleteProduct = async (id: string) => {
    const { error } = await supabase.from("boutique_products").delete().eq("id", id);
    if (!error) {
      showNotice("Article supprimé de la boutique.");
      setCart((prev) => prev.filter((item) => item.product.id !== id));
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
            <button
              onClick={() => setShowCart(!showCart)}
              className="bg-amber-100 text-amber-900 px-4 py-2 rounded-full font-semibold hover:bg-amber-200 transition"
            >
              🛒 Panier ({totalItems})
            </button>
          </nav>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-extrabold text-stone-900">La Boutique</h1>
            <p className="text-stone-600 mt-1">
              {mode === "acheteur"
                ? "Parcourez les créations et ajoutez-les à votre panier."
                : "Espace Vendeur : ajoutez ou supprimez les articles de votre boutique."}
            </p>
          </div>

          <div className="inline-flex bg-stone-200 p-1 rounded-xl self-start">
            <button
              onClick={() => setMode("acheteur")}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
                mode === "acheteur"
                  ? "bg-white text-stone-900 shadow-sm"
                  : "text-stone-600 hover:text-stone-900"
              }`}
            >
              Côté Acheteur
            </button>
            <button
              onClick={() => setMode("vendeur")}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
                mode === "vendeur"
                  ? "bg-white text-stone-900 shadow-sm"
                  : "text-stone-600 hover:text-stone-900"
              }`}
            >
              Côté Vendeur (Gérer)
            </button>
          </div>
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

        {showCart && (
          <div className="mb-8 bg-white p-6 rounded-2xl border-2 border-amber-500 shadow-md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Votre Panier ({totalItems})</h2>
              <button
                onClick={() => setShowCart(false)}
                className="text-sm text-stone-500 hover:text-stone-900"
              >
                Fermer ✕
              </button>
            </div>

            {cart.length === 0 ? (
              <p className="text-stone-500 text-sm">Votre panier est vide pour le moment.</p>
            ) : (
              <div>
                <div className="divide-y divide-stone-200">
                  {cart.map((item) => (
                    <div
                      key={item.product.id}
                      className="py-3 flex items-center justify-between gap-4"
                    >
                      <div>
                        <p className="font-semibold text-stone-900">{item.product.title}</p>
                        <p className="text-xs text-stone-500">
                          Quantité : {item.quantity} × {(item.product.price_cents / 100).toFixed(2)} €
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="font-bold text-stone-900">
                          {((item.product.price_cents * item.quantity) / 100).toFixed(2)} €
                        </span>
                        <button
                          onClick={() => removeFromCart(item.product.id)}
                          className="text-xs bg-red-50 text-red-600 px-3 py-1.5 rounded-lg hover:bg-red-100 font-medium"
                        >
                          Retirer
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-4 pt-4 border-t border-stone-200 flex items-center justify-between">
                  <span className="text-lg font-extrabold">
                    Total : {(totalPriceCents / 100).toFixed(2)} €
                  </span>
                  <button
                    onClick={() => {
                      showNotice("Commande enregistrée avec succès ! Merci pour votre achat.");
                      setCart([]);
                      setShowCart(false);
                    }}
                    className="bg-amber-600 text-white font-semibold px-6 py-2.5 rounded-xl hover:bg-amber-700 transition"
                  >
                    Valider la commande
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {mode === "vendeur" ? (
          <div className="grid lg:grid-cols-3 gap-8 items-start">
