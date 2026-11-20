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
  shop_name?: string;
};

type CartItem = {
  product: Product;
  quantity: number;
};

export default function BoutiqueAcheteurPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCart, setShowCart] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const showNotice = (text: string, type: "success" | "error" = "success") => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 5000);
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("paiement") === "succes") {
        showNotice("Paiement validé avec succès ! Merci pour votre commande.", "success");
        window.history.replaceState({}, "", "/boutique");
      } else if (params.get("paiement") === "annule") {
        showNotice("Le paiement a été annulé. Vos articles sont toujours dans votre panier.", "error");
        window.history.replaceState({}, "", "/boutique");
      }
    }

    const fetchProducts = async () => {
      const { data, error } = await supabase
        .from("boutique_products")
        .select("*")
        .order("created_at", { ascending: false });

      if (!error && data) setProducts(data);
      setLoading(false);
    };
    fetchProducts();
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

  const handleCheckout = async () => {
    setPaying(true);
    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: cart }),
      });

      const data = await response.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        showNotice("Erreur Stripe : " + (data.error || "Impossible d'ouvrir le paiement."), "error");
        setPaying(false);
      }
    } catch {
      showNotice("Erreur de connexion au paiement.", "error");
      setPaying(false);
    }
  };

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const totalPriceCents = cart.reduce(
    (sum, item) => sum + item.product.price_cents * item.quantity,
    0
  );

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
            <Link href="/vendeur" className="text-stone-600 hover:text-stone-900">
              Espace Vendeur
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
              Panier ({totalItems})
            </button>
          </nav>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-stone-900">La Boutique</h1>
          <p className="text-stone-600 mt-1">
            Découvrez les créations disponibles et payez en toute sécurité par Bancontact ou Carte bancaire.
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

        {showCart && (
          <div className="mb-8 bg-white p-6 rounded-2xl border-2 border-amber-500 shadow-md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Mon Panier ({totalItems})</h2>
              <button
                onClick={() => setShowCart(false)}
                className="text-sm text-stone-500 hover:text-stone-900"
              >
                Fermer ✕
              </button>
            </div>

            {cart.length === 0 ? (
              <p className="text-stone-500 text-sm">Votre panier est vide.</p>
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
                          Supprimer du panier
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-4 pt-4 border-t border-stone-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <span className="text-lg font-extrabold">
                    Total : {(totalPriceCents / 100).toFixed(2)} €
                  </span>
                  <button
                    onClick={handleCheckout}
                    disabled={paying}
                    className="bg-indigo-600 text-white font-semibold px-6 py-3 rounded-xl hover:bg-indigo-700 transition disabled:opacity-50"
                  >
                    {paying ? "Ouverture de Stripe..." : "Payer maintenant (Bancontact / Carte)"}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {loading ? (
          <p className="text-stone-500">Chargement de la boutique...</p>
        ) : products.length === 0 ? (
          <div className="bg-white p-10 rounded-2xl border border-stone-200 text-center text-stone-500">
            Aucun article disponible pour le moment.
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
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
                      className="w-full h-52 object-cover"
                    />
                  ) : (
                    <div className="w-full h-52 bg-stone-100 flex items-center justify-center text-stone-400 text-sm">
                      Pas de photo
                    </div>
                  )}
                  <div className="p-5">
                    {p.shop_name && (
                      <span className="text-xs font-semibold text-stone-400 uppercase tracking-wide">
                        {p.shop_name}
                      </span>
                    )}
                    <h3 className="font-bold text-lg text-stone-900">{p.title}</h3>
                    <p className="text-amber-600 font-extrabold text-xl mt-1">
                      {(p.price_cents / 100).toFixed(2)} €
                    </p>
                    <p className="text-xs text-stone-500 mt-1">
                      Disponible : {p.stock} en stock
                    </p>
                  </div>
