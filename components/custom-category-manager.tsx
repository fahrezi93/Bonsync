"use client";

import { useState, useTransition } from "react";
import { Check, Pencil, Plus, Trash2, Tag, Loader2, X } from "lucide-react";
import { addCategory, deleteCategory, updateCategory } from "@/actions/category-actions";
import { AVAILABLE_ICONS, AVAILABLE_COLORS, PREDEFINED_CATEGORIES } from "@/lib/categories";

type CategoryProps = {
  categories: Array<{ id: string; name: string; icon: string | null; color: string | null }>;
};

export function CustomCategoryManager({ categories }: CategoryProps) {
  const [isPending, startTransition] = useTransition();
  const [errorMsg, setErrorMsg] = useState("");
  const [newCatName, setNewCatName] = useState("");
  const [selectedIcon, setSelectedIcon] = useState<string>("Tag");
  const [selectedColor, setSelectedColor] = useState<string>(AVAILABLE_COLORS[0]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editIcon, setEditIcon] = useState("Tag");
  const [editColor, setEditColor] = useState(AVAILABLE_COLORS[0]);

  const handleAdd = () => {
    if (!newCatName.trim()) return;
    setErrorMsg("");
    startTransition(async () => {
      const res = await addCategory(newCatName, selectedColor, selectedIcon);
      if (!res.success) {
        setErrorMsg(res.message);
      } else {
        setNewCatName("");
        setSelectedIcon("Tag");
        setSelectedColor(AVAILABLE_COLORS[Math.floor(Math.random() * AVAILABLE_COLORS.length)]);
      }
    });
  };

  const handleDelete = (id: string) => {
    startTransition(async () => {
      const res = await deleteCategory(id);
      if (!res.success) setErrorMsg(res.message);
    });
  };

  const startEdit = (category: CategoryProps["categories"][number]) => {
    setEditingId(category.id);
    setEditName(category.name);
    setEditIcon(category.icon ?? "Tag");
    setEditColor(category.color ?? AVAILABLE_COLORS[0]);
    setErrorMsg("");
  };

  const handleUpdate = () => {
    if (!editingId || !editName.trim()) return;
    startTransition(async () => {
      const res = await updateCategory(editingId, editName, editColor, editIcon);
      if (!res.success) {
        setErrorMsg(res.message);
        return;
      }
      setEditingId(null);
    });
  };

  return (
    <div className="premium-card p-6 flex flex-col gap-6 w-full animate-fade-in-up" style={{ animationDelay: "100ms" }}>
      <div className="space-y-1">
        <h2 className="text-xl font-bold text-slate-800">Kategori Kustom</h2>
        <p className="text-sm text-slate-500">
          Buat kategori khusus untuk BonSync AI agar lebih personal saat mengklasifikasikan nota belanja Anda.
        </p>
      </div>

      <div className="space-y-4">
        <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 font-mono">Daftar Kategori Anda</h3>
        <div className="flex flex-wrap gap-2">
          {PREDEFINED_CATEGORIES.map(c => {
            const Icon = AVAILABLE_ICONS[c.icon] || Tag;
            return (
              <span key={c.name} className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold ${c.color} opacity-70`}>
                <Icon className="w-3.5 h-3.5" />
                {c.label} (Bawaan)
              </span>
            );
          })}
          {categories.map((c) => {
            const Icon = (c.icon && AVAILABLE_ICONS[c.icon]) ? AVAILABLE_ICONS[c.icon] : Tag;
            const colorClass = c.color || "bg-slate-100 text-slate-600 border-slate-200";
            const isEditing = editingId === c.id;

            if (isEditing) {
              return (
                <div key={c.id} className="flex w-full flex-col gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3 sm:flex-row sm:items-center">
                  <input
                    value={editName}
                    onChange={(event) => setEditName(event.target.value)}
                    className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-800 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                  <select
                    value={editIcon}
                    onChange={(event) => setEditIcon(event.target.value)}
                    className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-800 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  >
                    {Object.keys(AVAILABLE_ICONS).map((iconName) => (
                      <option key={iconName} value={iconName}>{iconName}</option>
                    ))}
                  </select>
                  <select
                    value={editColor}
                    onChange={(event) => setEditColor(event.target.value)}
                    className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-800 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  >
                    {AVAILABLE_COLORS.map((colorClassOption, i) => (
                      <option key={colorClassOption} value={colorClassOption}>Warna {i + 1}</option>
                    ))}
                  </select>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleUpdate}
                      disabled={isPending}
                      className="inline-flex size-10 items-center justify-center rounded-xl bg-emerald-500 text-white transition-transform active:scale-[0.96] disabled:opacity-50"
                      aria-label="Simpan kategori"
                    >
                      <Check className="size-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingId(null)}
                      className="inline-flex size-10 items-center justify-center rounded-xl bg-slate-200 text-slate-600 transition-transform active:scale-[0.96]"
                      aria-label="Batal edit kategori"
                    >
                      <X className="size-4" />
                    </button>
                  </div>
                </div>
              );
            }

            return (
              <span key={c.id} className={`group inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold ${colorClass} transition-all`}>
                <Icon className="w-3.5 h-3.5" />
                {c.name}
                <button
                  type="button"
                  onClick={() => startEdit(c)}
                  disabled={isPending}
                  className="ml-1 text-current opacity-50 hover:opacity-100 transition-opacity disabled:opacity-30"
                  title="Edit kategori"
                  aria-label={`Edit kategori ${c.name}`}
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(c.id)}
                  disabled={isPending}
                  className="ml-1 text-current opacity-50 hover:opacity-100 hover:text-rose-600 transition-opacity disabled:opacity-30"
                  title="Hapus kategori"
                  aria-label={`Hapus kategori ${c.name}`}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </span>
            );
          })}
          {categories.length === 0 && (
            <span className="text-xs font-medium text-slate-400 italic py-1.5">Belum ada kategori kustom.</span>
          )}
        </div>
      </div>

      <div className="border-t border-slate-100 pt-5">
        <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 font-mono mb-4">Tambah Kategori Baru</h3>
        
        {errorMsg && (
          <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-bold text-rose-700 animate-fade-in-up">
            ⚠️ {errorMsg}
          </div>
        )}

        <div className="flex flex-col md:flex-row gap-3 items-end">
          <div className="flex-1 w-full space-y-2">
            <label className="text-[11px] font-bold text-slate-500 ml-1">NAMA KATEGORI</label>
            <input
              type="text"
              value={newCatName}
              onChange={(e) => setNewCatName(e.target.value)}
              placeholder="Contoh: Kucing, Skincare, dll"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 transition-all"
            />
          </div>
          
          <div className="w-full md:w-32 space-y-2">
            <label className="text-[11px] font-bold text-slate-500 ml-1">IKON</label>
            <select
              value={selectedIcon}
              onChange={(e) => setSelectedIcon(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 transition-all appearance-none"
            >
              {Object.keys(AVAILABLE_ICONS).map(iconName => (
                <option key={iconName} value={iconName}>{iconName}</option>
              ))}
            </select>
          </div>

          <div className="w-full md:w-32 space-y-2">
            <label className="text-[11px] font-bold text-slate-500 ml-1">WARNA</label>
            <select
              value={selectedColor}
              onChange={(e) => setSelectedColor(e.target.value)}
              className={`w-full rounded-xl border px-3 py-3 text-sm font-bold focus:outline-none focus:ring-2 transition-all appearance-none ${selectedColor.split(" ")[0]} ${selectedColor.split(" ")[1]} ${selectedColor.split(" ")[2]}`}
            >
              {AVAILABLE_COLORS.map((colorClass, i) => (
                <option key={i} value={colorClass}>Warna {i + 1}</option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={handleAdd}
            disabled={isPending || !newCatName.trim()}
            className="w-full md:w-auto flex h-[46px] items-center justify-center gap-2 rounded-xl bg-slate-900 px-6 py-3 text-sm font-bold text-white hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            <span>Tambah</span>
          </button>
        </div>
      </div>
    </div>
  );
}
