"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "../../lib/supabase";

export default function ConnexionPage() {
  const router = useRouter();
  const [isRegister, setIsRegister] = useState(true);
  const [role, setRole] = useState<"client" | "vendeur">("client");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [shopName, setShopName] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    if (isRegister) {
      // Inscription
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        setMessage({ text: "Erreur d'inscription : " + error.message, type: "error" });
        setLoading(false);
        return;
      }

      if (data.user) {
        const { error: profileError } = await supabase.from("profiles").insert([
          {
            id: data.user.id,
            email,
            role,
            full_name: fullName,
            shop_name: role === "vendeur" ? shopName : null,
          },
        ]);

        if (profileError) {
          setMessage({ text: "Compte créé, mais erreur profil : " + profileError.message, type: "error" });
          setLoading(false);
          return;
        }

        setMessage({ text: "Compte créé avec succès ! Redirection...", type: "success" });
        setTimeout(() => {
          router.push(role === "vendeur" ? "/vendeur" : "/boutique");
        }, 1200);
      }
    } else {
      // Connexion
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setMessage({ text: "Identifiants incorrects : " + error.message, type: "error" });
        setLoading(false);
        return;
      }

      if (data.user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", data.user.id)
          .single();

        setMessage({ text: "Connexion réussie ! Redirection...", type: "success" });
        setTimeout(() => {
          router.push(profile?.role === "vendeur" ? "/vendeur" : "/boutique");
        }, 1000);
      }
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 flex flex-col">
      <header className="bg-white border-b border-stone-200">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="text-xl font-extrabold tracking-tight text-stone-900">
            CRÉA-LIVE <span className="text-amber-600">MARKET</span>
          </Link>
          <Link href="/" className="text-sm text-stone-600 hover:text-stone-900">
            ← Retour à l&apos;accueil
          </Link>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md bg-white p-8 rounded-2xl border border-stone-200 shadow-sm">
          {/* Onglets Inscription / Connexion */}
          <div className="grid grid-cols-2 bg-stone-100 p-1 rounded-xl mb-6">
            <button
              type="button"
              onClick={() => {
                setIsRegister(true);
                setMessage(null);
              }}
              className={`py-2 rounded-lg text-sm font-semibold transition ${
                isRegister ? "bg-white text-stone-900 shadow-sm" : "text-stone-600"
              }`}
            >
              Créer un compte
            </button>
            <button
              type="button"
              onClick={() => {
                setIsRegister(false);
                setMessage(null);
              }}
              className={`py-2 rounded-lg text-sm font-semibold transition ${
                !isRegister ? "bg-white text-stone-900 shadow-sm" : "text-stone-600"
              }`}
            >
              Se connecter
            </button>
          </div>

          <h1 className="text-2xl font-extrabold text-stone-900 mb-2">
            {isRegister ? "Rejoindre CRÉA-LIVE" : "Bon retour parmi nous"}
          </h1>
          <p className="text-sm text-stone-600 mb-6">
            {isRegister
              ? "Choisissez votre type de profil pour accéder à votre espace dédié."
              : "Connectez-vous pour accéder à votre espace personnel."}
          </p>

          {message && (
            <div
              className={`mb-5 p-3.5 rounded-xl text-sm font-medium ${
                message.type === "success"
                  ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                  : "bg-red-50 text-red-800 border border-red-200"
              }`}
            >
              {message.text}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* Choix du profil uniquement à l'inscription */}
            {isRegister && (
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-2">
                  Je m&apos;inscris en tant que :
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setRole("client")}
                    className={`p-3 rounded-xl border text-left transition ${
                      role === "client"
                        ? "border-amber-600 bg-amber-50 text-amber-900"
                        : "border-stone-200 hover:border-stone-300"
                    }`}
                  >
                    <div className="text-lg mb-1">🛍️</div>
                    <div className="font-bold text-sm">Client</div>
                    <div className="text-xs text-stone-500">Acheter & suivre les lives</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRole("vendeur")}
                    className={`p-3 rounded-xl border text-left transition ${
                      role === "vendeur"
                        ? "border-amber-600 bg-amber-50 text-amber-900"
                        : "border-stone-200 hover:border-stone-300"
                    }`}
                  >
                    <div className="text-lg mb-1">🏪</div>
                    <div className="font-bold text-sm">Vendeur</div>
                    <div className="text-xs text-stone-500">Vendre en boutique & live</div>
                  </button>
                </div>
              </div>
            )}

            {isRegister && (
              <input
                type="text"
                placeholder="Votre nom et prénom"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                className="p-3 border border-stone-300 rounded-xl text-sm"
              />
            )}

            {isRegister && role === "vendeur" && (
              <input
                type="text"
                placeholder="Nom de votre boutique / marque"
                value={shopName}
                onChange={(e) => setShopName(e.target.value)}
                required
                className="p-3 border border-stone-300 rounded-xl text-sm"
              />
            )}

            <input
              type="email"
              placeholder="Adresse e-mail"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="p-3 border border-stone-300 rounded-xl text-sm"
            />

            <input
              type="password"
              placeholder="Mot de passe (6 caractères min.)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="p-3 border border-stone-300 rounded-xl text-sm"
            />

            <button
              type="submit"
              disabled={loading}
              className="mt-2 bg-stone-900 text-white font-semibold py-3 rounded-xl hover:bg-stone-800 transition disabled:opacity-50"
            >
              {loading
                ? "Chargement..."
                : isRegister
                ? `Créer mon compte ${role === "vendeur" ? "Vendeur" : "Client"}`
                : "Se connecter"}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
