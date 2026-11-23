"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "../../lib/supabase";

type Product = {
  id: string;
  title: string;
  price_cents: number;
  image_url: string | null;
  stock: number;
};

type OrderInfo = {
  id: string;
  status: string;
  buyer_email: string | null;
  shipping_name: string | null;
  shipping_address: {
    line1?: string;
    line2?: string;
    postal_code?: string;
    city?: string;
    country?: string;
  } | null;
  paid_at: string | null;
};

type SaleLine = {
  id: string;
  title: string;
  unit_price_cents: number;
  quantity: number;
  created_at: string;
  order: OrderInfo | null;
};

type Tab = "accueil" | "emplacements" | "stock" | "commandes" | "compte";

const MAX_FREE = 15;

const euro = (cents: number) =>
  (cents / 100).toLocaleString("fr-BE", { style: "currency", currency: "EUR" });

const csvEscape = (value: string | number) => {
  const s = String(value ?? "");
  return /[";\n\r]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
};

const downloadCsv = (fileName: string, rows: (string | number)[][]) => {
  const content = "\uFEFF" + rows.map((r) => r.map(csvEscape).join(";")).join("\r\n");
  const blob = new Blob([content], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
};

const parseCsv = (text: string): string[][] => {
  const clean = text.replace(/^\uFEFF/, "");
  const firstLine = clean.split(/\r?\n/)[0] || "";
  const sep = firstLine.includes(";") ? ";" : ",";
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let inQuotes = false;
  for (let i = 0; i < clean.length; i++) {
    const c = clean[i];
    if (inQuotes) {
      if (c === '"' && clean[i + 1] === '"') {
        cell += '"';
        i++;
      } else if (c === '"') {
        inQuotes = false;
      } else {
        cell += c;
      }
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === sep) {
      row.push(cell);
      cell = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && clean[i + 1] === "\n") i++;
      row.push(cell);
      cell = "";
      if (row.some((x) => x.trim() !== "")) rows.push(row);
      row = [];
    } else {
      cell += c;
    }
  }
  row.push(cell);
  if (row.some((x) => x.trim() !== "")) rows.push(row);
  return rows;
};

const formatAddress = (a: OrderInfo["shipping_address"]) => {
  if (!a) return "Adresse non renseignée";
  return [a.line1, a.line2, [a.postal_code, a.city].filter(Boolean).join(" "), a.country]
    .filter(Boolean)
    .join(", ");
};

type Profile = {
  role: string;
  full_name: string | null;
  shop_name: string | null;
  phone: string | null;
  birth_date: string | null;
  address: string | null;
  postal_code: string | null;
  city: string | null;
  seller_status: string | null;
  vat_number: string | null;
};

export default function VendeurPage() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("accueil");
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [memberSince, setMemberSince] = useState("");
  const [profile, setProfile] = useState<Profile | null>(null);
  const [shopName, setShopName] = useState("Ma Boutique");
  const [profileIncomplete, setProfileIncomplete] = useState(false);

  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<SaleLine[]>([]);

  const [showAdd, setShowAdd] = useState(false);
  const [saving, setSaving] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [fileKey, setFileKey] = useState(0);
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("1");

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editPrice, setEditPrice] = useState("");
  const [editStock, setEditStock] = useState("");

  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const showNotice = (text: string, type: "success" | "error" = "success") => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 6000);
  };

  const loadProducts = useCallback(async (uid: string) => {
    const { data, error } = await supabase
      .from("boutique_products")
      .select("id,title,price_cents,image_url,stock")
      .eq("seller_id", uid)
      .order("created_at", { ascending: true });
    if (!error && data) setProducts(data as Product[]);
  }, []);

  const loadSales = useCallback(async (uid: string) => {
    const { data, error } = await supabase
      .from("order_items")
      .select(
        "id,title,unit_price_cents,quantity,created_at,order:orders(id,status,buyer_email,shipping_name,shipping_address,paid_at)"
      )
      .eq("seller_id", uid)
      .order("created_at", { ascending: false });
    if (!error && data) setSales(data as unknown as SaleLine[]);
  }, []);

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/connexion");
        return;
      }
      const { data: prof } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();

      if (!prof || prof.role !== "vendeur") {
        router.push("/connexion");
        return;
      }

      setUserId(user.id);
      setEmail(user.email || "");
      setMemberSince(user.created_at ? new Date(user.created_at).toLocaleDateString("fr-BE") : "");
      setProfile(prof as Profile);
      setShopName(prof.shop_name || "Ma Boutique");

      if (!prof.phone || !prof.birth_date || !prof.address || !prof.postal_code || !prof.city) {
        setProfileIncomplete(true);
        setLoading(false);
        return;
      }

      await Promise.all([loadProducts(user.id), loadSales(user.id)]);
      setLoading(false);
    };
    init();
  }, [router, loadProducts, loadSales]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/connexion");
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;
    const numericPrice = parseFloat(price.replace(",", "."));
    if (!title.trim() || isNaN(numericPrice) || numericPrice < 0.5) {
      showNotice("Entrez un nom et un prix d’au moins 0,50 €.", "error");
      return;
    }
    setSaving(true);

    let imageUrl = "";
    if (file) {
      const ext = (file.name.split(".").pop() || "").toLowerCase();
      if (!["jpg", "jpeg", "png", "webp", "gif"].includes(ext)) {
        showNotice("La photo doit être au format JPG, PNG, WEBP ou GIF.", "error");
        setSaving(false);
        return;
      }
      const fileName = `boutique-${userId}-${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage.from("products").upload(fileName, file);
      if (uploadError) {
        showNotice("Photo non envoyée : " + uploadError.message, "error");
        setSaving(false);
        return;
      }
      imageUrl = supabase.storage.from("products").getPublicUrl(fileName).data.publicUrl;
    }

    const { error } = await supabase.from("boutique_products").insert([
      {
        title: title.trim(),
        price_cents: Math.round(numericPrice * 100),
        image_url: imageUrl,
        stock: Math.max(0, parseInt(stock) || 1),
        seller_id: userId,
        shop_name: shopName,
      },
    ]);
    setSaving(false);

    if (error) {
      showNotice(error.message, "error");
      return;
    }
    showNotice("Article publié dans votre boutique.");
    setTitle("");
    setPrice("");
    setStock("1");
    setFile(null);
    setFileKey((k) => k + 1);
    setShowAdd(false);
    loadProducts(userId);
  };

  const startEdit = (p: Product) => {
    setEditingId(p.id);
    setEditTitle(p.title);
    setEditPrice((p.price_cents / 100).toFixed(2));
    setEditStock(String(p.stock));
  };

  const saveEdit = async (id: string) => {
    if (!userId) return;
    const numericPrice = parseFloat(editPrice.replace(",", "."));
    const numericStock = parseInt(editStock);
    if (!editTitle.trim() || isNaN(numericPrice) || numericPrice < 0.5 || isNaN(numericStock) || numericStock < 0) {
      showNotice("Vérifiez le nom, le prix (0,50 € minimum) et le stock.", "error");
      return;
    }
    const { error } = await supabase
      .from("boutique_products")
      .update({
        title: editTitle.trim(),
        price_cents: Math.round(numericPrice * 100),
        stock: numericStock,
      })
      .eq("id", id)
      .eq("seller_id", userId);
    if (error) {
      showNotice(error.message, "error");
      return;
    }
    setEditingId(null);
    showNotice("Article mis à jour.");
    loadProducts(userId);
  };

  const adjustStock = async (p: Product, delta: number) => {
    if (!userId) return;
    const next = Math.max(0, p.stock + delta);
    if (next === p.stock) return;
    const { error } = await supabase
      .from("boutique_products")
      .update({ stock: next })
      .eq("id", p.id)
      .eq("seller_id", userId);
    if (error) {
      showNotice(error.message, "error");
      return;
    }
    loadProducts(userId);
  };

  const handleDelete = async (id: string) => {
    if (!userId) return;
    if (!window.confirm("Retirer cet article de votre boutique ?")) return;
    const { error } = await supabase.from("boutique_products").delete().eq("id", id).eq("seller_id", userId);
    if (error) {
      showNotice(error.message, "error");
      return;
    }
    showNotice("Article retiré.");
    loadProducts(userId);
  };

  const exportProducts = () => {
    downloadCsv("mes-articles.csv", [
      ["titre", "prix", "stock"],
      ...products.map((p) => [p.title, (p.price_cents / 100).toFixed(2).replace(".", ","), p.stock]),
    ]);
  };

  const importProducts = async (csvFile: File) => {
    if (!userId) return;
    const rows = parseCsv(await csvFile.text());
    let added = 0;
    let stopped = "";
    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      const rowTitle = (r[0] || "").trim();
      const rowPrice = parseFloat((r[1] || "").replace(",", "."));
      const rowStock = parseInt(r[2] || "1", 10);
      if (i === 0 && isNaN(rowPrice)) continue;
      if (!rowTitle || isNaN(rowPrice) || rowPrice < 0.5) continue;
      const { error } = await supabase.from("boutique_products").insert([
        {
          title: rowTitle,
          price_cents: Math.round(rowPrice * 100),
          image_url: "",
          stock: isNaN(rowStock) ? 1 : Math.max(0, rowStock),
          seller_id: userId,
          shop_name: shopName,
        },
      ]);
      if (error) {
        stopped = error.message;
        break;
      }
      added++;
    }
    await loadProducts(userId);
    if (stopped) {
      showNotice(`${added} article(s) ajouté(s). Import arrêté : ${stopped}`, "error");
    } else {
      showNotice(`${added} article(s) importé(s).`);
    }
  };

  const exportSales = () => {
    downloadCsv("mes-commandes.csv", [
      ["date", "article", "quantite", "prix_unitaire", "acheteur", "email", "adresse", "statut"],
      ...sales.map((s) => [
        s.order && s.order.paid_at ? new Date(s.order.paid_at).toLocaleString("fr-BE") : "",
        s.title,
        s.quantity,
        (s.unit_price_cents / 100).toFixed(2).replace(".", ","),
        s.order ? s.order.shipping_name || "" : "",
        s.order ? s.order.buyer_email || "" : "",
        s.order ? formatAddress(s.order.shipping_address) : "",
        s.order ? s.order.status : "",
      ]),
    ]);
  };

  const paidSales = sales.filter((s) => s.order && s.order.status === "paid");
  const revenueCents = paidSales.reduce((sum, s) => sum + s.unit_price_cents * s.quantity, 0);
  const soldOut = products.filter((p) => p.stock === 0).length;
  const stockInfo = (n: number) =>
    n === 0
      ? { label: "Épuisé", cls: "bg-red-50 text-red-700" }
      : n <= 2
      ? { label: `${n} en stock · faible`, cls: "bg-amber-50 text-amber-800" }
      : { label: `${n} en stock`, cls: "bg-emerald-50 text-emerald-800" };
  const slots = Array.from({ length: MAX_FREE }, (_, i) => products[i] || null);

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center text-stone-500">
        Vérification de votre accès vendeur...
      </div>
    );
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: "accueil", label: "Tableau de bord" },
    { id: "emplacements", label: `Mes ${MAX_FREE} articles` },
    { id: "stock", label: "Stock" },
    { id: "commandes", label: `Commandes (${paidSales.length})` },
    { id: "compte", label: "Mon compte" },
  ];

  const inputClass = "p-2.5 border border-stone-300 rounded-lg text-sm w-full";

  const detailRow = (label: string, value: string | null | undefined) => (
    <div className="flex justify-between gap-4 py-3 border-b border-stone-100 last:border-0 text-sm">
      <span className="text-stone-500">{label}</span>
      <span className="font-medium text-stone-900 text-right">{value ? value : "Non renseigné"}</span>
    </div>
  );

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900">
      <header className="bg-white border-b border-stone-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="text-xl font-extrabold tracking-tight text-stone-900">
            CRÉA-LIVE <span className="text-amber-600">MARKET</span>
          </Link>
          <nav className="flex items-center gap-5 text-sm font-medium">
            <Link href="/boutique" className="text-stone-600 hover:text-stone-900">
              Boutique
            </Link>
            <Link href="/live" className="bg-stone-900 text-white px-4 py-2 rounded-full hover:bg-stone-800 transition">
              Espace Live
            </Link>
            <button type="button" onClick={handleLogout} className="text-stone-600 hover:text-stone-900">
              Se déconnecter
            </button>
          </nav>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-10">
        <div className="mb-6">
          <span className="inline-block bg-amber-100 text-amber-800 text-xs font-bold px-3 py-1 rounded-full mb-2">
            Boutique : {shopName}
          </span>
          <h1 className="text-3xl font-extrabold text-stone-900">Espace Vendeur</h1>
        </div>

        {profileIncomplete ? (
          <div className="bg-amber-50 border-2 border-amber-400 p-8 rounded-2xl max-w-xl">
            <h2 className="text-xl font-bold text-amber-950 mb-2">Fiche légale et coordonnées incomplètes</h2>
            <p className="text-sm text-amber-900 mb-6">
              Avant de mettre des articles en vente, renseignez votre téléphone, votre date de naissance et votre adresse complète dans votre fiche profil.
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
            <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
              {tabs.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTab(t.id)}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition ${
                    tab === t.id ? "bg-stone-900 text-white" : "bg-white border border-stone-200 text-stone-600 hover:bg-stone-100"
                  }`}
                >
                  {t.label}
                </button>
              ))}
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

            {tab === "accueil" && (
              <div className="flex flex-col gap-6">
                <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm">
                  <h2 className="text-lg font-bold">Bienvenue, {shopName}</h2>
                  <p className="text-sm text-stone-600 mt-1">
                    Vous utilisez {products.length} emplacement{products.length > 1 ? "s" : ""} sur {MAX_FREE} gratuits.
                  </p>
                  <div className="h-2 bg-stone-100 rounded-full mt-4 overflow-hidden">
                    <div
                      className="h-full bg-amber-500"
                      style={{ width: `${Math.min(100, (products.length / MAX_FREE) * 100)}%` }}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => { setTab("emplacements"); setShowAdd(true); }}
                    disabled={products.length >= MAX_FREE}
                    className="mt-5 bg-amber-600 text-white text-sm font-semibold px-5 py-2.5 rounded-lg hover:bg-amber-700 transition disabled:opacity-50"
                  >
                    + Ajouter un article
                  </button>
                </div>

                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-white p-5 rounded-2xl border border-stone-200">
                    <p className="text-xs text-stone-500">Emplacements libres</p>
                    <p className="text-2xl font-extrabold">{MAX_FREE - products.length}</p>
                  </div>
                  <div className="bg-white p-5 rounded-2xl border border-stone-200">
                    <p className="text-xs text-stone-500">Articles épuisés</p>
                    <p className={`text-2xl font-extrabold ${soldOut > 0 ? "text-red-600" : ""}`}>{soldOut}</p>
                  </div>
                  <div className="bg-white p-5 rounded-2xl border border-stone-200">
                    <p className="text-xs text-stone-500">Articles vendus</p>
                    <p className="text-2xl font-extrabold">{paidSales.reduce((sum, s) => sum + s.quantity, 0)}</p>
                  </div>
                  <div className="bg-white p-5 rounded-2xl border border-stone-200">
                    <p className="text-xs text-stone-500">Ventes (hors frais)</p>
                    <p className="text-2xl font-extrabold">{euro(revenueCents)}</p>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="text-lg font-bold">Stock par article</h2>
                    <button type="button" onClick={() => setTab("stock")} className="text-sm font-semibold text-amber-700 hover:text-amber-800">
                      Ajuster le stock →
                    </button>
                  </div>
                  {products.length === 0 ? (
                    <p className="text-sm text-stone-500">Aucun article pour le moment.</p>
                  ) : (
                    products.map((p, i) => (
                      <div key={p.id} className="flex items-center justify-between gap-4 py-3 border-t border-stone-100 text-sm">
                        <span>
                          <span className="text-stone-400">Article {i + 1} · </span>
                          <span className="font-semibold">{p.title}</span>
                        </span>
                        <span className={`text-xs font-semibold px-3 py-1 rounded-full whitespace-nowrap ${stockInfo(p.stock).cls}`}>
                          {stockInfo(p.stock).label}
                        </span>
                      </div>
                    ))
                  )}
                </div>

                <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="text-lg font-bold">Dernières commandes</h2>
                    <button type="button" onClick={() => setTab("commandes")} className="text-sm font-semibold text-amber-700 hover:text-amber-800">
                      Tout voir →
                    </button>
                  </div>
                  {paidSales.length === 0 ? (
                    <p className="text-sm text-stone-500">Aucune commande pour le moment.</p>
                  ) : (
                    paidSales.slice(0, 3).map((s) => (
                      <div key={s.id} className="flex justify-between gap-4 py-3 border-t border-stone-100 text-sm">
                        <span>
                          {s.title} × {s.quantity}
                          <span className="text-stone-400"> · {s.order && s.order.shipping_name ? s.order.shipping_name : "Acheteur"}</span>
                        </span>
                        <span className="font-bold">{euro(s.unit_price_cents * s.quantity)}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {tab === "emplacements" && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold">
                    Mes {MAX_FREE} articles gratuits ({products.length} / {MAX_FREE})
                  </h2>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                  {slots.map((p, i) =>
                    p ? (
                      <div key={p.id} className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-sm flex flex-col">
                        {p.image_url ? (
                          <img src={p.image_url} alt={p.title} className="w-full h-32 object-cover" />
                        ) : (
                          <div className="w-full h-32 bg-stone-100 flex items-center justify-center text-stone-400 text-xs">
                            Pas de photo
                          </div>
                        )}
                        <div className="p-3 flex-1 flex flex-col">
                          {editingId === p.id ? (
                            <div className="flex flex-col gap-2">
                              <input type="text" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} className={inputClass} />
                              <input type="text" inputMode="decimal" value={editPrice} onChange={(e) => setEditPrice(e.target.value)} className={inputClass} />
                              <input type="number" min="0" value={editStock} onChange={(e) => setEditStock(e.target.value)} className={inputClass} />
                              <div className="flex gap-2">
                                <button type="button" onClick={() => saveEdit(p.id)} className="text-xs bg-amber-600 text-white px-3 py-1.5 rounded-lg font-semibold hover:bg-amber-700">
                                  OK
                                </button>
                                <button type="button" onClick={() => setEditingId(null)} className="text-xs bg-stone-100 text-stone-700 px-3 py-1.5 rounded-lg hover:bg-stone-200">
                                  Annuler
                                </button>
                              </div>
                            </div>
                          ) : (
                            <>
                              <p className="text-[11px] text-stone-400 mb-1">Emplacement {i + 1}</p>
                              <h3 className="font-bold text-sm text-stone-900 break-words">{p.title}</h3>
                              <p className="text-amber-600 font-extrabold text-sm">{euro(p.price_cents)}</p>
                              <span className={`inline-block mt-1 text-[11px] font-semibold px-2 py-0.5 rounded-full ${stockInfo(p.stock).cls}`}>
                                {stockInfo(p.stock).label}
                              </span>
                              <div className="mt-auto pt-3 flex gap-2">
                                <button type="button" onClick={() => startEdit(p)} className="text-xs bg-stone-100 text-stone-700 px-2.5 py-1.5 rounded-lg font-medium hover:bg-stone-200">
                                  Modifier
                                </button>
                                <button type="button" onClick={() => handleDelete(p.id)} className="text-xs bg-red-50 text-red-600 px-2.5 py-1.5 rounded-lg font-medium hover:bg-red-100">
                                  Retirer
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    ) : (
                      <button
                        key={"vide-" + i}
                        type="button"
                        onClick={() => setShowAdd(true)}
                        className="min-h-[220px] rounded-2xl border-2 border-dashed border-stone-300 bg-white/60 text-stone-400 flex flex-col items-center justify-center gap-1 hover:border-amber-500 hover:text-amber-600 hover:bg-amber-50 transition"
                      >
                        <span className="text-3xl leading-none">+</span>
                        <span className="text-xs font-semibold">Emplacement {i + 1}</span>
                        <span className="text-[11px]">Libre</span>
                      </button>
                    )
                  )}
                </div>
              </div>
            )}

            {tab === "stock" && (
              <div className="flex flex-col gap-6">
                <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-xs text-stone-500 border-b border-stone-200">
                        <th className="p-4 font-medium">Article</th>
                        <th className="p-4 font-medium">Prix</th>
                        <th className="p-4 font-medium">Stock</th>
                        <th className="p-4 font-medium">Ajuster</th>
                        <th className="p-4 font-medium">État</th>
                      </tr>
                    </thead>
                    <tbody>
                      {products.length === 0 && (
                        <tr>
                          <td colSpan={5} className="p-8 text-center text-stone-500">
                            Aucun article pour le moment.
                          </td>
                        </tr>
                      )}
                      {products.map((p) => (
                        <tr key={p.id} className="border-b border-stone-100 last:border-0">
                          <td className="p-4 font-semibold">{p.title}</td>
                          <td className="p-4">{euro(p.price_cents)}</td>
                          <td className="p-4 font-bold">{p.stock}</td>
                          <td className="p-4">
                            <div className="flex items-center gap-2">
                              <button type="button" aria-label="Retirer une pièce" onClick={() => adjustStock(p, -1)} className="w-8 h-8 rounded-lg bg-stone-100 hover:bg-stone-200 font-bold">
                                −
                              </button>
                              <button type="button" aria-label="Ajouter une pièce" onClick={() => adjustStock(p, 1)} className="w-8 h-8 rounded-lg bg-stone-100 hover:bg-stone-200 font-bold">
                                +
                              </button>
                            </div>
                          </td>
                          <td className="p-4">
                            <span className={`text-xs font-semibold px-3 py-1 rounded-full ${stockInfo(p.stock).cls}`}>
                              {p.stock === 0 ? "Épuisé" : p.stock <= 2 ? "Stock faible" : "Disponible"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm">
                  <h2 className="text-lg font-bold mb-1">Import et export (CSV)</h2>
                  <p className="text-xs text-stone-500 mb-4">
                    Fichier à trois colonnes : titre, prix, stock. Ouvrable avec Excel ou Google Sheets.
                  </p>
                  <div className="flex flex-wrap gap-3">
                    <button type="button" onClick={exportProducts} className="bg-stone-900 text-white text-sm font-semibold px-5 py-2.5 rounded-lg hover:bg-stone-800 transition">
                      Télécharger mes articles
                    </button>
                    <label className="text-sm font-semibold border border-stone-300 px-5 py-2.5 rounded-lg cursor-pointer hover:bg-stone-100 transition">
                      Importer un fichier CSV
                      <input
                        type="file"
                        accept=".csv,text/csv"
                        className="hidden"
                        onChange={(e) => {
                          const f = e.target.files ? e.target.files.item(0) : null;
                          if (f) importProducts(f);
                          e.target.value = "";
                        }}
                      />
                    </label>
                  </div>
                </div>
              </div>
            )}

            {tab === "commandes" && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold">Mes commandes ({paidSales.length})</h2>
                  {sales.length > 0 && (
                    <button type="button" onClick={exportSales} className="bg-stone-900 text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-stone-800 transition">
                      Télécharger en CSV
                    </button>
                  )}
                </div>
                {sales.length === 0 ? (
                  <div className="bg-white p-10 rounded-2xl border border-stone-200 text-center text-stone-500">
                    Aucune commande pour le moment. Elles apparaîtront ici dès qu’un acheteur aura payé.
                  </div>
                ) : (
                  <div className="flex flex-col gap-4">
                    {sales.map((s) => (
                      <div key={s.id} className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <p className="font-bold text-stone-900">
                              {s.title} × {s.quantity}
                            </p>
                            <p className="text-amber-600 font-extrabold">{euro(s.unit_price_cents * s.quantity)}</p>
                          </div>
                          <span
                            className={`text-xs font-semibold px-3 py-1 rounded-full ${
                              s.order && s.order.status === "paid" ? "bg-emerald-50 text-emerald-800" : "bg-stone-100 text-stone-600"
                            }`}
                          >
                            {s.order && s.order.status === "paid" ? "Payée, à expédier" : s.order ? s.order.status : "Inconnue"}
                          </span>
                        </div>
                        {s.order && (
                          <div className="mt-3 text-sm text-stone-600">
                            <p>
                              <span className="font-semibold text-stone-800">{s.order.shipping_name || "Acheteur"}</span>
                              {s.order.buyer_email ? " · " + s.order.buyer_email : ""}
                            </p>
                            <p>{formatAddress(s.order.shipping_address)}</p>
                            {s.order.paid_at && (
                              <p className="text-xs text-stone-400 mt-1">Payée le {new Date(s.order.paid_at).toLocaleString("fr-BE")}</p>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {tab === "compte" && profile && (
              <div className="max-w-xl bg-white p-6 rounded-2xl border border-stone-200 shadow-sm">
                <h2 className="text-lg font-bold mb-2">Mon compte</h2>
                {detailRow("Adresse e-mail", email)}
                {detailRow("Inscrite depuis le", memberSince)}
                {detailRow("Type de compte", "Vendeur")}
                {detailRow("Nom de la boutique", profile.shop_name)}
                {detailRow("Nom et prénom", profile.full_name)}
                {detailRow("Téléphone", profile.phone)}
                {detailRow("Date de naissance", profile.birth_date ? new Date(profile.birth_date).toLocaleDateString("fr-BE") : null)}
                {detailRow("Adresse", [profile.address, [profile.postal_code, profile.city].filter(Boolean).join(" ")].filter(Boolean).join(", "))}
                {detailRow("Je vends en tant que", profile.seller_status === "professionnel" ? "Professionnel" : "Particulier")}
                {profile.seller_status === "professionnel" && detailRow("N° d’entreprise ou de TVA", profile.vat_number)}
                <Link
                  href="/profil"
                  className="inline-block mt-5 bg-amber-600 text-white text-sm font-semibold px-5 py-2.5 rounded-lg hover:bg-amber-700 transition"
                >
                  Modifier mon profil
                </Link>
              </div>
            )}
          </>
        )}
      </main>

      {showAdd && (
        <div className="fixed inset-0 z-20 bg-black/50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">Ajouter un article</h2>
              <button type="button" onClick={() => setShowAdd(false)} className="text-sm text-stone-500 hover:text-stone-900">
                Fermer ✕
              </button>
            </div>
            <form onSubmit={handleAddProduct} className="flex flex-col gap-3">
              <div>
                <label htmlFor="photo" className="block text-xs font-medium text-stone-600 mb-1">
                  Photo
                </label>
                <input
                  id="photo"
                  key={fileKey}
                  type="file"
                  accept="image/*"
                  onChange={(e) => setFile(e.target.files ? e.target.files.item(0) : null)}
                  className="text-sm text-stone-600"
                />
              </div>
              <input type="text" placeholder="Nom de la création" value={title} onChange={(e) => setTitle(e.target.value)} required className={inputClass} />
              <input type="text" inputMode="decimal" placeholder="Prix (€)" value={price} onChange={(e) => setPrice(e.target.value)} required className={inputClass} />
              <input type="number" min="0" placeholder="Quantité en stock" value={stock} onChange={(e) => setStock(e.target.value)} className={inputClass} />
              <button
                type="submit"
                disabled={saving}
                className="mt-2 bg-amber-600 text-white font-semibold py-2.5 rounded-lg hover:bg-amber-700 transition disabled:opacity-50"
              >
                {saving ? "Publication..." : "+ Publier dans ma boutique"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
