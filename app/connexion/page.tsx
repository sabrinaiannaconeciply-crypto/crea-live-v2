"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "../../lib/supabase";

type Mode = "login" | "signup";
type Role = "client" | "vendeur";

export default function ConnexionPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>("client");
  const [shopName, setShopName] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const explain = (text: string) => {
    if (text.includes("Invalid login credentials")) return "Adresse e-mail ou mot de passe incorrect.";
    if (text.includes("Email not confirmed")) return "Votre adresse e-mail n’est pas encore confirmée. Cliquez sur le lien reçu par e-mail.";
    if (text.includes("already registered")) return "Un compte existe déjà avec cette adresse e-mail. Connectez-vous.";
    if (text.includes("Password should be")) return "Le mot de passe est trop court (6 caractères minimum).";
    if (text.includes("rate limit")) return "Trop d’essais. Patientez quelques minutes puis recommencez.";
    return "Une erreur est survenue : " + text;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (!email.trim() || password.length < 6) {
      setMessage({ text: "Entrez votre adresse e-mail et un mot de passe d’au moins 6 caractères.", type: "error" });
      return;
    }
    if (mode === "signup" && role === "vendeur" && !shopName.trim()) {
      setMessage({ text: "Donnez un nom à votre boutique.", type: "error" });
      return;
    }

    setBusy(true);
    try {
      if (mode === "login") {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (error || !data.user) {
          setMessage({ text: explain(error ? error.message : "Connexion impossible."), type: "error" });
          return;
        }
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", data.user.id)
          .maybeSingle();
        router.push(profile && profile.role === "vendeur" ? "/vendeur" : "/boutique");
      } else {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            emailRedirectTo: window.location.origin + "/connexion",
            data: { role, shop_name: role === "vendeur" ? shopName.trim() : null },
          },
        });
        if (error) {
          setMessage({ text: explain(error.message), type: "error" });
          return;
        }
        if (data.session) {
          router.push(role === "vendeur" ? "/vendeur" : "/boutique");
        } else {
          setMessage({
            text: "Compte créé ! Un e-mail de confirmation vient de vous être envoyé. Cliquez sur le lien qu’il contient, puis revenez vous connecter ici.",
            type: "success",
          });
          setMode("login");
          setPassword("");
        }
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900">
      <header className="bg-white border-b border-stone-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="text-xl font-extrabold tracking-tight text-stone-900">
            AVENUE DES <span className="text-amber-600">CRÉATEURS</span>
          </Link>
          <nav className="flex items-center gap-6 text-sm font-medium">
            <Link href="/" className="text-stone-600 hover:text-stone-900">
              Accueil
            </Link>
            <Link href="/boutique" className="text-stone-600 hover:text-stone-900">
              La Boutique
            </Link>
          </nav>
        </div>
      </header>

      <main className="max-w-md mx-auto px-6 py-12">
        <h1 className="text-3xl font-extrabold text-stone-900">
          {mode === "login" ? "Connexion" : "Créer un compte"}
        </h1>
        <p className="text-stone-600 mt-1 mb-6">
          {mode === "login"
            ? "Retrouvez votre boutique, votre stock et vos commandes."
            : "Achetez des créations, ou ouvrez gratuitement votre boutique (15 articles offerts)."}
        </p>

        <div className="flex bg-stone-200 rounded-xl p-1 mb-6">
          <button
            type="button"
            onClick={() => { setMode("login"); setMessage(null); }}
            className={`flex-1 py-2 rounded-lg text-sm font-semibold transition ${
              mode === "login" ? "bg-white text-stone-900 shadow-sm" : "text-stone-600"
            }`}
          >
            Se connecter
          </button>
          <button
            type="button"
            onClick={() => { setMode("signup"); setMessage(null); }}
            className={`flex-1 py-2 rounded-lg text-sm font-semibold transition ${
              mode === "signup" ? "bg-white text-stone-900 shadow-sm" : "text-stone-600"
            }`}
          >
            Créer un compte
          </button>
        </div>

        {message && (
          <div
            role="status"
            className={`mb-6 p-4 rounded-xl text-sm font-medium ${
              message.type === "success"
                ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                : "bg-red-50 text-red-800 border border-red-200"
            }`}
          >
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm flex flex-col gap-4">
          {mode === "signup" && (
            <div>
              <span className="block text-xs font-medium text-stone-600 mb-2">Je souhaite</span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  aria-pressed={role === "client"}
                  onClick={() => setRole("client")}
                  className={`p-3 rounded-xl border-2 text-sm font-semibold transition ${
                    role === "client"
                      ? "border-amber-500 bg-amber-50 text-amber-900"
                      : "border-stone-200 text-stone-600"
                  }`}
                >
                  Acheter
                </button>
                <button
                  type="button"
                  aria-pressed={role === "vendeur"}
                  onClick={() => setRole("vendeur")}
                  className={`p-3 rounded-xl border-2 text-sm font-semibold transition ${
                    role === "vendeur"
                      ? "border-amber-500 bg-amber-50 text-amber-900"
                      : "border-stone-200 text-stone-600"
                  }`}
                >
                  Vendre
                </button>
              </div>
            </div>
          )}

          {mode === "signup" && role === "vendeur" && (
            <div>
              <label htmlFor="shop" className="block text-xs font-medium text-stone-600 mb-1">
                Nom de votre boutique
              </label>
              <input
                id="shop"
                type="text"
                maxLength={80}
                value={shopName}
                onChange={(e) => setShopName(e.target.value)}
                className="w-full p-2.5 border border-stone-300 rounded-lg text-sm"
              />
            </div>
          )}

          <div>
            <label htmlFor="email" className="block text-xs font-medium text-stone-600 mb-1">
              Adresse e-mail
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-2.5 border border-stone-300 rounded-lg text-sm"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-xs font-medium text-stone-600 mb-1">
              Mot de passe (6 caractères minimum)
            </label>
            <input
              id="password"
              type="password"
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-2.5 border border-stone-300 rounded-lg text-sm"
            />
          </div>

          <button
            type="submit"
            disabled={busy}
            className="mt-2 bg-amber-600 text-white font-semibold py-3 rounded-xl hover:bg-amber-700 transition disabled:opacity-50"
          >
            {busy ? "Veuillez patienter..." : mode === "login" ? "Se connecter" : "Créer mon compte"}
          </button>
        </form>
      </main>
    </div>
  );
}
