"use client";

import { useState, useEffect, useCallback, Fragment } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "../../lib/supabase";

type Product = {
  id: string;
  title: string;
  price_cents: number;
  image_url: string | null;
  stock: number;
  description: string | null;
  category: string | null;
};

type Variant = {
  id: string;
  product_id: string;
  label: string;
  stock: number;
  position: number;
};

type FormVariant = { id: string | null; label: string; stock: string };

const CATEGORIES = [
  { value: "femme", label: "Femme" },
  { value: "homme", label: "Homme" },
  { value: "enfant", label: "Enfant" },
  { value: "autre", label: "Autre" },
];

const categoryLabel = (c: string | null) => {
  const found = CATEGORIES.find((x) => x.value === c);
  return found ? found.label : "Sans catégorie";
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

type Tab = "accueil" | "articles" | "stock" | "commandes" | "compte";

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
  const [variants, setVariants] = useState<Variant[]>([]);
  const [sales, setSales] = useState<SaleLine[]>([]);

  const [sheetOpen, setSheetOpen] = useState(false);
  const [sheetId, setSheetId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [fTitle, setFTitle] = useState("");
  const [fDesc, setFDesc] = useState("");
  const [fCategory, setFCategory] = useState("");
  const [fPrice, setFPrice] = useState("");
  const [fStock, setFStock] = useState("1");
  const [fFile, setFFile] = useState<File | null>(null);
  const [fImage, setFImage] = useState<string | null>(null);
  const [fVariants, setFVariants] = useState<FormVariant[]>([]);
  const [fileKey, setFileKey] = useState(0);

  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const showNotice = (text: string, type: "success" | "error" = "success") => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 6000);
  };

  const loadProducts = useCallback(async (uid: string) => {
    const { data, error } = await supabase
      .from("boutique_products")
      .select("id,title,price_cents,image_url,stock,description,category")
      .eq("seller_id", uid)
      .order("created_at", { ascending: true });
    if (error || !data) return;
    setProducts(data as Product[]);
    const ids = (data as Product[]).map((p) => p.id);
    if (ids.length === 0) {
      setVariants([]);
      return;
    }
    const { data: vdata } = await supabase
      .from("product_variants")
      .select("id,product_id,label,stock,position")
      .in("product_id", ids)
      .order("position", { ascending: true });
    setVariants((vdata || []) as Variant[]);
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

  const variantsOf = (productId: string) => variants.filter((v) => v.product_id === productId);

  const openNew = () => {
    setSheetId(null);
    setFTitle("");
    setFDesc("");
    setFCategory("");
    setFPrice("");
    setFStock("1");
    setFFile(null);
    setFImage(null);
    setFVariants([]);
    setFileKey((k) => k + 1);
    setSheetOpen(true);
  };

  const openEdit = (p: Product) => {
    setSheetId(p.id);
    setFTitle(p.title);
    setFDesc(p.description || "");
    setFCategory(p.category || "");
    setFPrice((p.price_cents / 100).toFixed(2));
    setFStock(String(p.stock));
    setFFile(null);
    setFImage(p.image_url);
    setFVariants(variantsOf(p.id).map((v) => ({ id: v.id, label: v.label, stock: String(v.stock) })));
    setFileKey((k) => k + 1);
    setSheetOpen(true);
  };

  const addVariantRow = () => setFVariants((list) => [...list, { id: null, label: "", stock: "0" }]);

  const addStandardSizes = () =>
    setFVariants((list) => {
      const have = list.map((v) => v.label.trim().toLowerCase());
      const extra = ["S", "M", "L"]
        .filter((s) => !have.includes(s.toLowerCase()))
        .map((s) => ({ id: null, label: s, stock: "0" }));
      return [...list, ...extra];
    });

  const updateVariantRow = (index: number, patch: Partial<FormVariant>) =>
    setFVariants((list) => list.map((v, i) => (i === index ? { ...v, ...patch } : v)));

  const removeVariantRow = (index: number) => setFVariants((list) => list.filter((_, i) => i !== index));

  const saveSheet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;

    const numericPrice = parseFloat(fPrice.replace(",", "."));
    if (!fTitle.trim() || isNaN(numericPrice) || numericPrice < 0.5) {
      showNotice("Entrez un titre et un prix d’au moins 0,50 €.", "error");
      return;
    }
    if (!fCategory) {
      showNotice("Choisissez une catégorie (femme, homme, enfant ou autre).", "error");
      return;
    }
    const cleaned = fVariants.map((v) => ({ id: v.id, label: v.label.trim(), stock: parseInt(v.stock) }));
    if (cleaned.some((v) => !v.label || isNaN(v.stock) || v.stock < 0)) {
      showNotice("Chaque variante doit avoir un nom (par exemple S) et un stock (0 ou plus).", "error");
      return;
    }
    const lowered = cleaned.map((v) => v.label.toLowerCase());
    if (new Set(lowered).size !== lowered.length) {
      showNotice("Deux variantes portent le même nom.", "error");
      return;
    }
    const plainStock = parseInt(fStock);
    if (cleaned.length === 0 && (isNaN(plainStock) || plainStock < 0)) {
      showNotice("Indiquez le stock de l’article (0 ou plus).", "error");
      return;
    }

    setSaving(true);

    let imageUrl = fImage || "";
    if (fFile) {
      const ext = (fFile.name.split(".").pop() || "").toLowerCase();
      if (!["jpg", "jpeg", "png", "webp", "gif"].includes(ext)) {
        showNotice("La photo doit être au format JPG, PNG, WEBP ou GIF.", "error");
        setSaving(false);
        return;
      }
      const fileName = `boutique-${userId}-${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage.from("products").upload(fileName, fFile);
      if (uploadError) {
        showNotice("Photo non envoyée : " + uploadError.message, "error");
        setSaving(false);
        return;
      }
      imageUrl = supabase.storage.from("products").getPublicUrl(fileName).data.publicUrl;
    }

    const baseFields = {
      title: fTitle.trim(),
      description: fDesc.trim() || null,
      category: fCategory,
      price_cents: Math.round(numericPrice * 100),
      image_url: imageUrl,
    };

    let productId = sheetId;
    if (!productId) {
      const { data, error } = await supabase
        .from("boutique_products")
        .insert([
          {
            ...baseFields,
            stock: cleaned.length > 0 ? cleaned.reduce((sum, v) => sum + v.stock, 0) : plainStock,
            seller_id: userId,
            shop_name: shopName,
          },
        ])
        .select("id")
        .single();
      if (error || !data) {
        showNotice(error ? error.message : "Création impossible.", "error");
        setSaving(false);
        return;
      }
      productId = data.id as string;
    } else {
      const { error } = await supabase
        .from("boutique_products")
        .update(baseFields)
        .eq("id", productId)
        .eq("seller_id", userId);
      if (error) {
        showNotice(error.message, "error");
        setSaving(false);
        return;
      }
    }

    let problem = "";
    const keptIds = cleaned.filter((v) => v.id).map((v) => v.id as string);
    for (const old of variantsOf(productId)) {
      if (!keptIds.includes(old.id)) {
        const { error } = await supabase.from("product_variants").delete().eq("id", old.id);
        if (error && !problem) problem = error.message;
      }
    }
    for (let i = 0; i < cleaned.length; i++) {
      const v = cleaned[i];
      if (v.id) {
        const { error } = await supabase
          .from("product_variants")
          .update({ label: v.label, stock: v.stock, position: i })
          .eq("id", v.id);
        if (error && !problem) problem = error.message;
      } else {
        const { error } = await supabase
          .from("product_variants")
          .insert([{ product_id: productId, label: v.label, stock: v.stock, position: i }]);
        if (error && !problem) problem = error.message;
      }
    }
    if (cleaned.length === 0) {
      const { error } = await supabase
        .from("boutique_products")
        .update({ stock: plainStock })
        .eq("id", productId)
        .eq("seller_id", userId);
      if (error && !problem) problem = error.message;
    }

    setSaving(false);
    await loadProducts(userId);
    if (problem) {
      showNotice("Article enregistré, mais : " + problem, "error");
      return;
    }
    showNotice(sheetId ? "Article mis à jour." : "Article publié dans votre boutique.");
    setSheetOpen(false);
  };

  const deleteProduct = async (id: string) => {
    if (!userId) return;
    if (!window.confirm("Retirer cet article de votre boutique, avec toutes ses variantes ?")) return;
    const { error } = await supabase.from("boutique_products").delete().eq("id", id).eq("seller_id", userId);
    if (error) {
      showNotice(error.message, "error");
      return;
    }
    showNotice("Article retiré.");
    setSheetOpen(false);
    loadProducts(userId);
  };

  const adjustProductStock = async (p: Product, delta: number) => {
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

  const adjustVariantStock = async (v: Variant, delta: number) => {
    if (!userId) return;
    const next = Math.max(0, v.stock + delta);
    if (next === v.stock) return;
    const { error } = await supabase.from("product_variants").update({ stock: next }).eq("id", v.id);
    if (error) {
      showNotice(error.message, "error");
      return;
    }
    loadProducts(userId);
  };

  const exportProducts = () => {
    downloadCsv("mes-articles.csv", [
      ["titre", "prix", "stock", "categorie", "description"],
      ...products.map((p) => [
        p.title,
        (p.price_cents / 100).toFixed(2).replace(".", ","),
        p.stock,
        p.category || "",
        p.description || "",
      ]),
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
      const rowCategory = (r[3] || "").trim().toLowerCase();
      const rowDesc = (r[4] || "").trim();
      if (i === 0 && isNaN(rowPrice)) continue;
      if (!rowTitle || isNaN(rowPrice) || rowPrice < 0.5) continue;
      const { error } = await supabase.from("boutique_products").insert([
        {
          title: rowTitle,
          price_cents: Math.round(rowPrice * 100),
          image_url: "",
          stock: isNaN(rowStock) ? 1 : Math.max(0, rowStock),
          category: CATEGORIES.some((c) => c.value === rowCategory) ? rowCategory : "autre",
          description: rowDesc || null,
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
  const variantSummary = (productId: string) =>
    variantsOf(productId)
      .map((v) => `${v.label} : ${v.stock}`)
      .join(" · ");

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center text-stone-500">
        Vérification de votre accès vendeur...
      </div>
    );
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: "accueil", label: "Tableau de bord" },
    { id: "articles", label: `Mes articles (${products.length}/${MAX_FREE})` },
    { id: "stock", label: "Stock" },
    { id: "commandes", label: `Commandes (${paidSales.length})` },
    { id: "compte", label: "Mon compte" },
  ];

  const inputClass = "p-2.5 border border-stone-300 rounded-lg text-sm w-full bg-white";
  const labelClass = "block text-xs font-medium text-stone-600 mb-1";
  const cardClass = "bg-white p-6 rounded-2xl border border-stone-200 shadow-sm";

  const detailRow = (label: string, value: string | null | undefined) => (
    <div className="flex justify-between gap-4 py-3 border-b border-stone-100 last:border-0 text-sm">
      <span className="text-stone-500">{label}</span>
      <span className="font-medium text-stone-900 text-right">{value ? value : "Non renseigné"}</span>
    </div>
  );

  const thumb = (p: Product, size: string) =>
    p.image_url ? (
      <img src={p.image_url} alt={p.title} className={`${size} object-cover rounded-lg border border-stone-200`} />
    ) : (
      <div className={`${size} rounded-lg bg-stone-100 border border-stone-200 flex items-center justify-center text-[10px] text-stone-400`}>
        Photo
      </div>
    );

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900">
      <header className="bg-white border-b border-stone-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="text-xl font-extrabold tracking-tight text-stone-900">
            AVENUE DES <span className="text-amber-600">CRÉATEURS</span>
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
                  onClick={() => { setTab(t.id); setSheetOpen(false); }}
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
                <div className={cardClass}>
                  <h2 className="text-lg font-bold">Bienvenue, {shopName}</h2>
                  <p className="text-sm text-stone-600 mt-1">
                    Vous utilisez {products.length} emplacement{products.length > 1 ? "s" : ""} sur {MAX_FREE} gratuits.
                  </p>
                  <div className="h-2 bg-stone-100 rounded-full mt-4 overflow-hidden">
                    <div className="h-full bg-amber-500" style={{ width: `${Math.min(100, (products.length / MAX_FREE) * 100)}%` }} />
                  </div>
                  <button
                    type="button"
                    onClick={() => { setTab("articles"); openNew(); }}
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

                <div className={cardClass}>
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
                          {variantsOf(p.id).length > 0 && (
                            <span className="block text-xs text-stone-500 mt-0.5">{variantSummary(p.id)}</span>
                          )}
                        </span>
                        <span className={`text-xs font-semibold px-3 py-1 rounded-full whitespace-nowrap ${stockInfo(p.stock).cls}`}>
                          {stockInfo(p.stock).label}
                        </span>
                      </div>
                    ))
                  )}
                </div>

                <div className={cardClass}>
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

            {tab === "articles" && !sheetOpen && (
              <div>
                <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                  <h2 className="text-lg font-bold">
                    Mes articles ({products.length} / {MAX_FREE})
                  </h2>
                  <button
                    type="button"
                    onClick={openNew}
                    disabled={products.length >= MAX_FREE}
                    className="bg-amber-600 text-white text-sm font-semibold px-5 py-2.5 rounded-lg hover:bg-amber-700 transition disabled:opacity-50"
                  >
                    + Ajouter un article
                  </button>
                </div>

                <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
                  {products.length === 0 ? (
                    <div className="p-10 text-center text-stone-500 text-sm">
                      Aucun article pour le moment. Cliquez sur « Ajouter un article » pour créer votre première fiche produit.
                    </div>
                  ) : (
                    products.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => openEdit(p)}
                        className="w-full flex items-center gap-4 p-4 border-b border-stone-100 last:border-0 text-left hover:bg-stone-50 transition"
                      >
                        {thumb(p, "w-14 h-14 shrink-0")}
                        <span className="flex-1 min-w-0">
                          <span className="block font-semibold text-stone-900 truncate">{p.title}</span>
                          <span className="block text-xs text-stone-500">
                            {categoryLabel(p.category)}
                            {variantsOf(p.id).length > 0
                              ? ` · ${variantsOf(p.id).length} variante${variantsOf(p.id).length > 1 ? "s" : ""}`
                              : " · Sans variante"}
                          </span>
                        </span>
                        <span className={`hidden sm:inline text-xs font-semibold px-3 py-1 rounded-full whitespace-nowrap ${stockInfo(p.stock).cls}`}>
                          {stockInfo(p.stock).label}
                        </span>
                        <span className="font-bold text-amber-600 whitespace-nowrap">{euro(p.price_cents)}</span>
                      </button>
                    ))
                  )}
                </div>
                {products.length < MAX_FREE && (
                  <p className="text-xs text-stone-500 mt-3">
                    Il vous reste {MAX_FREE - products.length} emplacement{MAX_FREE - products.length > 1 ? "s" : ""} gratuit{MAX_FREE - products.length > 1 ? "s" : ""}. Chaque couleur différente peut être une variante, ou un article à part.
                  </p>
                )}
              </div>
            )}

            {tab === "articles" && sheetOpen && (
              <form onSubmit={saveSheet}>
                <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                  <button type="button" onClick={() => setSheetOpen(false)} className="text-sm font-semibold text-stone-600 hover:text-stone-900">
                    ← Retour aux articles
                  </button>
                  <h2 className="text-lg font-bold">{sheetId ? "Fiche produit" : "Nouvel article"}</h2>
                </div>

                <div className="grid lg:grid-cols-3 gap-6 items-start">
                  <div className="lg:col-span-2 flex flex-col gap-6">
                    <div className={cardClass}>
                      <div className="flex flex-col gap-4">
                        <div>
                          <label htmlFor="fTitle" className={labelClass}>Titre</label>
                          <input id="fTitle" type="text" value={fTitle} onChange={(e) => setFTitle(e.target.value)} required maxLength={120} className={inputClass} />
                        </div>
                        <div>
                          <label htmlFor="fDesc" className={labelClass}>Description</label>
                          <textarea id="fDesc" rows={5} value={fDesc} onChange={(e) => setFDesc(e.target.value)} maxLength={2000} className={inputClass} />
                        </div>
                        <div>
                          <label htmlFor="fCategory" className={labelClass}>Catégorie</label>
                          <select id="fCategory" value={fCategory} onChange={(e) => setFCategory(e.target.value)} className={inputClass}>
                            <option value="">Choisir une catégorie</option>
                            {CATEGORIES.map((c) => (
                              <option key={c.value} value={c.value}>
                                {c.label}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>

                    <div className={cardClass}>
                      <h3 className="font-bold mb-1">Variantes</h3>
                      <p className="text-xs text-stone-500 mb-4">
                        Par exemple des tailles (S, M, L), chacune avec son propre stock. Sans variante, l’article n’a qu’un seul stock.
                      </p>

                      {fVariants.length > 0 && (
                        <div className="flex flex-col gap-2 mb-4">
                          <div className="grid grid-cols-[1fr_110px_36px] gap-2 text-xs text-stone-500">
                            <span>Nom de la variante</span>
                            <span>Stock</span>
                            <span />
                          </div>
                          {fVariants.map((v, i) => (
                            <div key={i} className="grid grid-cols-[1fr_110px_36px] gap-2 items-center">
                              <input
                                type="text"
                                aria-label={`Nom de la variante ${i + 1}`}
                                value={v.label}
                                maxLength={30}
                                onChange={(e) => updateVariantRow(i, { label: e.target.value })}
                                placeholder="S, M, L..."
                                className={inputClass}
                              />
                              <input
                                type="number"
                                min="0"
                                aria-label={`Stock de la variante ${i + 1}`}
                                value={v.stock}
                                onChange={(e) => updateVariantRow(i, { stock: e.target.value })}
                                className={inputClass}
                              />
                              <button
                                type="button"
                                aria-label={`Supprimer la variante ${i + 1}`}
                                onClick={() => removeVariantRow(i)}
                                className="h-9 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 font-bold"
                              >
                                ×
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="flex flex-wrap gap-2">
                        <button type="button" onClick={addVariantRow} className="text-sm font-semibold border border-stone-300 px-4 py-2 rounded-lg hover:bg-stone-100 transition">
                          + Ajouter une variante
                        </button>
                        <button type="button" onClick={addStandardSizes} className="text-sm font-semibold text-amber-700 border border-amber-300 px-4 py-2 rounded-lg hover:bg-amber-50 transition">
                          Ajouter S, M, L
                        </button>
                      </div>

                      {fVariants.length === 0 && (
                        <div className="mt-4 max-w-xs">
                          <label htmlFor="fStock" className={labelClass}>Stock de l’article</label>
                          <input id="fStock" type="number" min="0" value={fStock} onChange={(e) => setFStock(e.target.value)} className={inputClass} />
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col gap-6">
                    <div className={cardClass}>
                      <h3 className="font-bold mb-3">Photo</h3>
                      {fImage ? (
                        <img src={fImage} alt="Aperçu de l’article" className="w-full h-48 object-cover rounded-lg border border-stone-200 mb-3" />
                      ) : (
                        <div className="w-full h-48 rounded-lg bg-stone-100 border border-stone-200 flex items-center justify-center text-sm text-stone-400 mb-3">
                          Pas de photo
                        </div>
                      )}
                      <input
                        key={fileKey}
                        type="file"
                        accept="image/*"
                        aria-label="Choisir une photo"
                        onChange={(e) => setFFile(e.target.files ? e.target.files.item(0) : null)}
                        className="text-sm text-stone-600 w-full"
                      />
                    </div>

                    <div className={cardClass}>
                      <h3 className="font-bold mb-3">Prix</h3>
                      <label htmlFor="fPrice" className={labelClass}>Prix en euros</label>
                      <input id="fPrice" type="text" inputMode="decimal" value={fPrice} onChange={(e) => setFPrice(e.target.value)} required placeholder="25,00" className={inputClass} />
                    </div>

                    <div className="flex flex-col gap-3">
                      <button
                        type="submit"
                        disabled={saving}
                        className="bg-amber-600 text-white font-semibold py-3 rounded-xl hover:bg-amber-700 transition disabled:opacity-50"
                      >
                        {saving ? "Enregistrement..." : sheetId ? "Enregistrer la fiche" : "Publier dans ma boutique"}
                      </button>
                      {sheetId && (
                        <button
                          type="button"
                          onClick={() => deleteProduct(sheetId)}
                          className="text-sm font-semibold text-red-600 bg-red-50 py-2.5 rounded-xl hover:bg-red-100 transition"
                        >
                          Retirer cet article
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </form>
            )}

            {tab === "stock" && (
              <div className="flex flex-col gap-6">
                <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-xs text-stone-500 border-b border-stone-200">
                        <th className="p-4 font-medium">Article / variante</th>
                        <th className="p-4 font-medium">Stock</th>
                        <th className="p-4 font-medium">Ajuster</th>
                        <th className="p-4 font-medium">État</th>
                      </tr>
                    </thead>
                    <tbody>
                      {products.length === 0 && (
                        <tr>
                          <td colSpan={4} className="p-8 text-center text-stone-500">
                            Aucun article pour le moment.
                          </td>
                        </tr>
                      )}
                      {products.map((p) => {
                        const vs = variantsOf(p.id);
                        return (
                          <Fragment key={p.id}>
                            <tr className="border-b border-stone-100 bg-stone-50">
                              <td className="p-4 font-semibold">
                                <span className="flex items-center gap-3">
                                  {thumb(p, "w-9 h-9 shrink-0")}
                                  {p.title}
                                </span>
                              </td>
                              <td className="p-4 font-bold">{p.stock}</td>
                              <td className="p-4">
                                {vs.length === 0 ? (
                                  <div className="flex items-center gap-2">
                                    <button type="button" aria-label="Retirer une pièce" onClick={() => adjustProductStock(p, -1)} className="w-8 h-8 rounded-lg bg-white border border-stone-200 hover:bg-stone-100 font-bold">
                                      −
                                    </button>
                                    <button type="button" aria-label="Ajouter une pièce" onClick={() => adjustProductStock(p, 1)} className="w-8 h-8 rounded-lg bg-white border border-stone-200 hover:bg-stone-100 font-bold">
                                      +
                                    </button>
                                  </div>
                                ) : (
                                  <span className="text-xs text-stone-400">Par variante</span>
                                )}
                              </td>
                              <td className="p-4">
                                <span className={`text-xs font-semibold px-3 py-1 rounded-full ${stockInfo(p.stock).cls}`}>
                                  {p.stock === 0 ? "Épuisé" : p.stock <= 2 ? "Stock faible" : "Disponible"}
                                </span>
                              </td>
                            </tr>
                            {vs.map((v) => (
                              <tr key={v.id} className="border-b border-stone-100 last:border-0">
                                <td className="p-4 pl-16 text-stone-700">{v.label}</td>
                                <td className="p-4 font-bold">{v.stock}</td>
                                <td className="p-4">
                                  <div className="flex items-center gap-2">
                                    <button type="button" aria-label={`Retirer une pièce, ${v.label}`} onClick={() => adjustVariantStock(v, -1)} className="w-8 h-8 rounded-lg bg-stone-100 hover:bg-stone-200 font-bold">
                                      −
                                    </button>
                                    <button type="button" aria-label={`Ajouter une pièce, ${v.label}`} onClick={() => adjustVariantStock(v, 1)} className="w-8 h-8 rounded-lg bg-stone-100 hover:bg-stone-200 font-bold">
                                      +
                                    </button>
                                  </div>
                                </td>
                                <td className="p-4">
                                  <span className={`text-xs font-semibold px-3 py-1 rounded-full ${stockInfo(v.stock).cls}`}>
                                    {v.stock === 0 ? "Épuisé" : v.stock <= 2 ? "Stock faible" : "Disponible"}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </Fragment>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div className={cardClass}>
                  <h2 className="text-lg font-bold mb-1">Import et export (CSV)</h2>
                  <p className="text-xs text-stone-500 mb-4">
                    Colonnes : titre, prix, stock, catégorie (femme, homme, enfant ou autre) et description. Les variantes se gèrent dans la fiche de chaque article.
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
                      <div key={s.id} className={cardClass}>
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
    </div>
  );
}
