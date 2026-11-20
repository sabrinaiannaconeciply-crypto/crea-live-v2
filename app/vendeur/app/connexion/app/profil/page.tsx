"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "../../lib/supabase";

export default function ProfilPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [role, setRole] = useState<"client" | "vendeur">("client");
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [shopName, setShopName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [city, setCity] = useState("");
  const [stripeAccountId, setStripeAccountId] = useState("");
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  useEffect(() => {
    const loadProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push("/connexion");
        return;
      }

      setUserId(user.id);
      setEmail(user.email || "");

      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (profile) {
        setRole(profile.role || "client");
        setFullName(profile.full_name || "");
        setShopName(profile.shop_name || "");
        setPhone(profile.phone || "");
        setAddress(profile.address || "");
        setPostalCode(profile.postal_code || "");
        setCity(profile.city || "");
        setStripeAccountId(profile.stripe_account_id || "");
      }
      setLoading(false);
    };

    loadProfile();
  }, [router]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;
    setSaving(true);
    setMessage(null);

    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: fullName,
        shop_name: role === "vendeur" ? shopName : null,
        phone,
        address,
        postal_code: postalCode,
        city,
      })
      .eq("id", userId);

    if (!error) {
      setMessage({ text: "Vos informations ont bien été enregistrées !", type: "success" });
    } else {
      setMessage({ text: "Erreur : " + error.message, type: "error" });
    }
    setSaving(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center text-stone-500">
        Chargement de votre fiche profil...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900">
      <header className="bg-white border-b border-stone-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
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
            {role === "vendeur" && (
              <Link href="/vendeur" className="text-stone-600 hover:text-stone-900">
                Espace Vendeur
              </Link>
            )}
            <button
              onClick={handleLogout}
              className="text-red-600 hover:text-red-700 font-semibold"
            >
              Déconnexion
            </button>
          </nav>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-10">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <span className="inline-block bg-amber-100 text-amber-800 text-xs font-bold px-3 py-1 rounded-full uppercase mb-2">
              Compte {role === "vendeur" ? "Vendeur / Créateur" : "Client / Acheteur"}
            </span>
            <h1 className="text-3xl font-extrabold text-stone-900">Ma Fiche Profil</h1>
            <p className="text-stone-600 text-sm mt-1">{email}</p>
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

        <form onSubmit={handleSave} className="bg-white p-8 rounded-2xl border border-stone-200 shadow-sm flex flex-col gap-5">
          <h2 className="text-lg font-bold border-b border-stone-100 pb-3">
            1. Coordonnées personnelles
          </h2>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-stone-600 mb-1">
                Nom et prénom
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                className="w-full p-2.5 border border-stone-300 rounded-xl text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-600 mb-1">
                Numéro de téléphone
              </label>
              <input
                type="tel"
                placeholder="Ex: 0470 12 34 56"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full p-2.5 border border-stone-300 rounded-xl text-sm"
              />
            </div>
          </div>

          {role === "vendeur" && (
            <div>
              <label className="block text-xs font-semibold text-stone-600 mb-1">
                Nom de votre boutique / marque
              </label>
              <input
                type="text"
                value={shopName}
                onChange={(e) => setShopName(e.target.value)}
                required
                className="w-full p-2.5 border border-stone-300 rounded-xl text-sm"
              />
            </div>
          )}

          <h2 className="text-lg font-bold border-b border-stone-100 pb-3 mt-2">
            2. {role === "vendeur" ? "Adresse de l'atelier / expédition" : "Adresse de livraison"}
          </h2>

          <div>
            <label className="block text-xs font-semibold text-stone-600 mb-1">
              Rue et numéro
            </label>
            <input
              type="text"
              placeholder="Ex: Rue de la Station 15"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full p-2.5 border border-stone-300 rounded-xl text-sm"
            />
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-stone-600 mb-1">
                Code postal
              </label>
              <input
                type="text"
                placeholder="Ex: 7370"
                value={postalCode}
                onChange={(e) => setPostalCode(e.target.value)}
                className="w-full p-2.5 border border-stone-300 rounded-xl text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-600 mb-1">
                Ville / Commune
              </label>
              <input
                type="text"
                placeholder="Ex: Dour"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full p-2.5 border border-stone-300 rounded-xl text-sm"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="mt-2 bg-amber-600 text-white font-semibold py-3 rounded-xl hover:bg-amber-700 transition disabled:opacity-50"
          >
            {saving ? "Enregistrement..." : "Enregistrer mes coordonnées"}
          </button>
        </form>

        {/* Bloc Paiements Stripe */}
        <div className="mt-8 bg-white p-8 rounded-2xl border border-stone-200 shadow-sm">
          <h2 className="text-lg font-bold mb-2">
            3. {role === "vendeur" ? "Recevoir mes paiements (Stripe Connect)" : "Moyens de paiement"}
          </h2>
          {role === "vendeur" ? (
            <div>
              <p className="text-sm text-stone-600 mb-4">
                Reliez votre compte bancaire de façon sécurisée via <strong>Stripe</strong> pour recevoir automatiquement le montant de vos ventes en boutique et en live.
              </p>
              {stripeAccountId ? (
                <div className="p-3 bg-emerald-50 text-emerald-800 rounded-xl text-sm font-semibold">
                  ✓ Compte Stripe connecté ({stripeAccountId})
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() =>
                    alert("La connexion bancaire Stripe Connect sera activée dès que vous aurez ajouté votre clé secrète Stripe dans Vercel.")
                  }
                  className="bg-indigo-600 text-white font-semibold px-5 py-2.5 rounded-xl hover:bg-indigo-700 transition text-sm"
                >
                  Configurer mes virements bancaires (Stripe)
                </button>
              )}
            </div>
          ) : (
