"use client";

import { useState, useTransition, useEffect, useRef } from "react";
import { Check, Pencil, Plus, Trash2, Tag, Loader2, X, ChevronDown } from "lucide-react";
import { addCategory, deleteCategory, updateCategory } from "@/actions/category-actions";
import { AVAILABLE_ICONS, AVAILABLE_COLORS, PREDEFINED_CATEGORIES } from "@/lib/categories";

const ICON_OPTIONS = [
  { value: "Utensils", label: "Makanan 🍽️" },
  { value: "Coffee", label: "Kopi/Kafe ☕" },
  { value: "Car", label: "Transportasi 🚗" },
  { value: "Plane", label: "Liburan/Travel ✈️" },
  { value: "ShoppingBag", label: "Belanja 🛍️" },
  { value: "Heart", label: "Kesehatan ❤️" },
  { value: "skincare", label: "Skincare 🧴" },
  { value: "Gamepad2", label: "Hiburan 🎮" },
  { value: "Package", label: "Paket 📦" },
  { value: "Smartphone", label: "Pulsa/Kuota 📱" },
  { value: "Tag", label: "Label 🏷️" },
  { value: "Folder", label: "Folder 📁" },
  { value: "Gift", label: "Hadiah/Donasi 🎁" },
  { value: "Wrench", label: "Perbaikan 🛠️" },
  { value: "CreditCard", label: "Cicilan/Kartu 💳" },
  { value: "Sparkles", label: "Berkilau ✨" },
  { value: "Book", label: "Edukasi 📚" },
  { value: "GraduationCap", label: "Sekolah/Kuliah 🎓" },
  { value: "Home", label: "Rumah 🏠" },
  { value: "Zap", label: "Listrik ⚡" },
  { value: "Scissors", label: "Gunting/Hobi ✂️" },
  { value: "Droplet", label: "Air/Utilitas 💧" },
];

const COLOR_OPTIONS = AVAILABLE_COLORS.map((colorClass, i) => ({
  value: colorClass,
  label: `Warna ${i + 1}`,
  colorClass: colorClass
}));

function CustomDropdown({
  value,
  onChange,
  options,
  renderOption,
  renderValue,
  className = "",
  placement = "bottom"
}: {
  value: string;
  onChange: (v: string) => void;
  options: any[];
  renderOption: (opt: any) => React.ReactNode;
  renderValue: (opt: any) => React.ReactNode;
  className?: string;
  placement?: "top" | "bottom";
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedOption = options.find(o => o.value === value) || options[0];

  return (
    <div className="relative w-full" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex w-full items-center justify-between border border-slate-200 bg-white px-4 text-sm font-medium text-slate-800 shadow-sm transition-all focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 ${className}`}
      >
        <div className="flex items-center gap-2 truncate">
          {renderValue(selectedOption)}
        </div>
        <ChevronDown className={`ml-2 h-4 w-4 shrink-0 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className={`absolute z-50 max-h-60 w-full overflow-auto rounded-xl border border-slate-100 bg-white p-1 shadow-lg custom-scrollbar ${placement === "top" ? "bottom-full mb-2" : "mt-2"}`}>
          {options.map((opt, i) => (
            <button
              key={i}
              type="button"
              onClick={() => {
                onChange(opt.value);
                setIsOpen(false);
              }}
              className={`flex w-full items-center rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-slate-50 ${value === opt.value ? 'bg-emerald-50 text-emerald-700 font-semibold' : 'text-slate-700'}`}
            >
              {renderOption(opt)}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

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
    <div className="premium-card p-6 md:p-8 flex flex-col gap-6 md:gap-8 w-full animate-fade-in-up" style={{ animationDelay: "100ms" }}>
      <div className="flex flex-col gap-1">
        <h2 className="text-xl md:text-2xl font-bold tracking-tight text-slate-800">Kategori Kustom</h2>
        <p className="text-sm font-medium text-slate-500">
          Buat kategori khusus untuk lebih personal saat mengklasifikasikan pengeluaran Anda.
        </p>
      </div>

      <div className="flex flex-col gap-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 pl-1">Daftar Kategori Anda</h3>
        <div className="flex flex-wrap gap-2.5">
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
                  <div className="w-full sm:w-40">
                    <CustomDropdown
                      value={editIcon}
                      onChange={setEditIcon}
                      options={ICON_OPTIONS}
                      className="py-2 rounded-xl"
                      renderValue={(opt) => <span>{opt.label}</span>}
                      renderOption={(opt) => <span>{opt.label}</span>}
                    />
                  </div>
                  <div className="w-full sm:w-40">
                    <CustomDropdown
                      value={editColor}
                      onChange={setEditColor}
                      options={COLOR_OPTIONS}
                      className="py-2 rounded-xl"
                      renderValue={(opt) => (
                        <div className="flex items-center gap-2">
                          <div className={`size-4 rounded-full shadow-inner bg-current ${opt.colorClass.split(" ")[1]}`} />
                          <span>{opt.label}</span>
                        </div>
                      )}
                      renderOption={(opt) => (
                        <div className="flex items-center gap-2">
                          <div className={`size-4 rounded-full shadow-inner bg-current ${opt.colorClass.split(" ")[1]}`} />
                          <span>{opt.label}</span>
                        </div>
                      )}
                    />
                  </div>
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

      <div className="border-t border-slate-100 pt-6">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 pl-1 mb-4">Tambah Kategori Baru</h3>

        {errorMsg && (
          <div className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm font-medium text-rose-700 animate-fade-in-up">
            ⚠️ {errorMsg}
          </div>
        )}

        <div className="flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1 w-full space-y-2">
            <label className="text-[11px] font-bold text-slate-500 ml-1">NAMA KATEGORI</label>
            <input
              type="text"
              value={newCatName}
              onChange={(e) => setNewCatName(e.target.value)}
              placeholder="Contoh: Kucing, Skincare, dll"
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-sm font-medium text-slate-800 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 shadow-sm transition-all"
            />
          </div>

          <div className="w-full md:w-48 space-y-2">
            <label className="text-[11px] font-bold text-slate-500 ml-1">IKON</label>
            <CustomDropdown
              value={selectedIcon}
              onChange={setSelectedIcon}
              options={ICON_OPTIONS}
              className="py-3.5 rounded-2xl"
              placement="top"
              renderValue={(opt) => <span>{opt.label}</span>}
              renderOption={(opt) => <span>{opt.label}</span>}
            />
          </div>

          <div className="w-full md:w-40 space-y-2">
            <label className="text-[11px] font-bold text-slate-500 ml-1">WARNA</label>
            <CustomDropdown
              value={selectedColor}
              onChange={setSelectedColor}
              options={COLOR_OPTIONS}
              className="py-3.5 rounded-2xl"
              placement="top"
              renderValue={(opt) => (
                <div className="flex items-center gap-2">
                  <div className={`size-4 rounded-full shadow-inner bg-current ${opt.colorClass.split(" ")[1]}`} />
                  <span>{opt.label}</span>
                </div>
              )}
              renderOption={(opt) => (
                <div className="flex items-center gap-2">
                  <div className={`size-4 rounded-full shadow-inner bg-current ${opt.colorClass.split(" ")[1]}`} />
                  <span>{opt.label}</span>
                </div>
              )}
            />
          </div>

          <button
            type="button"
            onClick={handleAdd}
            disabled={isPending || !newCatName.trim()}
            className="w-full md:w-auto flex h-[48px] items-center justify-center gap-2 rounded-2xl bg-slate-900 px-6 text-sm font-bold text-white hover:bg-slate-800 hover:shadow-md transition-all active:scale-[0.96] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none"
          >
            {isPending ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
            <span>Tambah Kategori</span>
          </button>
        </div>
      </div>
    </div>
  );
}

