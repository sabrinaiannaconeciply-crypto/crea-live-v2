"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "../../lib/supabase";

type Role = "client" | "vendeur";

export default function ProfilPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Role>("client");

  const [fullName, setFullName] = useState("");
  const [shopName, setShopName] = useState("");
  const [phone, setPhone] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [address, setAddress] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [city, setCity] = useState("");
  const [sellerStatus, setSellerStatus] = useState("particulier");
  const [vatNumber, setVatNumber] = useState("");
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  useEffect(() => {
    const load = async () => {
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
        .maybeSingle();

      if (profile) {
        setRole(profile.role === "vendeur" ? "vendeur" : "client");
        setFullName(profile.full_name || "");
        setShopName(profile.shop_name || "");
        setPhone(profile.phone || "");
        setBirthDate(profile.birth_date || "");
        setAddress(profile.address || "");
        setPostalCode(profile.postal_code || "");
        setCity(profile.city || "");
        setSellerStatus(profile.seller_status || "particulier");
        setVatNumber(profile.vat_number || "");
      }
      setLoading(false);
    };
    load();
  }, [router]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;
    setMessage(null);

    if (role === "vendeur" && (!shopName.trim() || !phone.trim() || !birthDate || !address.trim() || !postalCode.trim() || !city.trim())) {
      setMessage({ text: "Pour vendre, remplissez le nom de la boutique, le téléphone, la date de naissance et l’adresse complète.", type: "error" });
      return;
    }

    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: fullName.trim() || null,
        shop_name: role === "vendeur" ? shopName.trim() || null : null,
        phone: phone.trim() || null,
        birth_date: birthDate || null,
        address: address.trim() || null,
        postal_code: postalCode.trim() || null,
        city: city.trim() || null,
        seller_status: sellerStatus,
        vat_number: sellerStatus === "professionnel" ? vatNumber.trim() || null : null,
      })
      .eq("id", userId);
    setSaving(false);

    if (error) {
      setMessage({ text: "Enregistrement impossible : " + error.message, type: "error" });
    } else {
      setMessage({ text: "Votre fiche est enregistrée.", type: "success" });
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/connexion");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center text-stone-500">
        Chargement de votre profil...
      </div>
    );
  }

  const inputClass = "w-full p-2.5 border border-stone-300 rounded-lg text-sm";
  const labelClass = "block text-xs font-medium text-stone-600 mb-1";

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900">
      <header className="bg-white border-b border-stone-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="text-xl font-extrabold tracking-tight text-stone-900">
            CRÉA-LIVE <span className="text-amber-600">MARKET</span>
          </Link>
          <nav className="flex items-center gap-5 text-sm font-medium">
            <Link href="/boutique" className="text-stone-600 hover:text-stone-900">
              La Boutique
            </Link>
            {role === "vendeur" && (
              <Link href="/vendeur" className="text-stone-600 hover:text-stone-900">
                Mon espace vendeur
              </Link>
            )}
            <button
              type="button"
              onClick={handleLogout}
              className="bg-stone-900 text-white px-4 py-2 rounded-full hover:bg-stone-800 transition"
            >
              Se déconnecter
            </button>
          </nav>
        </div>
      </header>

      <main className="max-w-xl mx-auto px-6 py-10">
        <h1 className="text-3xl font-extrabold text-stone-900">Mon profil</h1>
        <p className="text-stone-600 mt-1 mb-6">
          Compte : {email} · {role === "vendeur" ? "Vendeur" : "Acheteur"}
        </p>

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

        <form onSubmit={handleSave} className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm flex flex-col gap-4">
          <div>
            <label htmlFor="fullName" className={labelClass}>Nom et prénom</label>
            <input id="fullName" type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} className={inputClass} />
          </div>

          {role === "vendeur" && (
            <div>
              <label htmlFor="shopName" className={labelClass}>Nom de la boutique</label>
              <input id="shopName" type="text" maxLength={80} value={shopName} onChange={(e) => setShopName(e.target.value)} className={inputClass} />
            </div>
          )}

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="phone" className={labelClass}>Téléphone</label>
              <input id="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className={inputClass} />
            </div>
            <div>
              <label htmlFor="birthDate" className={labelClass}>Date de naissance</label>
              <input id="birthDate" type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} className={inputClass} />
            </div>
          </div>

          <div>
            <label htmlFor="address" className={labelClass}>Adresse (rue et numéro)</label>
            <input id="address" type="text" value={address} onChange={(e) => setAddress(e.target.value)} className={inputClass} />
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="postalCode" className={labelClass}>Code postal</label>
              <input id="postalCode" type="text" value={postalCode} onChange={(e) => setPostalCode(e.target.value)} className={inputClass} />
            </div>
            <div>
              <label htmlFor="city" className={labelClass}>Ville</label>
              <input id="city" type="text" value={city} onChange={(e) => setCity(e.target.value)} className={inputClass} />
            </div>
          </div>

          {role === "vendeur" && (
            <>
              <div>
                <label htmlFor="sellerStatus" className={labelClass}>Je vends en tant que</label>
                <select id="sellerStatus" value={sellerStatus} onChange={(e) => setSellerStatus(e.target.value)} className={inputClass}>
                  <option value="particulier">Particulier</option>
                  <option value="professionnel">Professionnel (entreprise ou indépendant)</option>
                </select>
              </div>
              {sellerStatus === "professionnel" && (
                <div>
                  <label htmlFor="vat" className={labelClass}>Numéro d’entreprise ou de TVA</label>
                  <input id="vat" type="text" value={vatNumber} onChange={(e) => setVatNumber(e.target.value)} className={inputClass} />
                </div>
              )}
            </>
          )}

          <button
            type="submit"
            disabled={saving}
            className="mt-2 bg-amber-600 text-white font-semibold py-3 rounded-xl hover:bg-amber-700 transition disabled:opacity-50"
          >
            {saving ? "Enregistrement..." : "Enregistrer ma fiche"}
          </button>
        </form>

        {role === "vendeur" && (
          <Link
            href="/vendeur"
            className="inline-block mt-6 text-sm font-semibold text-amber-700 hover:text-amber-800"
          >
            Aller à mon espace vendeur →
          </Link>
        )}
      </main>
    </div>
  );
}
